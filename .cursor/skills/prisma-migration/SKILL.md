---
name: prisma-migration
description: Safely change the Prisma schema and create a migration for the server/ PostgreSQL database, keeping docs/platform/02_DATABASE_SCHEMA.md in sync. Use when adding or altering models, enums, indexes, views, or seed data.
disable-model-invocation: true
---

# Prisma Schema Change & Migration

## Workflow
```
- [ ] Edit server/prisma/schema.prisma following .cursor/rules/database-prisma.mdc (uuid PK, @@map snake_case, timestamptz, Decimal(14,2), indexes on FKs)
- [ ] Mirror the change in docs/platform/02_DATABASE_SCHEMA.md (same block) and bump its status line
- [ ] Decide: additive (safe) vs destructive (needs approval + expand/backfill/contract plan)
- [ ] npm run prisma:migrate -- --name <verb>_<object>   (e.g. add_parcel_return_reason)
- [ ] Review generated SQL: no unintended DROP/ALTER TYPE; add CONCURRENTLY for large-table indexes (hand-edit the new migration only)
- [ ] Views / trigram indexes / partitions / REVOKE grants → add a hand-written SQL migration with --create-only
- [ ] npm run prisma:generate; fix TypeScript errors in repositories and mappers
- [ ] Update seed files if new required columns/enums (idempotent upserts)
- [ ] npm run prisma:validate && npm test (integration suite applies migrations on a fresh DB)
- [ ] Note the migration in the PR description with rollback steps
```

## Enum changes
Append values only. Renaming/removing a value once deployed requires: add new value → migrate rows → stop writing old → remove in a later release.

## Backfills
Run as a BullMQ one-off job or a `scripts/backfill-*.ts` with batching (1,000 rows, `ORDER BY id`), never inside the migration for large tables.

## Never
`prisma migrate reset`, `db push --force-reset`, or raw `DROP` against shared databases without explicit user approval.
