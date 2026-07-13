# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Nepfluence is a marketplace connecting Nepali/Indian brands with influencers for campaign marketing. It's a monorepo:

- `Frontend/` — Next.js App Router (TypeScript, React 19, Tailwind v4, shadcn-style primitives)
- `backend/` — FastAPI modular monolith (SQLAlchemy async ORM, Pydantic, JWT auth, SQLite)

`Frontend/CLAUDE.md` just points to `Frontend/AGENTS.md`, which warns that this repo's Next.js version has breaking changes vs. training data — **read `node_modules/next/dist/docs/` before writing Next.js code that touches routing/conventions.** `Frontend/ARCHITECTURE.md` is the authoritative source for frontend folder boundaries; don't contradict it.

## Commands

### Frontend (run from `Frontend/`)
```bash
npm run dev     # next dev
npm run build   # next build
npm run lint    # eslint
```
No frontend test suite exists.

### Backend (run from `backend/`, uses `uv` against `.venv-fresh` — see gotcha below)
```bash
UV_PROJECT_ENVIRONMENT=.venv-fresh uv sync                                                    # install deps
UV_PROJECT_ENVIRONMENT=.venv-fresh uv run uvicorn src.main:app --host 127.0.0.1 --port 8000 --reload
UV_PROJECT_ENVIRONMENT=.venv-fresh uv run python -m compileall src                             # quick syntax check
```
No backend test suite exists (no pytest config, no test files). There is no lint/format tool configured for the backend.

Both servers must run concurrently for the app to function: frontend defaults to expecting the API at `http://localhost:8000` (`NEXT_PUBLIC_API_URL` env var overrides this), backend defaults to allowing CORS from `http://localhost:3000`/`3001` (`FRONTEND_URL` env var).

## Architecture

### Backend: modular monolith
Each domain under `backend/src/<domain>/` owns its own `models.py`, `schemas.py`, `routes.py`, `crud.py` (pattern established by `campaign/`, `campaign_proposal/`, `brand_profile/`, `influencer_profile/`, `conversations/`). All domains share one FastAPI app (`src/main.py`), one `Settings` object (`src/config.py`), and one async engine/session (`src/database.py`, `AsyncSessionLocal`/`get_db`).

Domains: `users`, `brand_profile`, `influencer_profile`, `campaign`, `campaign_proposal`, `collaboration`, `conversations`, `marketplace`, `contact`, `integrations/youtube`, plus top-level `auth.py` (JWT/password helpers) and `google_auth.py` (OAuth routes).

`collaboration/` is a **simulated, internal-only escrow** — `Collaboration`/`DeliverableSubmission`/`LedgerEntry` tables, all DB-backed, no third-party payment processor involved. A `Collaboration` row is created automatically when a brand accepts a proposal (`campaign_proposal/routes.py`'s `accept_proposal`). Wallet balance is computed live from ledger entries, not stored. `config.py` has dormant `ESCROW_API_EMAIL`/`ESCROW_API_KEY`/`ESCROW_BASE_URL` settings fields left over from a paused real Escrow.com sandbox integration attempt — they exist only so `.env` doesn't crash `Settings` on startup; nothing in the app actually calls the Escrow.com API.

**Inconsistent naming, not a typo to "fix" blindly:** the `users` domain uses singular `model.py`/`schema.py` while every other domain uses plural `models.py`/`schemas.py`. Match whichever file you're already in.

**Database migrations are split across two mechanisms** — check both when changing schema:
1. `backend/alembic/versions/` — real Alembic migrations (currently one file).
2. `ensure_sqlite_schema()` in `src/main.py` — runs on every app startup and does manual `ALTER TABLE`/`CREATE TABLE IF NOT EXISTS` calls for SQLite (used for the `conversations`/`messages` tables and several column additions). This exists because `Base.metadata.create_all` alone won't add new columns to existing SQLite tables.

When adding a column/table, prefer updating `ensure_sqlite_schema()` to keep local dev DBs in sync unless you're setting up a proper Alembic migration for production.

`database.py` has `echo=True` on the engine — expect verbose SQL logging in backend server output; this is intentional for the current dev stage, not a bug to silently remove.

### Auth
- Login: `POST /api/users/login` (OAuth2 form fields; email sent as `username`) → JWT (`HS256`, `sub`=user id, signed with `SECRET_KEY`). Passwords hashed with `pwdlib` Argon2.
- `CurrentUser` (from `src/auth.py`) is the FastAPI dependency for bearer-token-protected routes.
- Backend roles are `brand` / `influencer` / `admin`. **The frontend renames `influencer` to `creator` everywhere** (`toFrontendRole`/`toBackendRole` in `Frontend/lib/auth.ts`) — when tracing a role-related bug across the stack, remember this translation happens at the API boundary.
- Frontend session (token + user info) is stored in `localStorage` under key `nepfluence-session` (see `Frontend/lib/auth.ts`), not cookies. There is no `middleware.ts`; route protection is done client-side via `ProtectedRoute` (`Frontend/features/auth/components/ProtectedRoute.tsx`).
- Google OAuth login routes exist (`src/google_auth.py`); refresh tokens are not implemented.

### Frontend structure (see `Frontend/ARCHITECTURE.md` for the canonical rules)
- `app/` — routes and route-group layouts only, no business logic.
- `features/<domain>/` — domain UI, hooks, API wrappers (`features/*/api/*.ts` call the backend via `lib/api-client.ts`), and types. **Feature modules must not import from each other** — shared code goes in `types/`, `lib/`, or `features/shared/`.
- `components/ui/` — reusable primitives, no business logic. `components/Layout/` — public marketing layout only.
- Domains: `auth`, `campaigns` (brand dashboard), `creator` (creator dashboard), `collaboration`, `conversations`, `notifications`, `payments`, `profile`, `trust`, `shared`.
- Brand and creator dashboards are large panel-based components under `features/campaigns/components/brand-dashboard/panels/` and `features/creator/components/creator-dashboard/panels/` respectively.
- `features/shared/marketplaceStore.ts` backs a prototype JSON "marketplace state" blob (served via `backend/src/marketplace/routes.py`, persisted at `backend/data/marketplace_state.json`) — its TypeScript types (`MarketplaceCampaign`, `MarketplaceCollaboration`, `MarketplaceWallet`, `MarketplaceLedgerEntry`, etc.) are reused as the shared UI shape even where the data itself is now real: both dashboard `Overview.tsx` files fetch real campaigns/proposals/collaborations/wallet/ledger from the actual backend domains and adapt the responses into these shapes in-memory, so downstream panel components need no changes. Check the adapter logic in `BrandDashboardOverview.tsx`/`CreatorDashboardOverview.tsx` (not the panel itself) before assuming a given field is still backed by the local-state prototype.
- There are two brand dashboard route trees: `app/(brand)/dashboard` (compatibility route) and `app/(brand-workspace)/*` (campaigns, applications, collaborations, discover-creators, messages, payments, trust-reports, brand-profile) plus `app/brand/dashboard`. All of them render the same `features/campaigns/components/BrandDashboardOverview.tsx` (a re-export of `brand-dashboard/BrandDashboardOverview.tsx`), but each is a distinct Next.js route/page, so navigating between them remounts the component fresh. Confirm which route a change is meant to target before editing — don't assume they're the same file.
- `Frontend/hooks/` holds truly cross-domain shared hooks (per `Frontend/ARCHITECTURE.md`) — currently `useEscapeKey.ts` and `useClickOutside.ts`, used by every modal/popover on both dashboards to close on Escape/outside-click. `useClickOutside` listens on the `click` event (not `pointerdown`/`mousedown`) deliberately: a toggle-button trigger's own React `onClick` needs to fire first, or the outside-click handler closes the panel and the trigger's toggle immediately reopens it.

### Data model
Core tables: `users` → (1:1) `brand_profiles` / `influencer_profiles`; `brand_profiles` → (1:many) `campaigns`; `campaigns` → (1:many) `campaign_proposals` ← (many:1) `influencer_profiles`; `influencer_profiles` → (1:many) `social_accounts` (YouTube stats); `campaigns` → (1:many) `conversations` → (1:many) `messages`. Conversations/messages support soft-delete (`hidden_for_brand_at`/`hidden_for_creator_at` on conversations, `deleted_for_sender_at`/`deleted_for_recipient_at` on messages).

`campaign_proposals` → (1:1) `collaborations` (created on accept) → (1:0..1) `deliverable_submissions` and (1:many) `ledger_entries`. `brand_profile_id`/`influencer_profile_id` require an existing `BrandProfile`/`InfluencerProfile` row for the current user — registration (`users/routes.py`'s `register_user`) does **not** create one automatically, so a freshly registered account will 400 ("Create brand/influencer profile first") on any campaign/proposal/collaboration/wallet endpoint until the user explicitly saves their profile via `POST /brand-profile/me` or `POST /influencer-profile/me`. Frontend effects that combine an unrelated public fetch with a profile-scoped fetch must catch them independently (not in one shared `Promise.all`/`try`), or a brand-new account's expected profile-missing error wipes out otherwise-good data — see `BrandDashboardOverview.tsx`/`CreatorDashboardOverview.tsx`'s campaign+proposal and collaboration+wallet+ledger loaders for the pattern to follow.

## Known gotchas
- `.env` files are gitignored in `backend/`; copy `backend/.env.example` to `backend/.env` for local dev (mail/OAuth settings). Defaults in `src/config.py` are dev-safe (e.g. a placeholder `SECRET_KEY`) — never rely on those defaults for anything beyond local dev.
- `backend/nepfluence.db` (SQLite) and `backend/data/` are local runtime artifacts, not fixtures — don't treat their contents as seed data to preserve carefully. Two demo accounts exist for manual testing: `brand123@gmail.com` (role brand) and `creator123@gmail.com` (role influencer), both password `password`, both with completed profiles and test campaigns/proposals/collaborations attached.
- `backend/.venv-fresh` is the working virtual environment for this project (the original `.venv` was broken and abandoned) — use `UV_PROJECT_ENVIRONMENT=.venv-fresh uv sync`/`uv run ...`, or activate it directly, rather than relying on `uv`'s default `.venv`. Never run `uv run`/`uv sync` against it while a `uvicorn --reload` dev server is already running from it — `uv` reinstalling packages collides with uvicorn's file locks and the reloader's file watcher, which can crash the running server with a `ModuleNotFoundError` for a core package (this has happened; fix is to stop the server, rerun `uv sync`, then restart).
- `PROJECT_DOCUMENTATION.md` at the repo root is a large, auto-generated static-analysis snapshot (regenerate rather than hand-edit if it goes stale) — useful for a fast full-repo overview (API table, ER diagram, file-by-file docs) but not a source of truth for current state.
