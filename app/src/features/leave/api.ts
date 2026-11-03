import { newIdempotencyKey } from "@/lib/device";
import { baseApi } from "@/redux/api/baseApi";
import { LIST } from "@/redux/api/tags";
import type { Envelope, ListEnvelope, Page } from "@/types/api";
import type { CreateLeaveRequest, LeaveBalance, LeavePolicy, LeaveQuery, LeaveRequestDetail, LeaveRequestItem, LeaveType } from "@/types/domain/leave";

const REQUESTS = { type: "LeaveRequest" as const, id: LIST };
const BALANCES = { type: "LeaveBalance" as const, id: LIST };
/** Approving or cancelling leave changes calendar days, approvals and notifications too. */
const SIDE_EFFECTS = [BALANCES, { type: "AttendanceDay" as const, id: LIST }, { type: "Inbox" as const, id: LIST }, { type: "Notification" as const, id: LIST }];

export const leaveApi = baseApi.injectEndpoints({
  overrideExisting: __DEV__,
  endpoints: (build) => ({
    getLeaveTypes: build.query<LeaveType[], void>({
      query: () => "/leave/types",
      transformResponse: (r: Envelope<LeaveType[]>) => r.data,
      providesTags: [{ type: "LeaveType", id: LIST }],
      keepUnusedDataFor: 24 * 3600,
    }),
    getLeavePolicy: build.query<LeavePolicy, void>({
      query: () => "/leave/policy",
      transformResponse: (r: Envelope<LeavePolicy>) => r.data,
      keepUnusedDataFor: 24 * 3600,
    }),
    getLeaveBalances: build.query<LeaveBalance[], { year: number }>({
      query: ({ year }) => ({ url: "/leave/balances", params: { year } }),
      transformResponse: (r: Envelope<LeaveBalance[]>) => r.data,
      providesTags: [BALANCES],
    }),
    getLeaveRequests: build.query<Page<LeaveRequestItem>, LeaveQuery>({
      query: ({ scope = "mine", status, page }) => ({ url: "/leave/requests", params: { scope, status, page, pageSize: 30 } }),
      transformResponse: (r: ListEnvelope<LeaveRequestItem>) => ({ items: r.data, meta: r.meta }),
      providesTags: (res) => [...(res?.items ?? []).map((l) => ({ type: "LeaveRequest" as const, id: l.id })), REQUESTS],
    }),
    getLeaveRequest: build.query<LeaveRequestDetail, string>({
      query: (id) => `/leave/requests/${id}`,
      transformResponse: (r: Envelope<LeaveRequestDetail>) => r.data,
      providesTags: (_r, _e, id) => [{ type: "LeaveRequest", id }],
    }),
    createLeaveRequest: build.mutation<LeaveRequestDetail, { body: CreateLeaveRequest; idempotencyKey: string }>({
      query: ({ body, idempotencyKey }) => ({ url: "/leave/requests", method: "POST", body, headers: { "idempotency-key": idempotencyKey } }),
      transformResponse: (r: Envelope<LeaveRequestDetail>) => r.data,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: null }));
        if (data) dispatch(leaveApi.util.upsertQueryData("getLeaveRequest", data.id, data));
      },
      invalidatesTags: [REQUESTS, ...SIDE_EFFECTS],
    }),
    cancelLeaveRequest: build.mutation<LeaveRequestDetail, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({ url: `/leave/requests/${id}/cancel`, method: "POST", body: { reason }, headers: { "idempotency-key": newIdempotencyKey() } }),
      transformResponse: (r: Envelope<LeaveRequestDetail>) => r.data,
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: null }));
        if (data) dispatch(leaveApi.util.upsertQueryData("getLeaveRequest", id, data));
      },
      invalidatesTags: [REQUESTS, ...SIDE_EFFECTS],
    }),
  }),
});

export const {
  useGetLeaveTypesQuery,
  useGetLeavePolicyQuery,
  useGetLeaveBalancesQuery,
  useGetLeaveRequestsQuery,
  useGetLeaveRequestQuery,
  useCreateLeaveRequestMutation,
  useCancelLeaveRequestMutation,
} = leaveApi;
