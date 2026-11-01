# server/ — BOGCL OneOps API

Production backend: Node.js 22 · Express 5 · TypeScript (ESM) · Prisma 6 · PostgreSQL 16 · Redis 7 · BullMQ · Socket.IO.

**Not scaffolded yet.** Build it from the specification suite:

| Read | For |
| :-- | :-- |
| `../docs/platform/01_BACKEND_SPECIFICATION.md` | process topology, folder layout, request lifecycle, engines, jobs, dependencies, scripts |
| `../docs/platform/02_DATABASE_SCHEMA.md` | the complete `prisma/schema.prisma` |
| `../docs/platform/03_API_SPECIFICATION.md` | every endpoint, payload, permission key, realtime event |
| `../docs/platform/06_MODULE_FUNCTIONAL_SPECIFICATIONS.md` | business rules to implement and test |
| `../docs/platform/07_SECURITY_COMPLIANCE_AND_NFR.md` | auth, rate limits, data protection, NFR targets |
| `../docs/platform/08_DEVOPS_ENVIRONMENTS_AND_CICD.md` | env var catalog, Dockerfile, CI |
| `../docs/platform/10_CODING_STANDARDS_AND_CONVENTIONS.md` | code style, module skeleton |

Agent workflow: `.cursor/skills/add-backend-module` and `.cursor/skills/prisma-migration`; rules in `.cursor/rules/backend.mdc` and `database-prisma.mdc`.

Planned scripts (see spec §11): `dev`, `build`, `start:api|worker|scheduler`, `prisma:*`, `openapi:gen`, `test`, `test:int`, `lint`, `typecheck`.
