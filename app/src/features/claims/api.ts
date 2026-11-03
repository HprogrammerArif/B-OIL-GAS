import { newIdempotencyKey } from "@/lib/device";
import { baseApi } from "@/redux/api/baseApi";
import { LIST } from "@/redux/api/tags";
import type { Envelope, ListEnvelope, Page } from "@/types/api";
import type { ClaimComputation, ClaimDetail, ClaimItem, ClaimPolicy, ClaimQuery, CreateClaimRequest } from "@/types/domain/claims";

const CLAIMS = { type: "Claim" as const, id: LIST };
/** Filing or withdrawing a claim also changes the approvers' inbox and the requester's notifications. */
const SIDE_EFFECTS = [{ type: "Inbox" as const, id: LIST }, { type: "Notification" as const, id: LIST }];

export const claimsApi = baseApi.injectEndpoints({
  overrideExisting: __DEV__,
  endpoints: (build) => ({
    getClaimPolicy: build.query<ClaimPolicy, void>({
      query: () => "/claims/policy",
      transformResponse: (r: Envelope<ClaimPolicy>) => r.data,
      providesTags: [{ type: "ExpensePolicy", id: LIST }, CLAIMS],
    }),
    getClaims: build.query<Page<ClaimItem>, ClaimQuery>({
      query: ({ status, page }) => ({ url: "/claims", params: { status, page, pageSize: 30 } }),
      transformResponse: (r: ListEnvelope<ClaimItem>) => ({ items: r.data, meta: r.meta }),
      providesTags: (res) => [...(res?.items ?? []).map((c) => ({ type: "Claim" as const, id: c.id })), CLAIMS],
    }),
    getClaim: build.query<ClaimDetail, string>({
      query: (id) => `/claims/${id}`,
      transformResponse: (r: Envelope<ClaimDetail>) => r.data,
      providesTags: (_r, _e, id) => [{ type: "Claim", id }],
    }),
    computeClaim: build.mutation<ClaimComputation, CreateClaimRequest>({
      query: (body) => ({ url: "/claims/compute", method: "POST", body }),
      transformResponse: (r: Envelope<ClaimComputation>) => r.data,
    }),
    createClaim: build.mutation<ClaimDetail, { body: CreateClaimRequest; idempotencyKey: string }>({
      query: ({ body, idempotencyKey }) => ({ url: "/claims", method: "POST", body, headers: { "idempotency-key": idempotencyKey } }),
      transformResponse: (r: Envelope<ClaimDetail>) => r.data,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: null }));
        if (data) dispatch(claimsApi.util.upsertQueryData("getClaim", data.id, data));
      },
      invalidatesTags: [CLAIMS, { type: "ExpensePolicy", id: LIST }, ...SIDE_EFFECTS],
    }),
    resubmitClaim: build.mutation<ClaimDetail, { id: string; body: CreateClaimRequest }>({
      query: ({ id, body }) => ({ url: `/claims/${id}/resubmit`, method: "POST", body, headers: { "idempotency-key": newIdempotencyKey() } }),
      transformResponse: (r: Envelope<ClaimDetail>) => r.data,
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: null }));
        if (data) dispatch(claimsApi.util.upsertQueryData("getClaim", id, data));
      },
      invalidatesTags: [CLAIMS, ...SIDE_EFFECTS],
    }),
    withdrawClaim: build.mutation<ClaimDetail, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({ url: `/claims/${id}/withdraw`, method: "POST", body: { reason }, headers: { "idempotency-key": newIdempotencyKey() } }),
      transformResponse: (r: Envelope<ClaimDetail>) => r.data,
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: null }));
        if (data) dispatch(claimsApi.util.upsertQueryData("getClaim", id, data));
      },
      invalidatesTags: [CLAIMS, ...SIDE_EFFECTS],
    }),
  }),
});

export const {
  useGetClaimPolicyQuery,
  useGetClaimsQuery,
  useGetClaimQuery,
  useComputeClaimMutation,
  useCreateClaimMutation,
  useResubmitClaimMutation,
  useWithdrawClaimMutation,
} = claimsApi;
