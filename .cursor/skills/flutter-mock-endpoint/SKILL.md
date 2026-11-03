---
name: flutter-mock-endpoint
description: Add a mock API endpoint and engine logic to the Flutter app's in-app mock server (doc 03 envelope, zod-equivalent validation, auth, scope, seed data, persistence). Use when a feature needs new data or business-rule behaviour.
---

# Add a Mock Endpoint

Mock server lives in `ftr-a/lib/mock` (ported from `app/src/mock`): `router` (register routes), `db` (tables persisted in SQLite via drift), `engines/` (workflow, claims, leave, etc.), `seed/` (versioned).

```
- [ ] Route registered with method, path, required permission (doc 03 path)
- [ ] Request validated by a Dart validator; failures return VALIDATION_ERROR 422 with details
- [ ] Auth via the session; scope filtering (SELF/TEAM/DEPARTMENT/SITE/COMPANY) applied in the data layer
- [ ] Success envelope {data, meta}; errors use doc 03 codes; lists support page/pageSize/sort/q
- [ ] POST that creates/transitions honours Idempotency-Key (replay returns first response)
- [ ] Business rules cite BR ids; state transitions raise INVALID_STATE_TRANSITION
- [ ] Writes persisted; seed bumped (MOCK_DB_VERSION) if shape changed
- [ ] Simulated latency 150-600 ms and occasional realistic failures only when the demo menu enables them
- [ ] Side effects publish notifications/audit entries via engines
```
