import { newIdempotencyKey } from "@/lib/device";
import { baseApi } from "@/redux/api/baseApi";
import { LIST } from "@/redux/api/tags";
import type { Envelope, ListEnvelope, Page } from "@/types/api";
import type {
  ActiveBroadcast,
  ComposeOptions,
  CreateBroadcastRequest,
  CreateNoticeRequest,
  Notice,
  NoticeListItem,
  NoticeQuery,
  NoticeReceipts,
} from "@/types/domain/notice";

const NOTICES = { type: "Notice" as const, id: LIST };
const BROADCAST = { type: "Broadcast" as const, id: "ACTIVE" };
const NOTIFICATIONS = [
  { type: "Notification" as const, id: LIST },
  { type: "Notification" as const, id: "COUNT" },
];

export const noticesApi = baseApi.injectEndpoints({
  overrideExisting: __DEV__,
  endpoints: (build) => ({
    getNotices: build.query<Page<NoticeListItem>, NoticeQuery>({
      query: ({ category, unread, requiresAck, q, page }) => ({
        url: "/notices",
        params: {
          category,
          unread: unread ? "true" : undefined,
          requiresAck: requiresAck ? "true" : undefined,
          q,
          page,
          pageSize: 30,
        },
      }),
      transformResponse: (r: ListEnvelope<NoticeListItem>) => ({ items: r.data, meta: r.meta }),
      providesTags: (res) => [...(res?.items ?? []).map((n) => ({ type: "Notice" as const, id: n.id })), NOTICES],
      keepUnusedDataFor: 1800,
    }),
    getNotice: build.query<Notice, string>({
      query: (id) => `/notices/${id}`,
      transformResponse: (r: Envelope<Notice>) => r.data,
      providesTags: (_r, _e, id) => [{ type: "Notice", id }],
      // The server marks the receipt read on GET (doc 03 §7); mirror that into cached lists without refetching them.
      async onQueryStarted(id, { dispatch, getState, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: null }));
        const readAt = data?.receipt?.readAt;
        if (!readAt) return;
        let changed = false;
        for (const args of noticesApi.util.selectCachedArgsForQuery(getState(), "getNotices")) {
          dispatch(
            noticesApi.util.updateQueryData("getNotices", args, (draft) => {
              const row = draft.items.find((n) => n.id === id);
              if (!row?.receipt || row.receipt.readAt) return;
              changed = true;
              row.receipt.readAt = readAt;
              if (args.unread) {
                draft.items = draft.items.filter((n) => n.id !== id);
                draft.meta.total = Math.max(draft.meta.total - 1, 0);
              }
            }),
          );
        }
        if (changed) dispatch(baseApi.util.invalidateTags(NOTIFICATIONS));
      },
    }),
    ackNotice: build.mutation<Notice, string>({
      query: (id) => ({ url: `/notices/${id}/ack`, method: "POST", headers: { "idempotency-key": newIdempotencyKey() } }),
      transformResponse: (r: Envelope<Notice>) => r.data,
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: null }));
        if (data) dispatch(noticesApi.util.upsertQueryData("getNotice", id, data));
      },
      invalidatesTags: [NOTICES, BROADCAST, ...NOTIFICATIONS],
    }),
    setNoticePinned: build.mutation<Notice, { id: string; pinned: boolean }>({
      query: ({ id, pinned }) => ({ url: `/notices/${id}/${pinned ? "pin" : "unpin"}`, method: "POST" }),
      transformResponse: (r: Envelope<Notice>) => r.data,
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: null }));
        if (data) dispatch(noticesApi.util.upsertQueryData("getNotice", id, data));
      },
      invalidatesTags: [NOTICES, { type: "Notice", id: "COMPOSE" }],
    }),
    archiveNotice: build.mutation<Notice, string>({
      query: (id) => ({ url: `/notices/${id}/archive`, method: "POST", headers: { "idempotency-key": newIdempotencyKey() } }),
      transformResponse: (r: Envelope<Notice>) => r.data,
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: null }));
        if (data) dispatch(noticesApi.util.upsertQueryData("getNotice", id, data));
      },
      invalidatesTags: [NOTICES, BROADCAST, { type: "Notice", id: "COMPOSE" }],
    }),
    getNoticeReceipts: build.query<NoticeReceipts, string>({
      query: (id) => `/notices/${id}/receipts`,
      transformResponse: (r: Envelope<NoticeReceipts>) => r.data,
      providesTags: (_r, _e, id) => [{ type: "Notice", id }],
    }),
    getComposeOptions: build.query<ComposeOptions, void>({
      query: () => "/notices/compose-options",
      transformResponse: (r: Envelope<ComposeOptions>) => r.data,
      providesTags: [{ type: "Notice", id: "COMPOSE" }],
    }),
    /** Doc 03 §7: create the draft, then publish it; each step carries its own idempotency key. */
    publishNotice: build.mutation<Notice, { body: CreateNoticeRequest; keys: { create: string; publish: string } }>({
      async queryFn({ body, keys }, _api, _extra, baseQuery) {
        const created = await baseQuery({ url: "/notices", method: "POST", body, headers: { "idempotency-key": keys.create } });
        if (created.error) return { error: created.error };
        const draft = (created.data as Envelope<Notice>).data;
        const published = await baseQuery({
          url: `/notices/${draft.id}/publish`,
          method: "POST",
          headers: { "idempotency-key": keys.publish },
        });
        if (published.error) return { error: published.error };
        return { data: (published.data as Envelope<Notice>).data };
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: null }));
        if (data) dispatch(noticesApi.util.upsertQueryData("getNotice", data.id, data));
      },
      invalidatesTags: [NOTICES, { type: "Notice", id: "COMPOSE" }],
    }),
    getActiveBroadcast: build.query<ActiveBroadcast | null, void>({
      query: () => "/broadcasts/active",
      transformResponse: (r: Envelope<ActiveBroadcast | null>) => r.data,
      providesTags: [BROADCAST],
    }),
    createBroadcast: build.mutation<{ broadcastId: string; notice: Notice }, { body: CreateBroadcastRequest; idempotencyKey: string }>({
      query: ({ body, idempotencyKey }) => ({ url: "/broadcasts", method: "POST", body, headers: { "idempotency-key": idempotencyKey } }),
      transformResponse: (r: Envelope<{ broadcastId: string; notice: Notice }>) => r.data,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: null }));
        if (data) dispatch(noticesApi.util.upsertQueryData("getNotice", data.notice.id, data.notice));
      },
      invalidatesTags: [NOTICES, BROADCAST, { type: "Notice", id: "COMPOSE" }],
    }),
    dismissBroadcast: build.mutation<void, string>({
      query: (id) => ({ url: `/broadcasts/${id}/dismiss`, method: "POST" }),
      async onQueryStarted(_id, { dispatch, queryFulfilled }) {
        const patch = dispatch(noticesApi.util.updateQueryData("getActiveBroadcast", undefined, () => null));
        await queryFulfilled.catch(() => patch.undo());
      },
    }),
  }),
});

export const {
  useGetNoticesQuery,
  useGetNoticeQuery,
  useAckNoticeMutation,
  useSetNoticePinnedMutation,
  useArchiveNoticeMutation,
  useGetNoticeReceiptsQuery,
  useGetComposeOptionsQuery,
  usePublishNoticeMutation,
  useGetActiveBroadcastQuery,
  useCreateBroadcastMutation,
  useDismissBroadcastMutation,
} = noticesApi;
