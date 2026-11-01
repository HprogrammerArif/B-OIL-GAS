---
name: add-web-feature
description: Scaffold a feature slice in frontend/ (RTK Query endpoints, pages, routes, forms, i18n, MSW handlers, tests) that ports a prototype module into the production React app. Use when adding a module, page, or screen to the web frontend.
disable-model-invocation: true
---

# Add a Web Feature Slice

## Inputs to confirm first
1. Module section in `docs/platform/04_WEB_FRONTEND_SPECIFICATION.md` (routes, components, hooks, forms).
2. Endpoints in `docs/platform/03_API_SPECIFICATION.md`; regenerate types if the contract changed: `npm run api:types`.
3. Prototype screen in `client/src/views/<View>.tsx` for layout/labels only (read-only).

## Checklist
```
- [ ] src/features/<module>/api/<module>Api.ts — baseApi.injectEndpoints, tags { type: '<Entity>', id } + 'LIST'
- [ ] src/features/<module>/schemas/*.ts — zod form schemas mirroring API body schemas
- [ ] src/features/<module>/pages/*Page.tsx — lazy default exports; use PageHeader, DataTable/FilterBar, EmptyState
- [ ] src/features/<module>/components/* — named exports, no server fetching inside (hooks only)
- [ ] Route entries in src/app/router.tsx with RequirePermission('<module>:<action>')
- [ ] Sidebar nav item in src/widgets/sidebar/nav.ts gated by permission
- [ ] i18n: src/shared/i18n/locales/en/<module>.json + bn/<module>.json (copy EN→BN labels from the prototype's t(en, bn) pairs)
- [ ] Realtime: subscribe in useModuleRealtime() → invalidateTags / updateQueryData
- [ ] MSW handlers src/test/msw/handlers/<module>.ts; component tests for list, create, transition dialog
- [ ] Loading skeleton, error retry, empty state on every page
- [ ] npm run lint && npm run typecheck && npm test
```

## Patterns

```ts
// api/parcelsApi.ts
export const parcelsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getParcels: b.query<Paged<Parcel>, ParcelListParams>({
      query: (params) => ({ url: '/parcels', params }),
      providesTags: (res) => tagsFor('Parcel', res?.data),
    }),
    verifyParcelOtp: b.mutation<Parcel, { id: string; otp: string }>({
      query: ({ id, otp }) => ({ url: `/parcels/${id}/verify-otp`, method: 'POST', body: { otp } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Parcel', id }, { type: 'Parcel', id: 'LIST' }],
    }),
  }),
});
export const { useGetParcelsQuery, useVerifyParcelOtpMutation } = parcelsApi;
```

```tsx
// pages/ParcelsPage.tsx
export default function ParcelsPage() {
  const { t } = useTranslation('parcels');
  const [params, setParams] = useListParams({ sort: '-createdAt' });
  const { data, isLoading, isError, refetch } = useGetParcelsQuery(params);
  if (isLoading) return <TableSkeleton />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!data?.data.length) return <EmptyState title={t('empty.title')} />;
  return <DataTable columns={columns} rows={data.data} meta={data.meta} onParamsChange={setParams} />;
}
```

Form errors: `applyServerErrors(error, form.setError)` maps `error.details[].path` → fields.
