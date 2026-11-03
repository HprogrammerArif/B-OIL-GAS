# Mobile feature status (role-wise tracker)

Update this file after every role pass. Source of truth for what is reachable in the app:
`src/lib/routes.ts` (`isRouteBuilt`) controls which quick actions / More tiles / notification links are shown.
Add a path there in the same change that adds its screen.

Legend: BUILT = screen + mock handler exist and tests pass. MISSING = no screen (hidden from the UI for now). Web ref = prototype in `client/`, rules in `docs/platform/06`.

## Module status

| Module | Mobile screens | Mock API | Status | Spec |
| :-- | :-- | :-- | :-- | :-- |
| Auth / session / biometric lock | login, lock | `/auth/*`, `/__demo/*` | BUILT | doc 05 §6 |
| Home (role variants, quick actions) | home | `/me*` | BUILT | doc 05 §10 |
| Approvals (inbox, decide, history) | inbox, `approvals/[id]`, history | `/workflow/*` | BUILT | MOD-17 |
| Notices and broadcasts | list, detail, compose, broadcast | `/notices*`, `/broadcasts*` | BUILT | MOD-01 |
| Attendance (punch, history, regularise) | 3 screens | `/attendance/*`, `/geofences` | BUILT | MOD-10 |
| Leave | list, new, detail | `/leave/*` | BUILT | MOD-10 |
| Notifications | list, critical ack | `/notifications*` | BUILT | doc 05 §7 |
| Profile / Settings | 2 screens | `/me/preferences` | BUILT | doc 05 §11 |
| Outbox (offline queue) | none | n/a | MISSING | doc 05 §5 |
| Claims (TA/DA, conveyance, tour) | none | none | MISSING | MOD-11/12/13 |
| Fleet and dispatch | none | none | MISSING | MOD-09 |
| Visitors (register, gate) | none | none | MISSING | MOD-08 |
| Incidents (HSE) | none | none | MISSING | MOD-07 |
| Parcels | none | none | MISSING | MOD-04 |
| Note-sheets | none | none | MISSING | MOD-03 |
| Bus, Chat, Assets, Dashboards, Compliance, Workforce | none | none | MISSING | MOD-14/15/05/02/06/16 |

## Role pass log

| Phase | Persona (empCode) | Built modules verified | Dead ends found | State |
| :-- | :-- | :-- | :-- | :-- |
| 0 | all 7 personas | links from notifications, inbox, notices, leave lists open (`role-links.audit.test.ts`) | quick actions and More tiles to MISSING modules; `/outbox` row | FIXED: hidden until built; not-found text now says "not available in this version yet" |
| 1 | Employee (EMP-1042) | home, attendance, leave, notices, notifications, profile | claims, vehicle, guest, incident, parcel, note-sheet requesters | NEXT: build requesters (needs mock handlers + screens) |
| 2 | HOD+Finance (EMP-0062), HR (EMP-0028), Plant GM+HSE (EMP-0012), Chairman (EMP-0001) | approvals, leave approve, notices publish, broadcast | claims decisions, incident triage, dashboards | PENDING |
| 3 | Transport+Gate+Mailroom (EMP-0045), Driver (EMP-0821) | punch, notices | fleet dispatch/console, visitor gate, parcel scan | PENDING |
| 4 | Office modules | n/a | note-sheets, bus, chat, assets, dashboards, compliance, workforce | PENDING |

## Web sync checklist (per module, before marking BUILT)

- [ ] Statuses, labels, permission keys match `client/` and doc 06 (`BR-xx-nn`).
- [ ] Mock endpoint paths, envelope and error codes match doc 03 so `frontend/` can reuse them.
- [ ] EN + BN i18n keys added.
- [ ] Doc 03 / 06 updated if behaviour changed.
- [ ] `npm run typecheck`, `npm run lint`, `npm test` green; walked on a device as the persona.

## Notes

- Where the mock returns 404 for a record the persona may not read (by design, to avoid leaking existence), the UI shows "This item no longer exists." The audit test asserts no list row or notification link produces that for any persona.
- `frontend/` and `server/` are not scaffolded; web parity is currently measured against `client/` and the docs.
