---
name: port-prototype-module
description: End-to-end procedure for turning one prototype module from client/ into production code across server, frontend and app, using the platform specs as the contract. Use when the task is "implement MOD-xx" or "port <module> from the prototype".
disable-model-invocation: true
---

# Port a Prototype Module to Production

## 1. Gather the contract (read, don't guess)
| Source | What to take |
| :-- | :-- |
| `docs/00_PROJECT_CURRENT_STATE_COMPREHENSIVE_REPORT.md` §module | prototype behaviour, constants, known defects |
| `docs/platform/06_MODULE_FUNCTIONAL_SPECIFICATIONS.md` §MOD-xx | state machine, BR rules, notifications, permissions, acceptance criteria |
| `docs/platform/02_DATABASE_SCHEMA.md` | models/enums |
| `docs/platform/03_API_SPECIFICATION.md` §MOD-xx | endpoints, payloads, events |
| `docs/platform/04_*` / `05_*` §MOD-xx | pages/screens, hooks, forms |
| `docs/platform/09_DELIVERY_ROADMAP_AND_WORKPLAN.md` | phase, MVP vs later stories |

Do **not** copy logic from `client/src/store/*` — the prototype simulates persistence, hashing, OTP and timing; the spec defines the real behaviour.

## 2. Order of work (vertical slice)
```
- [ ] Schema: confirm models exist; otherwise `prisma-migration` skill
- [ ] Server: `add-backend-module` skill — endpoints, transitions, jobs, tests; run openapi:gen
- [ ] Types: regenerate API types in frontend/ and app/ (npm run api:types)
- [ ] Web: `add-web-feature` skill — list/detail/create/transition UI, i18n, tests
- [ ] Mobile (if doc 00 §7 marks the module mobile): `add-mobile-screen` skill
- [ ] Seed: realistic sample rows mirroring the prototype's data set
- [ ] Acceptance: implement doc 06 §k Given/When/Then as automated tests
- [ ] Docs: if anything deviated, update 03/04/05/06 in the same PR
```

## 3. Parity check before closing
Walk the prototype view with the matching persona (`cd client && npm run dev`) and tick every action the prototype offers against the production UI: list filters, status pills, timeline/events, approve/reject/return, bilingual labels, dashboards KPIs. Record gaps as follow-up stories, not silent omissions.

## 4. Deliver
Conventional commit `feat(mod-xx): …`; PR ≤ 400 LOC per slice where possible (server, web, mobile as separate PRs); include test output and screenshots.
