# frontend/ — BOGCL OneOps Web App

Production web client: React 19 · Vite · TypeScript · React Router 7 · Redux Toolkit + RTK Query · Tailwind v4 + shadcn/ui · react-hook-form + zod · i18next (EN/BN).

**Not scaffolded yet.** Build it from the specification suite:

| Read | For |
| :-- | :-- |
| `../docs/platform/04_WEB_FRONTEND_SPECIFICATION.md` | stack, folder structure, routes, state model, design system, per-module pages, performance/a11y/testing |
| `../docs/platform/03_API_SPECIFICATION.md` | endpoints consumed; types generated via `openapi-typescript` |
| `../docs/platform/06_MODULE_FUNCTIONAL_SPECIFICATIONS.md` | states, labels, rules the UI must reflect |
| `../docs/00_PROJECT_CURRENT_STATE_COMPREHENSIVE_REPORT.md` + `../client/` | visual/functional reference (prototype is read-only) |
| `../docs/platform/10_CODING_STANDARDS_AND_CONVENTIONS.md` | code style |

Agent workflow: `.cursor/skills/add-web-feature`; rules in `.cursor/rules/frontend.mdc`.

Planned scripts: `dev`, `build`, `preview`, `test`, `e2e`, `lint`, `typecheck`, `api:types`.
