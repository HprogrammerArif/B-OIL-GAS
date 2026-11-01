---
name: update-platform-docs
description: Keep the docs/platform specification suite (00–10) consistent when behaviour, schema, API, or stack decisions change. Use when code changes a documented rule/endpoint/model, when adding an ADR, or when the user asks to update the platform documentation.
disable-model-invocation: true
---

# Update Platform Docs

## Where each kind of change goes
| Change | Update |
| :-- | :-- |
| Architecture / library / cross-cutting decision | `00` §4 ADR table (add `ADR-nn`, never edit an accepted ADR's decision — supersede it) |
| Model, enum, index, view | `02` (schema block + §3 views) and `server/prisma/schema.prisma` |
| Endpoint, payload, error, event | `03` module section + Appendix A permissions; regenerate `openapi.json` |
| Page/route/component/hook (web) | `04` route table + module section |
| Screen/flow/native capability (mobile) | `05` module section + package table |
| Business rule, state, threshold, notification | `06` (`BR-xx-nn` — append new ids, mark removed rules as *Deprecated*; update Setting keys appendix) |
| Security control, NFR target | `07` |
| Env var, pipeline, deploy step | `08` env catalog / workflow section |
| Scope, phase, story | `09` |
| Convention | `10` and the matching `.cursor/rules/*.mdc` |

## Procedure
```
- [ ] Identify every doc affected using the table (changes usually touch 2–3 docs)
- [ ] Edit in place; keep numbering stable; use the existing table formats
- [ ] Cross-references: search docs/platform for the old name/value (rg) and fix all hits
- [ ] Bump the "Status" line at the top of each edited doc (e.g. v1.1 — <date> — <summary>)
- [ ] If the prototype report (docs/00_PROJECT_CURRENT_STATE…) is contradicted by a new finding about client/, correct it there too
- [ ] Mention the doc edits in the PR/commit (`docs(platform): …`)
```

## Style
Terse, tables over prose, testable statements, no marketing language; names must match code exactly (PascalCase models, UPPER_SNAKE enums, `module:action` permissions, `/api/v1/...` paths).
