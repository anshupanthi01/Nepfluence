from __future__ import annotations

from src.influencer_profile.models import InfluencerProfile


def country_code(country: str | None) -> str:
    value = (country or "").strip().lower()
    if value in {"india", "in"}:
        return "IN"
    return "NP"


def profile_handle(profile: InfluencerProfile) -> str:
    social_accounts = profile.social_accounts or []
    for account in social_accounts:
        if account.youtube_handle:
            return account.youtube_handle if account.youtube_handle.startswith("@") else f"@{account.youtube_handle}"

    username = getattr(profile.user, "username", None) or profile.full_name
    handle = "".join(character for character in username.lower() if character.isalnum())
    return f"@{handle or 'creator'}"


def profile_followers(profile: InfluencerProfile) -> str:
    for account in profile.social_accounts or []:
        if account.subscribers_count:
            return f"{account.subscribers_count:,}"
    return "0"
