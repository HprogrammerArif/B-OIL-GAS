import { baseApi } from "../../api/baseApi";

export interface DeviceTokenData {
  userId: string;
  token: string;
  platform: string;
  deviceName?: string;
  osVersion?: string;
}

export interface NotificationPreferences {
  scheduleReminders: boolean;
  expenseAlerts: boolean;
  documentAlerts: boolean;
  marketingNotifications: boolean;
  reminderTime: number; // hours before event
}

export interface NotificationHistoryItem {
  id: string;
  title: string;
  body: string;
  /** e.g. "expense" | "schedule" | "general" | "milestone" | "document" */
  notification_type?: string;
  /** Legacy local field kept for compatibility */
  type?: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  /** Backend-supplied deep-link, e.g. "/schedules/26/" or "/expenses/19/". Null means no navigation. */
  redirect_url?: string | null;
  related_child?: number | null;
  related_child_name?: string | null;
  related_expense?: number | null;
  related_milestone?: number | null;
  related_schedule?: number | null;
  related_user_email?: string | null;
}

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Register device token
    registerDeviceToken: builder.mutation<{ message: string }, DeviceTokenData>({
      query: (data) => ({
        url: "notifications/register/",
        // url: 'notifications/register-device',
        method: "POST",
        body: data,
      }),
    }),

    // Unregister device token (for logout)
    unregisterDeviceToken: builder.mutation<{ message: string }, { token: string }>({
      query: (data) => ({
        url: "notifications/deactivate/",
        // url: 'notifications/unregister-device',
        method: "POST",
        body: data,
      }),
    }),

    // Get user's notification preferences
    getNotificationPreferences: builder.query<NotificationPreferences, void>({
      query: () => "notifications/preferences",
      providesTags: ["NotificationPreferences"],
    }),

    // Update notification preferences
    updateNotificationPreferences: builder.mutation<
      { message: string },
      Partial<NotificationPreferences>
    >({
      query: (data) => ({
        url: "notifications/preferences",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["NotificationPreferences"],
    }),

    // Get notification history
    getNotificationHistory: builder.query<
      NotificationHistoryItem[],
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 20 }) => `notifications/?page=${page}&page_size=${limit}`,
      transformResponse: (response: { results: NotificationHistoryItem[] }) => response.results,
      providesTags: ["NotificationHistory"],
    }),

    // Mark notification as read for single notification
    markNotificationAsRead: builder.mutation<{ message: string }, { notificationId: string }>({
      query: ({ notificationId }) => ({
        url: `notifications/${notificationId}/`,
        method: "PUT",
        body: { is_read: true },
      }),
      invalidatesTags: ["NotificationHistory"],
    }),

    // Mark all notifications as read
    markAllNotificationsAsRead: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: "notifications/mark-read/",
        // url: 'notifications/read-all',
        method: "PUT",
      }),
      invalidatesTags: ["NotificationHistory"],
    }),

    // Delete notification
    deleteNotification: builder.mutation<{ message: string }, { notificationId: string }>({
      query: ({ notificationId }) => ({
        url: `notifications/${notificationId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["NotificationHistory"],
    }),

    // Get unread notification count
    getUnreadNotificationCount: builder.query<{ unread_count: number }, void>({
      query: () => "notifications/unread-count",
      providesTags: ["NotificationHistory"],
    }),
  }),
});

export const {
  useRegisterDeviceTokenMutation,
  useUnregisterDeviceTokenMutation,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
  useGetNotificationHistoryQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
  useGetUnreadNotificationCountQuery,
} = notificationApi;
