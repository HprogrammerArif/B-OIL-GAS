import { baseApi } from "../../api/baseApi";

export type TSubscriptionPlan = {
  id: number;
  name: string;
  price: string;
  duration_days: number;
  description: string; // JSON string of features
};

export type TSubscriptionStatus = {
  status: string;
  plan_name: string | null;
  is_active: boolean;
  end_date: string | null;
  ai_messages_sent: number;
  ai_messages_max: number;
  co_parent_messages_sent: number;
  co_parent_messages_max: number;
};

export type TPurchaseSubscriptionBody = {
  plan_slug: string;
  receipt_data: string;
};

export const subscriptionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSubscriptionPlans: builder.query<TSubscriptionPlan[], void>({
      query: () => "subscriptions/plans/",
      providesTags: ["SubscriptionPlans"],
    }),
    getMySubscription: builder.query<TSubscriptionStatus, void>({
      query: () => "subscriptions/status/",
      providesTags: ["MySubscription"],
    }),
    purchaseSubscription: builder.mutation<void, TPurchaseSubscriptionBody>({
      query: (body) => ({
        url: "subscriptions/purchase/",
        method: "POST",
        body,
      }),
      // Invalidate the subscription status so it refetches automatically
      invalidatesTags: ["MySubscription"],
    }),
  }),
});

export const {
  useGetSubscriptionPlansQuery,
  useGetMySubscriptionQuery,
  usePurchaseSubscriptionMutation,
} = subscriptionApi;
