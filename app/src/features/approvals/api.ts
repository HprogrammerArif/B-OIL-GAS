import { newIdempotencyKey } from "@/lib/device";
import { baseApi } from "@/redux/api/baseApi";
import { LIST } from "@/redux/api/tags";
import type { Envelope, ListEnvelope, Page } from "@/types/api";
import type {
  ActionRequest,
  ActionResult,
  BatchActionResult,
  HistoryItem,
  InboxItem,
  InboxQuery,
  InboxSummary,
  SignatureOtp,
  StepDecision,
  WorkflowInstance,
} from "@/types/domain/workflow";

const toPage = <T>(r: ListEnvelope<T>): Page<T> => ({ items: r.data, meta: r.meta });

export const approvalsApi = baseApi.injectEndpoints({
  overrideExisting: __DEV__,
  endpoints: (build) => ({
    getInbox: build.query<Page<InboxItem>, InboxQuery>({
      query: ({ category, q, sla, view, page }) => ({
        url: "/workflow/inbox",
        params: { category, q, sla, view, page, pageSize: 50 },
      }),
      transformResponse: toPage<InboxItem>,
      providesTags: (res) => [
        ...(res?.items ?? []).map((i) => ({ type: "Approval" as const, id: i.instanceId })),
        { type: "Inbox", id: LIST },
      ],
      keepUnusedDataFor: 600,
    }),
    getInboxSummary: build.query<InboxSummary, void>({
      query: () => "/workflow/inbox/summary",
      transformResponse: (r: Envelope<InboxSummary>) => r.data,
      providesTags: [{ type: "Inbox", id: "SUMMARY" }, { type: "Inbox", id: LIST }],
      keepUnusedDataFor: 600,
    }),
    getApprovalHistory: build.query<Page<HistoryItem>, { decision?: StepDecision; page?: number }>({
      query: ({ decision, page }) => ({ url: "/workflow/history", params: { decision, page } }),
      transformResponse: toPage<HistoryItem>,
      providesTags: [{ type: "Approval", id: "HISTORY" }],
    }),
    getApproval: build.query<WorkflowInstance, string>({
      query: (id) => `/workflow/instances/${id}`,
      transformResponse: (r: Envelope<WorkflowInstance>) => r.data,
      providesTags: (_r, _e, id) => [{ type: "Approval", id }],
    }),
    requestSignatureOtp: build.mutation<SignatureOtp, string>({
      query: (id) => ({ url: `/workflow/instances/${id}/signature-otp`, method: "POST" }),
      transformResponse: (r: Envelope<SignatureOtp>) => r.data,
    }),
    actOnApproval: build.mutation<ActionResult, { id: string; body: ActionRequest; idempotencyKey?: string }>({
      query: ({ id, body, idempotencyKey }) => ({
        url: `/workflow/instances/${id}/actions`,
        method: "POST",
        body,
        headers: { "idempotency-key": idempotencyKey ?? newIdempotencyKey() },
      }),
      transformResponse: (r: Envelope<ActionResult>) => r.data,
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: null }));
        if (data) dispatch(approvalsApi.util.upsertQueryData("getApproval", id, data.instance));
      },
      invalidatesTags: (res, _e, { id }) => [
        { type: "Inbox", id: LIST },
        { type: "Approval", id: "HISTORY" },
        { type: "Notification", id: LIST },
        ...(res ? [] : [{ type: "Approval" as const, id }]),
      ],
    }),
    batchApprove: build.mutation<BatchActionResult, { instanceIds: string[]; comment?: string }>({
      query: (body) => ({
        url: "/workflow/instances/batch-actions",
        method: "POST",
        body: { ...body, type: "APPROVE" },
        headers: { "idempotency-key": newIdempotencyKey() },
      }),
      transformResponse: (r: Envelope<BatchActionResult>) => r.data,
      invalidatesTags: (_r, _e, { instanceIds }) => [
        { type: "Inbox", id: LIST },
        { type: "Approval", id: "HISTORY" },
        ...instanceIds.map((id) => ({ type: "Approval" as const, id })),
      ],
    }),
  }),
});

export const {
  useGetInboxQuery,
  useGetInboxSummaryQuery,
  useGetApprovalHistoryQuery,
  useGetApprovalQuery,
  useRequestSignatureOtpMutation,
  useActOnApprovalMutation,
  useBatchApproveMutation,
} = approvalsApi;
