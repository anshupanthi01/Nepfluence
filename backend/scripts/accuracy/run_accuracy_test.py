"""Phase 0 accuracy harness (plan §2): compares TikHub - and, if configured,
ScrapeCreators and the official YouTube provider - against hand-recorded ground truth for
10-15 known Nepali creators. This is the hard gate: no production TikHub ingestion code
should be written until this produces a GO verdict.

Requires TIKHUB_API_KEY in backend/.env (SCRAPECREATORS_API_KEY and YOUTUBE_API_KEY are
optional - each provider is skipped if its key isn't set). Fill in
scripts/accuracy/ground_truth.yaml with real creator data before running.

Usage (from backend/):
    UV_PROJECT_ENVIRONMENT=.venv-fresh uv run python scripts/accuracy/run_accuracy_test.py

Outputs:
    scripts/accuracy/results.csv - one row per (creator, platform, provider, field)
    scripts/accuracy/summary.md  - per-provider/platform pass rates + GO/NO-GO verdict
"""
from __future__ import annotations

import asyncio
import csv
import statistics
import sys
from dataclasses import dataclass
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))  # backend/ so `import src...` works

from src.config import settings
from src.influencer_profile.enums import SocialPlatform
from src.social_ingest.providers.base import ProviderError, SocialDataProvider
from src.social_ingest.providers.scrapecreators import ScrapeCreatorsProvider
from src.social_ingest.providers.tikhub import TikHubProvider
from src.social_ingest.providers.youtube_official import YouTubeOfficialProvider

SCRIPT_DIR = Path(__file__).resolve().parent
GROUND_TRUTH_PATH = SCRIPT_DIR / "ground_truth.yaml"
RESULTS_CSV_PATH = SCRIPT_DIR / "results.csv"
SUMMARY_PATH = SCRIPT_DIR / "summary.md"

# --- plan §2 thresholds --------------------------------------------------------------
# FOLLOWER_NANO_* is this script's concrete reading of the plan's "(or ±1 for nano)": for
# accounts under 10k followers, 3% is too few absolute followers to be a meaningful bar, so
# nano accounts get a looser relative tolerance instead. Adjust here if that reading is wrong.
FOLLOWER_PCT_TOLERANCE = 0.03
FOLLOWER_NANO_THRESHOLD = 10_000
FOLLOWER_NANO_PCT_TOLERANCE = 0.10
ENGAGEMENT_PCT_TOLERANCE = 0.15
MIN_POST_COMPLETENESS = 0.90

DISCOVERY_GO_FOLLOWER_PASS_RATE = 0.90
DISCOVERY_GO_ENGAGEMENT_PASS_RATE = 0.80
DISCOVERY_GO_MEDIAN_FOLLOWER_ERROR = 0.03
# --------------------------------------------------------------------------------------


@dataclass
class FieldResult:
    creator: str
    platform: str
    provider: str
    field: str
    ground_truth: float | None
    provider_value: float | None
    pct_error: float | None
    passed: bool


def load_ground_truth() -> list[dict]:
    if not GROUND_TRUTH_PATH.exists():
        raise SystemExit(f"Ground truth file not found: {GROUND_TRUTH_PATH}")
    with GROUND_TRUTH_PATH.open("r", encoding="utf-8") as fh:
        data = yaml.safe_load(fh) or {}
    creators = [c for c in (data.get("creators") or []) if not str(c.get("handle", "")).startswith("REPLACE_ME")]
    if not creators:
        raise SystemExit(
            "ground_truth.yaml has no filled-in creators - replace the REPLACE_ME "
            "placeholders with real data before running."
        )
    return creators


def follower_tolerance(ground_truth_followers: float) -> float:
    if ground_truth_followers < FOLLOWER_NANO_THRESHOLD:
        return FOLLOWER_NANO_PCT_TOLERANCE
    return FOLLOWER_PCT_TOLERANCE


def pct_error(ground_truth: float, provider_value: float | None) -> float | None:
    if provider_value is None or ground_truth == 0:
        return None
    return abs(provider_value - ground_truth) / ground_truth


def engagement_rate(posts: list[dict]) -> float | None:
    rates = []
    for post in posts:
        views = post.get("views")
        if not views:
            continue
        engagement = (post.get("likes") or 0) + (post.get("comments") or 0)
        rates.append(engagement / views * 100)
    if not rates:
        return None
    return statistics.median(rates)


async def evaluate_provider(provider: SocialDataProvider, creator: dict) -> list[FieldResult]:
    platform = SocialPlatform(creator["platform"])
    handle = creator["handle"]
    results: list[FieldResult] = []

    if not provider.supports(platform):
        return results

    gt_followers = creator.get("followers")
    gt_posts = creator.get("recent_posts") or []
    gt_engagement = engagement_rate(gt_posts)

    try:
        profile = await provider.get_profile(platform, handle)
    except ProviderError as exc:
        print(f"  [{provider.name}] {platform.value}/{handle}: get_profile failed: {exc}")
        results.append(FieldResult(handle, platform.value, provider.name, "followers", gt_followers, None, None, False))
        profile = None
    else:
        tol = follower_tolerance(gt_followers) if gt_followers else FOLLOWER_PCT_TOLERANCE
        err = pct_error(gt_followers, profile.followers) if gt_followers else None
        passed = err is not None and err <= tol
        results.append(
            FieldResult(handle, platform.value, provider.name, "followers", gt_followers, profile.followers, err, passed)
        )

    try:
        posts = await provider.get_recent_posts(platform, handle, limit=max(len(gt_posts), 6))
    except ProviderError as exc:
        print(f"  [{provider.name}] {platform.value}/{handle}: get_recent_posts failed: {exc}")
        posts = []

    provider_engagement = engagement_rate(
        [{"views": p.views, "likes": p.likes, "comments": p.comments} for p in posts]
    )
    if gt_engagement is not None:
        err = pct_error(gt_engagement, provider_engagement)
        passed = err is not None and err <= ENGAGEMENT_PCT_TOLERANCE
        results.append(
            FieldResult(
                handle, platform.value, provider.name, "engagement_rate",
                gt_engagement, provider_engagement, err, passed,
            )
        )

    if gt_posts:
        completeness = len(posts) / len(gt_posts)
        results.append(
            FieldResult(
                handle, platform.value, provider.name, "post_completeness",
                len(gt_posts), len(posts), None, completeness >= MIN_POST_COMPLETENESS,
            )
        )

    return results


async def run() -> list[FieldResult]:
    creators = load_ground_truth()

    tikhub = TikHubProvider()
    providers: list[SocialDataProvider] = [tikhub]

    scrapecreators: ScrapeCreatorsProvider | None = None
    if settings.SCRAPECREATORS_API_KEY.get_secret_value():
        scrapecreators = ScrapeCreatorsProvider()
        providers.append(scrapecreators)
    else:
        print("SCRAPECREATORS_API_KEY not set - skipping the ScrapeCreators comparison arm.")

    if settings.YOUTUBE_API_KEY:
        providers.append(YouTubeOfficialProvider())
    else:
        print("YOUTUBE_API_KEY not set - skipping YouTube sanity check.")

    all_results: list[FieldResult] = []
    try:
        for creator in creators:
            print(f"Evaluating {creator['platform']}/{creator['handle']} ...")
            for provider in providers:
                all_results.extend(await evaluate_provider(provider, creator))
    finally:
        await tikhub.aclose()
        if scrapecreators is not None:
            await scrapecreators.aclose()

    return all_results


def write_csv(results: list[FieldResult]) -> None:
    with RESULTS_CSV_PATH.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(
            ["creator", "platform", "provider", "field", "ground_truth", "provider_value", "pct_error", "passed"]
        )
        for r in results:
            writer.writerow([r.creator, r.platform, r.provider, r.field, r.ground_truth, r.provider_value, r.pct_error, r.passed])


def summarize(results: list[FieldResult]) -> str:
    lines = ["# TikHub Accuracy Harness Summary", ""]

    providers = sorted({r.provider for r in results})
    platforms = sorted({r.platform for r in results})

    lines.append("| Provider | Platform | Field | Pass rate | Median pct error | N |")
    lines.append("|---|---|---|---|---|---|")

    verdicts: dict[tuple[str, str], bool] = {}

    for provider in providers:
        for platform in platforms:
            rows_by_field = {
                field: [r for r in results if r.provider == provider and r.platform == platform and r.field == field]
                for field in ("followers", "engagement_rate", "post_completeness")
            }
            if not rows_by_field["followers"]:
                continue

            for field, rows in rows_by_field.items():
                if not rows:
                    continue
                pass_rate = sum(1 for r in rows if r.passed) / len(rows)
                errs = [r.pct_error for r in rows if r.pct_error is not None]
                median_err = statistics.median(errs) if errs else None
                lines.append(
                    f"| {provider} | {platform} | {field} | {pass_rate:.0%} | "
                    f"{f'{median_err:.1%}' if median_err is not None else 'n/a'} | {len(rows)} |"
                )

            follower_rows = rows_by_field["followers"]
            engagement_rows = rows_by_field["engagement_rate"]
            completeness_rows = rows_by_field["post_completeness"]

            follower_pass_rate = sum(1 for r in follower_rows if r.passed) / len(follower_rows)
            engagement_pass_rate = (
                sum(1 for r in engagement_rows if r.passed) / len(engagement_rows) if engagement_rows else 0.0
            )
            completeness_pass_rate = (
                sum(1 for r in completeness_rows if r.passed) / len(completeness_rows) if completeness_rows else 0.0
            )
            follower_errs = [r.pct_error for r in follower_rows if r.pct_error is not None]
            median_follower_err = statistics.median(follower_errs) if follower_errs else 1.0

            go = (
                follower_pass_rate >= DISCOVERY_GO_FOLLOWER_PASS_RATE
                and engagement_pass_rate >= DISCOVERY_GO_ENGAGEMENT_PASS_RATE
                and completeness_pass_rate >= MIN_POST_COMPLETENESS
                and median_follower_err <= DISCOVERY_GO_MEDIAN_FOLLOWER_ERROR
            )
            verdicts[(provider, platform)] = go

    lines.append("")
    lines.append("## Discovery GO / NO-GO (plan §2 criteria)")
    lines.append("")
    for (provider, platform), go in sorted(verdicts.items()):
        lines.append(f"- **{provider} / {platform}**: {'GO' if go else 'NO-GO'}")

    lines.append("")
    lines.append(
        "Verified use case: TikHub/ScrapeCreators are disqualified by policy regardless of "
        "the numbers above (plan §5, providers/registry.py) - this harness only informs "
        "whether either is a viable temporary stopgap while official OAuth flows are built."
    )

    return "\n".join(lines)


def main() -> None:
    results = asyncio.run(run())
    write_csv(results)
    summary = summarize(results)
    SUMMARY_PATH.write_text(summary, encoding="utf-8")
    print()
    print(summary)
    print()
    print(f"Wrote {RESULTS_CSV_PATH}")
    print(f"Wrote {SUMMARY_PATH}")


if __name__ == "__main__":
    main()
