import { baseApi } from "@/redux/api/baseApi";
import { LIST } from "@/redux/api/tags";
import type { Envelope, ListEnvelope, Page } from "@/types/api";
import type { AppNotification, NotificationQuery, UnreadCount } from "@/types/domain/notification";

const NOTIFICATIONS = { type: "Notification" as const, id: LIST };
const COUNT = { type: "Notification" as const, id: "COUNT" };

export const notificationsApi = baseApi.injectEndpoints({
  overrideExisting: __DEV__,
  endpoints: (build) => ({
    getNotifications: build.query<Page<AppNotification>, NotificationQuery>({
      query: ({ unread, category, page }) => ({
        url: "/notifications",
        params: { unread: unread ? "true" : undefined, category, page, pageSize: 50 },
      }),
      transformResponse: (r: ListEnvelope<AppNotification>) => ({ items: r.data, meta: r.meta }),
      providesTags: [NOTIFICATIONS],
    }),
    getUnreadCount: build.query<UnreadCount, void>({
      query: () => "/notifications/unread-count",
      transformResponse: (r: Envelope<UnreadCount>) => r.data,
      providesTags: [COUNT, NOTIFICATIONS],
      keepUnusedDataFor: 600,
    }),
    markNotificationRead: build.mutation<AppNotification, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "POST" }),
      transformResponse: (r: Envelope<AppNotification>) => r.data,
      invalidatesTags: [NOTIFICATIONS, COUNT],
    }),
    markAllNotificationsRead: build.mutation<void, void>({
      query: () => ({ url: "/notifications/read-all", method: "POST" }),
      invalidatesTags: [NOTIFICATIONS, COUNT],
    }),
    ackNotification: build.mutation<AppNotification, string>({
      query: (id) => ({ url: `/notifications/${id}/ack`, method: "POST" }),
      transformResponse: (r: Envelope<AppNotification>) => r.data,
      invalidatesTags: [NOTIFICATIONS, COUNT],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useAckNotificationMutation,
} = notificationsApi;
