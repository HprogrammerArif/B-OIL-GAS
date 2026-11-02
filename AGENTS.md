# AGENTS.md — BOGCL OneOps

Entry point for AI agents and new engineers. Read this, then the documents it points to, before changing code.

## What this repository is

| Path | What | Status |
| :-- | :-- | :-- |
| `client/` | Interactive React prototype shown to the client (7 personas, 17 modules, no backend) | **Active demo artifact** — being enhanced per `docs/PROTOTYPE_ENHANCEMENT_PLAN.md`; stays self-contained |
| `server/` | Production API — Node 22, Express 5, TypeScript, Prisma 6, PostgreSQL 16, Redis 7, BullMQ, Socket.IO | To be built (spec: `docs/platform/01`) |
| `frontend/` | Production web app — React 19, Vite, React Router 7, Redux Toolkit + RTK Query, Tailwind v4 + shadcn/ui | To be built (spec: `docs/platform/04`) |
| `app/` | Production mobile app — Expo SDK 56, Expo Router, Redux Toolkit + RTK Query (adapted from the committed starter) | Starter present; adaptation per `docs/platform/05` |
| `infra/` | docker-compose, Dockerfiles, CI workflows, deployment manifests | To be built (spec: `docs/platform/08`) |
| `docs/` | Pitch/planning docs (01–06), prototype report (`00_PROJECT_CURRENT_STATE_COMPREHENSIVE_REPORT.md`), and the production specification suite in `docs/platform/` | Living |

No npm workspaces: each of `client/`, `server/`, `frontend/`, `app/` has its own `package.json`. Shared API types are generated from the server's OpenAPI document.

## Read in this order

1. `docs/platform/00_PLATFORM_OVERVIEW_AND_ARCHITECTURE.md` — decisions (ADRs), conventions, engines, module registry.
2. The spec for the app you are touching: `01` server · `04` web · `05` mobile.
3. `docs/platform/06_MODULE_FUNCTIONAL_SPECIFICATIONS.md` — business rules (`BR-xx-nn`) for the module.
4. `docs/platform/03_API_SPECIFICATION.md` and `02_DATABASE_SCHEMA.md` — contract and data model.
5. `docs/platform/10_CODING_STANDARDS_AND_CONVENTIONS.md`.

For what the prototype does (and its known defects), start with `docs/00_PROJECT_CURRENT_STATE_COMPREHENSIVE_REPORT.md`; for prototype enhancement work, follow `docs/PROTOTYPE_ENHANCEMENT_PLAN.md`.

## Rules and skills

- Rules in `.cursor/rules/`: `project` and `security` always apply; `backend`, `frontend`, `mobile`, `database-prisma`, `api-conventions`, `testing`, `prototype-reference` attach by path; `handoff-summary` on request.
- Skills in `.cursor/skills/`: `port-prototype-module` (end-to-end), `add-backend-module`, `add-web-feature`, `add-mobile-screen`, `prisma-migration`, `update-platform-docs`. Invoke them by name for the corresponding task.
- The Expo starter ships its own `app/.agents/AGENTS.md` and skills; they apply inside `app/` where they do not conflict with `docs/platform/05`.

## Non-negotiables

- `client/` never calls a backend or imports production code; follow `.cursor/rules/prototype-reference.mdc` when editing it.
- No secrets in the repo; `.env.example` files list names only. Never overwrite `.env*` files.
- No destructive database commands or production config changes without explicit approval.
- New dependencies need a stated reason; never swap an existing library without approval.
- Behaviour changes update the matching spec in `docs/platform/` in the same change.
- All user-facing text is bilingual (EN/BN) via i18n keys.

## Commands (per app, once scaffolded)

```
client/    npm run dev                      # prototype on http://localhost:5173
server/    npm run dev | test | lint | typecheck | prisma:migrate | openapi:gen
frontend/  npm run dev | test | lint | typecheck | api:types | e2e
app/       npx expo start | npm test | npm run lint | npm run api:types
infra/     docker compose -f docker-compose.dev.yml up -d   # postgres, redis, minio, mailpit
```

## Handoff

When finishing a session, produce the summary defined in `.cursor/rules/handoff-summary.mdc`.
