# CONTRACT.md — Frozen decisions all three tracks build against

This is the single source of truth for anything that crosses the backend/frontend boundary. Backend fills in the "Final" column once implemented. Frontend agents code against "Final" once it's populated — not against guesses.

## Campaign shape (Decision 1)

| Field | Type | Status |
|---|---|---|
| `title` | string | existing |
| `description` (was `brief` on frontend) | string | existing — frontend maps `brief` → `description` |
| `budget_min`, `budget_max` | number | existing — frontend adapts single `budget` field to a range, or shims `min=max=budget` as interim |
| `niche` | string/enum — TBD by backend during implementation | new — backend to confirm final type here |
| `platform` | string/enum — TBD by backend during implementation | new — backend to confirm final type here |
| `country` | string | new |
| `deadline` | date/datetime | new |
| `status` | enum: `DRAFT`, `PUBLISHED`, `CLOSED`, (+`COMPLETED` if backend confirms it's a real state) | frontend renames `OPEN` → `PUBLISHED` everywhere |
| `applications`, `accepted`, `reach` | NOT stored fields — computed at query time or omitted if no real data source | frontend must not expect these unless backend confirms they're included in the response |

**Backend: fill in the exact final field names/types here once the migration lands, and note the migration file name for reference.**

## Proposal shape (Decision 1 cont.)

Frontend brand queue and creator "my proposals" view: confirm during implementation whether creator display data (name, avatar, followers) is denormalized into the proposal response or joined client-side from `/influencer-profile/directory`. Default assumption unless backend says otherwise: **client-side join**, proposal response stays minimal (`message`, `proposed_budget`, `status`, IDs, timestamps).

## Role naming (Decision 4)

Backend: `"influencer"`. Frontend: `"creator"`. Mapping lives in `Frontend/lib/roleMapping.ts` — both frontend tracks import from there, never hardcode either string.

## Marketplace blob (Decision 3)

- Campaigns and proposals: **do not use `/api/marketplace/state` for these once Phase 3/4 land.** If either frontend track finds itself still writing campaign/proposal data through the blob after that point, it's a bug.
- Collaboration, messages, escrow/wallet, deliverables: **stay on the blob for now**, explicitly marked prototype-only in code comments. Neither frontend track should expand the blob's scope for these — if a new feature needs real persistence here, flag it rather than bolting it onto the JSON blob.

## Env vars (Phase 1)

Backend confirms final list required in `.env.example` (both frontend and backend) once Phase 1 lands — paste the confirmed list here so both frontend tracks know what they need to run locally against the real backend.

## Static media

Backend confirms the `/media` mount path and URL structure once implemented, so both frontend tracks can render image URLs consistently.

---

**Update this file in place as each decision gets implemented — don't create a second version. Whoever lands a change on `main` that affects this contract updates this file in the same PR.**
