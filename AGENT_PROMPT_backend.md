# Agent Prompt — Backend Track (Nepfluence)

You own the entire `backend/` directory. Two other agents are working on the frontend in parallel, on separate machines, and will build against the shapes you finalize. Do not make architecture decisions unilaterally — the decisions have already been made in `DECISIONS_ADDENDUM.md`; your job is to implement them and record the final result in `CONTRACT.md` so the frontend agents aren't guessing.

## Required reading before you write any code
1. `GAP_ANALYSIS_AUDIT.md` — full picture of current state, especially Sections 2, 5, 7, 8, 9, 10.
2. `DECISIONS_ADDENDUM.md` — Decisions 1, 2, 3, 4, and the phase sequencing (you're responsible for Phases 1, 2, and 6–7's backend halves).
3. `CONTRACT.md` — fill this in as you go. This is the single most important deliverable for unblocking the other two agents.

## Your scope, in order

**Phase 1 (do first, push immediately — this unblocks nothing for frontend but should land fast):**
- Expand `backend/.env.example` with the full confirmed list of env vars (`SECRET_KEY`, `DATABASE_URL`, `YOUTUBE_API_KEY`, Google OAuth vars, upload settings).
- Mount static `/media` in `backend/src/main.py` so the image paths already being returned actually resolve.
- Once done, fill in the "Static media" and "Env vars" sections of `CONTRACT.md`.

**Phase 2 (this is the critical path — frontend campaign/proposal work is blocked on this):**
- Implement Decision 1: expand the Campaign model/schema with `niche`, `platform`, `country`, `deadline`; map `brief` to existing `description`; write the Alembic migration. Decide the final type for `niche`/`platform` (string vs enum) and document your reasoning briefly in the migration file or a comment.
- Implement Decision 2: confirm the status enum stays `DRAFT`/`PUBLISHED`/`CLOSED`, and decide with evidence from the codebase whether `COMPLETED` needs to be a real backend state (i.e., is there a concept of a campaign being fully wrapped up beyond "closed"?) — if yes, add it with a migration; if no, note in `CONTRACT.md` that frontend should treat "completed" as a derived UI label, not a backend state.
- **The moment this is merged to `main`, update `CONTRACT.md`'s Campaign shape table with the real final field names/types and the migration filename.** This is what unblocks both frontend agents.

**Phase 6/7 backend halves:**
- Add CRUD routes for `SocialAccount` (model/schema reportedly already exist per the audit — verify and build routes if missing).
- Build a portfolio upload model + route if one doesn't already exist (check before assuming — the audit found the frontend button is a placeholder, but didn't confirm backend has zero support).
- Confirm profile photo upload is already fully wired (user model has `image_file`/`image_path` per the audit) or finish it if not.

**Also fix while you're in this code (Phase 1 items you're best positioned for):**
- The `apiClient` error-parsing gap is frontend-side, not yours — skip it, a frontend agent owns that.
- Do rename anything backend-side that's misleadingly named "mock" or "temp" if you find it, and note it in your PR description.

## Branch names
`backend/campaign-schema-and-migration`, then `backend/social-accounts-and-uploads`. Push each as its own PR to `main` — don't bundle them.

## What you must not do
- Do not touch anything under `Frontend/`.
- Do not silently change a decision from `DECISIONS_ADDENDUM.md`. If you find a decision unworkable once you're in the code, stop, write up why in `CONTRACT.md` under a `## FLAGGED` section, and surface it back to the human rather than picking a different approach.
- Do not expand the `/api/marketplace/state` blob's scope. If you're tempted to add a field to it to make something easier, that's a signal you need a real model/route instead — flag it.
