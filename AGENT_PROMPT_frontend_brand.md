# Agent Prompt — Frontend Brand Track (Nepfluence)

You own the brand-facing side of the frontend. A separate agent on another machine owns the creator-facing side, and a third owns the whole backend. You must not touch their files.

## Required reading before you write any code
1. `GAP_ANALYSIS_AUDIT.md` — especially Sections 3, 5, 9, 10, 11 (the brand half of the journey trace).
2. `DECISIONS_ADDENDUM.md` — Decisions 1–4, and Phases 1, 3, 5, 8 (your slice of them).
3. `TEAM_SPLIT_AND_GIT_WORKFLOW.md` — Sync Point 0 and Sync Point 1 gate what you're allowed to start when.
4. `CONTRACT.md` — this is your source of truth for exact field names/types once the backend agent fills it in. Do not guess ahead of it for anything under "Campaign shape" or "Proposal shape."

## Your files (do not edit anything outside this list without flagging it first)
- `Frontend/features/campaigns/**`
- `Frontend/features/brand-profile/**`
- `Frontend/app/brand/**`

## Before you start: check Sync Point 0
`Frontend/features/shared/marketplaceStore.ts`, `Frontend/lib/api-client.ts`, `Frontend/lib/auth.ts`, `Frontend/lib/roleMapping.ts`, and `Frontend/types/api.types.ts` are shared infra. If Sync Point 0 (see `TEAM_SPLIT_AND_GIT_WORKFLOW.md`) hasn't landed on `main` yet, either wait, or coordinate with the creator-track agent so only one of you does it. Do not edit these files independently once they've been split into domain hooks.

## What you can start immediately (not blocked on backend)
- Campaign creation/edit UI cleanup and validation.
- Extracting your slice of campaign/proposal logic out of `marketplaceStore.ts` into a new `useCampaigns.ts` hook (structure only — leave it calling the local store until Sync Point 1 lands, then swap the internals to real API calls).
- Proposal queue UI (accept/reject buttons, empty states, loading states) — build the UI shell now, wire the real calls after Sync Point 1.

## What is blocked until Sync Point 1 (backend Campaign schema landed + `CONTRACT.md` updated)
- Replacing `marketplace.createCampaign` / `publishCampaign` / `closeCampaign` / delete with real calls to `/campaigns/me*`.
- Wiring campaign image upload to `/campaigns/me/{id}/picture`.
- Replacing `marketplace.reviewApplication` (accept/reject) with real calls to `/proposals/{id}/accept` and `/proposals/{id}/reject`.
- Building a campaign detail page backed by `GET /campaigns/{campaign_id}` if one doesn't exist.

Check `CONTRACT.md`'s Campaign shape table before starting any of the above — if it's still marked "TBD," Sync Point 1 hasn't landed, don't proceed.

## Specific things to fix per the audit
- `Frontend/features/campaigns/components/brand-dashboard/BrandDashboardOverview.tsx` currently reads/writes `marketplace.campaigns` and `marketplace.applications` — this is the core thing you're replacing.
- Status naming: rename `OPEN` to `PUBLISHED` everywhere in your files per Decision 2.
- `brief` field maps to backend `description` — don't create a duplicate field, adapt the form to write into `description`.
- Single `budget` field vs backend `budget_min`/`budget_max`: either build a range input, or shim `min=max=budget` as an interim step and leave a `// TODO` comment — check `DECISIONS_ADDENDUM.md` Decision 1 for the reasoning.
- Hardcoded Unsplash fallback avatars and `creatorWorkSamples`/`creatorAnalytics` in `brand-dashboard.shared.ts` — replace with real data from `/influencer-profile/directory` where possible; where the backend genuinely has no equivalent data (e.g. analytics), leave it out of the UI rather than fabricating numbers, and note it as a backend gap rather than papering over it.

## What you must not do
- Do not touch `Frontend/features/creator/**`, `Frontend/features/creator-profile/**`, `Frontend/app/creator/**`, or anything under `backend/`.
- Do not re-decide anything in `DECISIONS_ADDENDUM.md`. If a decision seems wrong once you're in the code, stop and flag it rather than picking your own approach — the creator track is building against the same decisions and will silently diverge if you don't.
- Do not add new fields to `marketplaceStore.ts`'s campaign/proposal state once you're replacing it with real API calls — you're migrating away from it, not deepening it.

## Branch name
`frontend/brand-track`, rebased from `main` daily and immediately after Sync Point 1 lands.
