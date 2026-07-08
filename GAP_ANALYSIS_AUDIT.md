# Master Prompt: Nepfluence Frontend-Backend Gap Analysis & Integration Audit

## Context (paste this in as-is)

You are taking over a project called **Nepfluence** — a platform connecting brands and influencers. It was previously worked on by another agent/session, so you do NOT have prior conversational context. The codebase is a monorepo with:

- **Frontend**: Next.js (App Router)
- **Backend**: FastAPI, structured as a modular monolith

The project is currently in a partially-integrated state. Your job is NOT to write new features yet. Your job is to produce a **complete, evidence-based gap analysis** of the current state of the codebase, so that the next phase of work (actually connecting/finishing things) can be scoped accurately. Do not guess or assume — every finding must be backed by a specific file path and line reference (or function/route name) from the actual code.

---

## Objective

Audit the full repository and produce a structured report identifying every mismatch, gap, or disconnect between the frontend and backend. Specifically:

1. **Disconnected features** — frontend UI/pages that exist but are not wired to any backend call at all (e.g., forms that don't submit anywhere, buttons with no handler, pages that render static content that should be dynamic).
2. **Dummy/mock/hardcoded data** — anywhere the frontend is using placeholder arrays, hardcoded objects, lorem ipsum, fake images, or `// TODO: replace with real API call` instead of hitting the real backend.
3. **Backend without frontend consumer** — API endpoints/routes that exist in FastAPI but are never called anywhere in the frontend (dead or unused backend capability).
4. **Frontend expecting backend that doesn't exist** — frontend code that calls an API route, expects a field, or expects a response shape that the backend does not currently provide (404s, shape mismatches, missing fields).
5. **Schema/type mismatches** — Pydantic models / SQLAlchemy models on backend vs TypeScript interfaces/types on frontend that don't match (field name differences, type differences, optional vs required mismatches, missing fields either direction).
6. **Auth & session gaps** — is auth actually implemented end-to-end (login, token storage, refresh, protected routes, role-based access for brands vs influencers), or is part of it stubbed/mocked on one side?
7. **Missing on both sides** — features that are referenced in the project's own docs/architecture notes but have no implementation on either frontend or backend at all.
8. **Environment/config gaps** — env vars referenced in one codebase but not defined/documented (e.g., `.env.example` missing keys, CORS config mismatches, API base URL mismatches, port mismatches).
9. **Error handling gaps** — does the frontend actually handle backend error responses (4xx/5xx, validation errors) or does it assume happy path only?
10. **File/image upload flow** — if there's influencer/brand profile images, portfolio uploads, etc., confirm the upload flow is real end-to-end (storage, URL generation, retrieval) vs frontend-only placeholder.

---

## Method (how to actually do this — don't skip steps)

1. **Map the backend first.** List every FastAPI route (method + path), grouped by module. For each, note: request schema, response schema, auth requirement.
2. **Map the frontend second.** List every page/route in the App Router, and for each, list every API call it makes (fetch/axios/whatever client is used), including the endpoint URL it hits.
3. **Cross-reference.** Build a table matching frontend calls to backend routes. Anything that doesn't have a 1:1 match goes into the gap report.
4. **Grep for smells.** Search the frontend codebase for signals of mock data: `mockData`, `dummyData`, `fakeData`, hardcoded arrays of objects that look like API responses, `placeholder`, `TODO`, `FIXME`, `// temp`, hardcoded image URLs from unsplash/placeholder services, hardcoded `localhost` URLs, commented-out fetch calls.
5. **Grep the backend** for routes with no corresponding frontend fetch call anywhere (dead code check).
6. **Check the data layer.** Compare Pydantic/ORM models against TS types/interfaces field-by-field.
7. **Trace one full user journey manually** (e.g., "brand signs up → creates a campaign → influencer applies → brand approves") end-to-end through the code, and note exactly where the chain breaks or falls back to mock data.

---

## Output format (required)

Produce the report as a structured Markdown document with these sections:

### 1. Executive Summary
3-5 bullet points on overall integration health (rough % of features actually connected vs mocked/missing).

### 2. Endpoint Coverage Matrix
A table: `Backend Route | Method | Called by Frontend? (Y/N + file:line) | Notes`

### 3. Frontend Using Mock/Dummy Data
A table: `Page/Component (file path) | What's mocked | Should call which backend endpoint (if it exists) or needs new endpoint`

### 4. Backend Endpoints With No Frontend Consumer
List with route, and a note on whether it looks intentional (e.g., admin-only, not yet built in UI) or abandoned.

### 5. Schema Mismatches
Table: `Model/Type | Backend shape | Frontend shape | Mismatch`

### 6. Auth/Session Gaps
Narrative + specific file references.

### 7. Missing Entirely (Neither Side)
Anything referenced in docs/architecture files but not implemented anywhere.

### 8. Config/Env Gaps
Any mismatched or missing environment variables, CORS issues, base URL mismatches.

### 9. Prioritized Fix List
Ordered list of what to connect/build first, based on: (a) how core the feature is to the main user journeys, (b) how small the fix is (quick win vs real build). Flag quick wins separately from real builds.

---

## Ground rules

- Do not fabricate file paths or line numbers — if you can't verify something, say "unconfirmed, needs manual check" rather than guessing.
- Do not start fixing anything yet. This is audit-only. Wait for confirmation before writing code.
- If the repo has any architecture/spec docs (e.g., an architecture.md or PDF), read them first and treat them as the source of truth for "what should exist," then check what actually does.
- If frontend and backend live in separate folders/repos within the monorepo, state the folder structure you found at the top of the report before diving in.
