# Nepfluence Role Assignments

Every agent must check this file before starting work. Claim exactly one open role, then commit and push this file before editing project code.

## How To Claim A Role

1. Pull the latest `main`.
2. Open this file.
3. Choose one role with status `OPEN`.
4. Replace `OPEN` with `CLAIMED`.
5. Fill in `Owner`, `Machine/Thread`, and `Claimed At`.
6. Commit and push only this file first.
7. Start work only after your claim is on `main`.

If a role is already `CLAIMED`, do not take it. Pick another open role or ask the project owner.

## Roles

| Role | Prompt File | Status | Owner | Machine/Thread | Claimed At | Notes |
|---|---|---|---|---|---|---|
| Backend agent | `AGENT_PROMPT_backend.md` | OPEN |  |  |  | Owns `backend/**` only. |
| Brand frontend agent | `AGENT_PROMPT_frontend_brand.md` | OPEN |  |  |  | Owns brand/campaign frontend only. |
| Creator frontend agent | `AGENT_PROMPT_frontend_creator.md` | OPEN |  |  |  | Owns creator frontend only. |

## Release A Role

Only release a role when the assigned work is complete or the project owner approves reassignment. Change `CLAIMED` back to `OPEN`, clear the owner fields, and add a note explaining why.