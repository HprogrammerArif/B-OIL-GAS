---
name: add-backend-module
description: Scaffold or extend a server/ business module (router, controller, service, repository, zod schemas, policies, tests, OpenAPI registration) following the BOGCL OneOps backend layout. Use when adding a new module, a new endpoint, or a new state transition to the Express + Prisma backend.
disable-model-invocation: true
---

# Add / Extend a Backend Module

## Inputs to confirm first
1. Module id and name (e.g. `MOD-04 parcels`) → read its section in `docs/platform/06_MODULE_FUNCTIONAL_SPECIFICATIONS.md` (rules, state machine, notifications, permissions).
2. Endpoints → `docs/platform/03_API_SPECIFICATION.md` section for the module (paths, permission keys, payloads).
3. Entities → `docs/platform/02_DATABASE_SCHEMA.md` (model/enum names). If a schema change is needed, use the `prisma-migration` skill first.

## Checklist
```
- [ ] Folder src/modules/<module>/ with router, controller, service, repository, schemas, policies, events, mapper
- [ ] zod schemas registered in OpenAPI registry (createRoute per endpoint)
- [ ] Router: authenticate → authorize('<module>:<action>') → validate → controller
- [ ] Service: transitions table from doc 06 implemented as a guard map; InvalidStateTransitionError on illegal moves
- [ ] Repository: ScopeFilter applied; explicit select; pagination helper
- [ ] Reference numbers via sequence.next('<PREFIX>') inside the transaction
- [ ] Side effects: audit (automatic), notify(...), dueDates.upsert(...), emit realtime after commit
- [ ] Jobs (if any) in <module>.jobs.ts with deterministic jobId; registered in src/jobs/index.ts
- [ ] Router mounted in src/app.ts under /api/v1/<resource>
- [ ] Permissions added to prisma/seed/permissions.ts and role matrix
- [ ] Tests: service unit (BR ids) + supertest integration (happy / 403 / 422)
- [ ] npm run openapi:gen → commit openapi.json; npm run lint && npm run typecheck && npm test
- [ ] Update docs 03/06 if behaviour deviated from spec (explain why)
```

## Skeleton

```ts
// parcels.schemas.ts
export const createParcelBody = z.object({
  category: z.nativeEnum(ParcelCategory),
  description: z.string().min(3).max(500),
  recipientUserId: z.string().uuid().optional(),
  originSiteId: z.string().uuid(),
  destSiteId: z.string().uuid(),
  declaredValue: money().optional(),
});
registry.registerPath({ method: 'post', path: '/parcels', tags: ['parcels'],
  security: [{ bearerAuth: [] }], request: { body: json(createParcelBody) },
  responses: { 201: json(envelope(parcelDto)) } });

// parcels.router.ts
router.post('/', authenticate, authorize('parcels:create'), idempotent,
  validate({ body: createParcelBody }), asyncHandler(controller.create));

// parcels.service.ts
async dispatch(id: string, actor: AuthUser) {
  return prisma.$transaction(async (tx) => {
    const parcel = await repo.findForUpdate(tx, id, actor.scope) ?? throwNotFound('Parcel', id);
    assertTransition(parcel.status, ParcelStatus.DISPATCHED);   // BR-04-02
    const updated = await repo.update(tx, id, { status: ParcelStatus.DISPATCHED });
    await events.append(tx, parcel.id, ParcelEventType.HANDOVER, actor);
    afterCommit(tx, () => realtime.emitToUser(parcel.recipientUserId, 'parcel:status', dto(updated)));
    await notifications.notify({ type: 'PARCEL_DISPATCHED', recipients: [parcel.recipientUserId], data: { parcelId: id } });
    return updated;
  });
}
```

## Transition guard map pattern
```ts
const TRANSITIONS: Record<ParcelStatus, ParcelStatus[]> = {
  CREATED: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['IN_TRANSIT', 'AT_GATE'],
  // … copy exactly from doc 06 state table
};
export function assertTransition(from: ParcelStatus, to: ParcelStatus) {
  if (!TRANSITIONS[from]?.includes(to)) throw new InvalidStateTransitionError(from, to);
}
```
