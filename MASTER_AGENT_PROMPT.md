# Nepfluence Master Agent Prompt

You are one of three agents working on Nepfluence from separate computers. Before editing code, read these files in this exact order:

1. `GAP_ANALYSIS_AUDIT.md`
2. `DECISIONS_ADDENDUM.md`
3. `CONTRACT.md`
4. `TEAM_SPLIT_AND_GIT_WORKFLOW.md`
5. Your assigned track prompt:
   - Backend agent: `AGENT_PROMPT_backend.md`
   - Frontend brand agent: `AGENT_PROMPT_frontend_brand.md`
   - Frontend creator agent: `AGENT_PROMPT_frontend_creator.md`

## Non-Negotiable Rules

- Follow `DECISIONS_ADDENDUM.md` as final unless implementation evidence makes a decision impossible. If that happens, stop and flag it in `CONTRACT.md` instead of choosing a new direction alone.
- Treat `CONTRACT.md` as the source of truth for frontend-backend shapes. If a field, route, or enum is still marked TBD, do not guess it.
- Follow the ownership boundaries in `TEAM_SPLIT_AND_GIT_WORKFLOW.md`.
- Do not edit another agent's owned files unless the human explicitly asks you to or the workflow document assigns you a shared sync-point task.
- Rebase from `main` before starting work and again before pushing.
- Keep commits scoped to your track and write clear commit messages.
- Run the relevant checks before pushing:
  - Frontend: `npm run lint` and `npx tsc --noEmit --incremental false` from `Frontend/`.
  - Backend: run the available backend tests if present; at minimum run `python -m compileall src` from `backend/`.

## Track Routing

### Backend Agent

Owns `backend/**` only. Follow `AGENT_PROMPT_backend.md`.

Primary goals:
- Complete backend Phase 1 and Phase 2 first.
- Update `CONTRACT.md` with final implemented backend shapes.
- Do not touch `Frontend/**`.

### Frontend Brand Agent

Owns brand-facing frontend files only. Follow `AGENT_PROMPT_frontend_brand.md`.

Primary goals:
- Work inside `Frontend/features/campaigns/**`, `Frontend/features/brand-profile/**`, and `Frontend/app/brand/**`.
- Do not wire campaign/proposal APIs until Sync Point 1 is complete and `CONTRACT.md` has final shapes.
- Do not touch creator or backend files.

### Frontend Creator Agent

Owns creator-facing frontend files only. Follow `AGENT_PROMPT_frontend_creator.md`.

Primary goals:
- Work inside `Frontend/features/creator/**`, `Frontend/features/creator-profile/**`, and `Frontend/app/creator/**`.
- Do not wire campaign/proposal APIs until Sync Point 1 is complete and `CONTRACT.md` has final shapes.
- Do not touch brand or backend files.

## Shared Files

Shared frontend infra files must be changed only through the sync-point process in `TEAM_SPLIT_AND_GIT_WORKFLOW.md`:

- `Frontend/features/shared/marketplaceStore.ts`
- `Frontend/lib/api-client.ts`
- `Frontend/lib/auth.ts`
- `Frontend/types/api.types.ts`
- `Frontend/lib/roleMapping.ts`

## If You Are Unsure

Stop and ask. Do not silently change contract decisions, route names, role names, data shapes, or ownership boundaries.