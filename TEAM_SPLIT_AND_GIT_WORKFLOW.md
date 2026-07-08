# Nepfluence — Team Split & Git Workflow (3 parallel agents)

Read this before anyone starts. It exists to stop three agents on three machines from blocking each other or conflicting on the same files.

## Who owns what

**Backend (1 person, whole backend):** everything under `backend/`.

**Frontend Person A — "Brand track":**
- `Frontend/features/campaigns/**` (BrandDashboardOverview, BrandDashboardModals, panels: DiscoverPanel, TrustPanel, BrandProfilePanel)
- `Frontend/features/brand-profile/**`
- `Frontend/app/brand/**`
- Owns: campaign CRUD wiring (create/update/publish/close/delete/image upload), proposal queue (accept/reject), creator directory consumption.

**Frontend Person B — "Creator track":**
- `Frontend/features/creator/**`, `Frontend/features/creator-profile/**`
- `Frontend/app/creator/**`
- Owns: campaign feed (GET `/campaigns/`), apply/withdraw proposals, profile photo/portfolio upload, social account onboarding.

**Shared frontend infra files — do NOT let both frontend people edit independently:**
- `Frontend/features/shared/marketplaceStore.ts`
- `Frontend/lib/api-client.ts`, `Frontend/lib/auth.ts`
- `Frontend/types/api.types.ts`
- (new) `Frontend/lib/roleMapping.ts`

These get handled once, up front, in **Sync Point 0** below — by whichever of the two frontend people is free first — then frozen so both tracks build on top of it without touching it again except for their own domain's slice.

## Sync points (do not skip — this is what prevents conflicts)

### Sync Point 0 — infra quick wins (before any track-specific work starts)
One person (either frontend person, doesn't matter who) does this on its own short-lived branch and merges to `main` first:
- Split `marketplaceStore.ts` into domain slices: extract campaign/proposal logic into hooks the Brand and Creator tracks will each independently replace (e.g. `useCampaigns.ts` for Person A, `useCreatorFeed.ts` / `useMyProposals.ts` for Person B). Chat/collaboration/payment logic stays in the shared store untouched for now (per Decision 3 — prototype-only).
- Fix `apiClient` error parsing (Phase 1 item from the addendum).
- Rename the mock-named auth functions (`readMockSession` etc.).
- Add `Frontend/lib/roleMapping.ts`.
- Add `Frontend/.env.example`.

This branch merges to `main` before Person A or Person B fork their track branches. **Nobody starts Brand or Creator track work until this is merged.**

### Sync Point 1 — backend contract freeze (before frontend campaign/proposal wiring starts)
Backend person completes Decision 1 (schema expansion + migration) and Decision 2 (status enum rename) from the addendum, and publishes the final shapes in `CONTRACT.md` (below) — updated with the *actual* field names and types once implemented, not just the plan. Push to `main`.

**Frontend Person A and B do not start wiring `/campaigns/*` or `/proposals/*` calls until this lands.** They can work on everything else in their track in parallel while waiting (UI cleanup, profile upload UI scaffolding, social account onboarding UI, etc.) — just not the actual campaign/proposal API calls.

### Sync Point 2 — merge order
When all three tracks are ready to merge to `main`:
1. Backend PR merges first (if any further backend changes happened after Sync Point 1).
2. Frontend Brand track PR merges second.
3. Frontend Creator track PR merges third.
Rebase, don't merge-commit, when pulling `main` into a track branch — keeps history readable across three parallel contributors.

## Branch naming

- `backend/campaign-schema-and-migration`
- `backend/social-accounts-and-uploads`
- `frontend/infra-sync-point-0`
- `frontend/brand-track`
- `frontend/creator-track`

Each person rebases their track branch from `main` at least once a day, more often right after a sync point lands, so schema drift gets caught early instead of at the final merge.

## Ground rule for all three agents

None of the three agents should re-decide anything already settled in the decisions addendum (schema shape, enum naming, blob usage, role mapping). If an agent thinks a decision needs to change, it stops and flags it back to you rather than changing it unilaterally in its own branch — a change to a shared contract made in isolation is exactly what causes the other two tracks to break silently.
