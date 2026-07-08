# Agent Prompt — Frontend Creator Track (Nepfluence)

You own the creator-facing side of the frontend. A separate agent on another machine owns the brand-facing side, and a third owns the whole backend. You must not touch their files.

## Required reading before you write any code
1. `GAP_ANALYSIS_AUDIT.md` — especially Sections 3, 5, 6, 9, 10, 11 (the creator half of the journey trace).
2. `DECISIONS_ADDENDUM.md` — Decisions 1–4, and Phases 1, 4, 6, 7, 8 (your slice of them).
3. `TEAM_SPLIT_AND_GIT_WORKFLOW.md` — Sync Point 0 and Sync Point 1 gate what you're allowed to start when.
4. `CONTRACT.md` — this is your source of truth for exact field names/types once the backend agent fills it in. Do not guess ahead of it for anything under "Campaign shape" or "Proposal shape."

## Your files (do not edit anything outside this list without flagging it first)
- `Frontend/features/creator/**`
- `Frontend/features/creator-profile/**`
- `Frontend/app/creator/**`

## Before you start: check Sync Point 0
`Frontend/features/shared/marketplaceStore.ts`, `Frontend/lib/api-client.ts`, `Frontend/lib/auth.ts`, `Frontend/lib/roleMapping.ts`, and `Frontend/types/api.types.ts` are shared infra. If Sync Point 0 (see `TEAM_SPLIT_AND_GIT_WORKFLOW.md`) hasn't landed on `main` yet, either wait, or coordinate with the brand-track agent so only one of you does it. Do not edit these files independently once they've been split into domain hooks.

## What you can start immediately (not blocked on backend)
- Profile photo and portfolio upload UI (currently placeholder buttons in `ProfilePanel.tsx`) — build the UI shell and file-picker flow now; the actual upload call depends on the backend agent's Phase 6/7 work, so wire it once that lands (check with the backend agent or watch for the route in their PRs).
- Social account connection onboarding UI cleanup.
- Extracting your slice of campaign/proposal consumption out of `marketplaceStore.ts` into new hooks (`useCampaignFeed.ts`, `useMyProposals.ts`) — structure only, leave calling the local store until Sync Point 1 lands.

## What is blocked until Sync Point 1 (backend Campaign schema landed + `CONTRACT.md` updated)
- Replacing the local `marketplace.campaigns` feed filter with real calls to `GET /campaigns/`.
- Replacing `marketplace.applyToCampaign` / withdraw with real calls to `/proposals/campaigns/{campaign_id}` and `/proposals/{proposal_id}/withdraw`.
- Replacing local "my applications" reads with `GET /proposals/me`.

Check `CONTRACT.md`'s Campaign shape table before starting any of the above — if it's still marked "TBD," Sync Point 1 hasn't landed, don't proceed.

## Blocked until backend Phase 6 (social accounts) lands
- Wiring `Frontend/app/creator/onboarding/page.tsx`'s connected-platforms flow to real `SocialAccount` CRUD routes instead of localStorage.

## Specific things to fix per the audit
- `Frontend/features/creator/components/creator-dashboard/CreatorDashboardOverview.tsx` currently filters `marketplace.campaigns` by `OPEN` status — this becomes `PUBLISHED` per Decision 2, and the whole read path moves to `GET /campaigns/`.
- Status naming: rename `OPEN` to `PUBLISHED` everywhere in your files per Decision 2.
- Hardcoded static `creatorProfileImage`, `portfolioShots` (Unsplash), and `creatorAnalytics` in `creator-dashboard.shared.ts` — replace with real profile/upload data where the backend supports it; where it genuinely doesn't (e.g. analytics beyond YouTube stats already in `/influencer-profile/me`), leave it out rather than fabricating numbers, and note it as a backend gap.
- `Frontend/lib/websocket.ts` references a `/ws` URL the backend doesn't have — do not build chat features against this until backend confirms a real messages module exists (per Decision 3, this stays prototype-only for now).

## What you must not do
- Do not touch `Frontend/features/campaigns/**`, `Frontend/features/brand-profile/**`, `Frontend/app/brand/**`, or anything under `backend/`.
- Do not re-decide anything in `DECISIONS_ADDENDUM.md`. If a decision seems wrong once you're in the code, stop and flag it rather than picking your own approach — the brand track is building against the same decisions and will silently diverge if you don't.
- Do not add new fields to `marketplaceStore.ts`'s campaign/proposal state once you're replacing it with real API calls — you're migrating away from it, not deepening it.

## Branch name
`frontend/creator-track`, rebased from `main` daily and immediately after Sync Point 1 lands.
