# Nepfluence — Decisions Addendum (read this before touching code)

This document resolves the open questions the gap audit flagged but didn't decide. Treat every decision below as final unless you find evidence during implementation that makes it unworkable — in that case, stop and flag it rather than silently picking something else.

---

## Decision 1: Campaign schema mismatch (niche, platform, deadline, brief, budget, applications, accepted, reach)

**Resolution: expand the backend, don't strip the frontend.**

These are real product fields a brand needs when creating a campaign — they shouldn't be cut just because the backend doesn't have them yet.

- Add as real columns/fields on the backend `Campaign` model + `CampaignBase`/`CampaignCreate`/`CampaignPublic` schemas: `niche` (string or enum — check if frontend uses a fixed list, if so mirror it as a backend enum), `platform` (string or enum, same check), `country` (string), `deadline` (date/datetime).
- `brief` maps to the existing `description` field. Do not add a duplicate field — rename/reuse, and update the frontend to write into `description`.
- Keep `budget_min` / `budget_max` on the backend as the source of truth (more flexible than a single number). The frontend's single `budget` field should either become a min/max range input, or — if you want to ship faster — auto-set `budget_min = budget_max = budget` on submit as an interim shim, but note this as tech debt in a code comment.
- `applications`, `accepted`, `reach` are **derived counts, not stored fields.** Do not add them as columns. Compute them at query time: `applications` = count of proposals for that campaign, `accepted` = count of proposals with status `accepted`, `reach` = sum/estimate from linked influencer profile follower counts (only if a real data source exists — otherwise omit from the response and remove/hide it from the UI rather than fabricating a number).
- This requires an Alembic migration. Write it as part of this change, don't defer it.

---

## Decision 2: Campaign status enum (`OPEN` vs `PUBLISHED`)

**Resolution: adopt the backend's naming. The frontend conforms.**

The backend enum (`DRAFT`, `PUBLISHED`, `CLOSED`) is the one wired to actual state-transition routes (`/publish`, `/close`). Renaming the frontend is a smaller, safer change than renaming backend routes and DB values.

- Update all frontend type unions, filters, and display labels from `OPEN` → `PUBLISHED`.
- Frontend also has `COMPLETED`, which the backend doesn't have. Decide during implementation whether "completed" is really a distinct backend state (e.g. all deliverables approved) or just a UI label derived from collaboration status. If it needs to be a real state, add it to the backend enum with a migration; don't fake it client-side.
- `PAUSED` (frontend-only) — same treatment: if it's a real pause capability, add a backend state + route; if not, drop it from the frontend status list.

---

## Decision 3: The `/api/marketplace/state` blob

**Resolution: split by domain. Migrate off it where real backend models exist now. Keep it, but mark it explicitly, where they don't.**

- **Campaigns and proposals/applications**: migrate fully off the blob. The backend already has real, tested-looking normalized routes for these (`/campaigns/me*`, `/proposals/*`). There's no good reason to keep using the blob here — this is the highest-value, lowest-risk part of the whole fix list. Do this first among the "core build" items.
- **Collaboration, messages, escrow/wallet, deliverables**: no real backend models exist yet for these. Keep them on the blob for now, but:
  - Add a code comment at the top of `marketplace/routes.py` and `marketplaceStore.ts` explicitly stating: `// PROTOTYPE STORAGE: collaboration, messages, and payments are not yet backed by normalized models. Do not build new features on top of this without flagging it.`
  - Do not silently expand the blob's scope further. If a new feature needs collaboration/payment data, that's a signal to build the real backend module, not add another field to the JSON blob.
- This means after this pass, the blob's only remaining legitimate use is collaboration/messages/payments — not campaigns/proposals. If you still see campaign or proposal data flowing through the blob after Phase 3/4 below, that's a bug, not a design choice.

---

## Decision 4: Role naming (`influencer` backend vs `creator` frontend)

**Resolution: keep both names, but formalize the mapping into one place.**

Renaming either side is unnecessary churn (backend name is fine as a domain term, frontend name is fine as a product/UX term). Instead:

- Move the mapping (currently informal in `Frontend/lib/auth.ts:29-36`) into a single named export, e.g. `Frontend/lib/roleMapping.ts`, with a clear function like `toFrontendRole(backendRole)` / `toBackendRole(frontendRole)`.
- Every place that currently hardcodes the string `"creator"` or `"influencer"` for role checks should import from this file instead of comparing raw strings. Grep for both strings across the frontend during implementation and route them through the mapping.
- Add a one-line comment at the top of the file explaining why the mapping exists, so the next agent doesn't "fix" it by renaming one side.

---

## Build sequencing (do not reorder without reason)

**Phase 0 — this document.** Already done once you're reading this.

**Phase 1 — quick wins (do first, low risk, unblocks everything else):**
1. Add frontend `.env.example` (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`).
2. Expand backend `.env.example` (`SECRET_KEY`, `DATABASE_URL`, `YOUTUBE_API_KEY`, Google OAuth vars, upload settings).
3. Mount static `/media` in FastAPI (`backend/src/main.py`) so image paths already being returned actually resolve.
4. Fix `apiClient` error parsing to handle FastAPI's list-shaped `detail` (validation errors), not just string `message`/`detail`.
5. Rename `readMockSession`, `mockLogout`, `logout = mockLogout` in `Frontend/lib/auth.ts` to non-"mock" names — the auth is real now, the naming is misleading and will confuse whoever touches this next.

**Phase 2 — schema/enum alignment (blocks Phase 3):**
6. Implement Decision 1 (expand backend Campaign model/schema + migration).
7. Implement Decision 2 (align status enum naming).
8. Implement Decision 4 (formalize role mapping) — small, do it now while touching auth-adjacent code.

**Phase 3 — wire campaigns end-to-end:**
9. Replace `marketplace.createCampaign` / `publishCampaign` / dashboard campaign reads with real calls to `/campaigns/me*` and public `/campaigns/`.
10. Wire campaign image upload (`/campaigns/me/{id}/picture`) into the currently-deferred frontend media step.
11. Add a campaign detail page if one doesn't exist, backed by `GET /campaigns/{campaign_id}`.

**Phase 4 — wire proposals/applications end-to-end:**
12. Replace `marketplace.applyToCampaign` / `reviewApplication` / withdraw with real calls to `/proposals/*`.
13. Decide whether the brand's proposal queue needs denormalized creator display data (name, avatar, followers) bundled in the response, or whether the frontend should join it client-side from `/influencer-profile/directory`. Prefer client-side join first — it avoids a backend schema change — and only denormalize on the backend if performance becomes a real issue.

**Phase 5 — apply Decision 3 (mark blob as prototype-only for the remaining domains).** Do this once Phases 3–4 are merged, so it's clear campaigns/proposals no longer touch it.

**Phase 6 — social accounts:**
14. Add CRUD routes for `SocialAccount` (model/schema already exist per the audit) and wire creator onboarding to them instead of localStorage.

**Phase 7 — uploads:**
15. Profile photo upload (user model already has `image_file`/`image_path`).
16. Portfolio upload — requires a new backend model if one doesn't exist; check before assuming it's just a route.

**Phase 8 — auth hardening (do last, higher risk of breaking working auth):**
17. Move route protection into Next.js `middleware.ts` per the frontend's own architecture doc.
18. Decide on and implement a token refresh / session persistence strategy (short-lived access token + refresh token is the standard approach; confirm backend supports issuing refresh tokens before committing to this on the frontend).

---

## Acceptance criteria (apply to every item above)

A fix item is not done until:
- The frontend calls the real backend endpoint — no local-state fallback remains for that specific piece of data.
- Loading and error states are handled (not just the happy path) — a failed request should show the user something, not fail silently.
- The data shown in the UI matches what the backend actually returns, with no client-side fabrication of fields the backend doesn't provide.
- The full "brand creates campaign → creator applies → brand approves" journey (Section 11 of the audit) is re-walked manually after Phases 3–4, confirming each step now hits the real API instead of the marketplace blob.

---

## If you hit a decision not covered here

Stop and ask rather than guessing — especially for anything involving a new database migration, a new payment/escrow concept, or renaming something that's already shipped and in use (auth tokens, existing route paths). Everything else in the fix list is safe to proceed on using the sequencing above.
