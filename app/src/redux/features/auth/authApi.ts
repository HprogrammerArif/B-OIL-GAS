import { baseApi } from "../../api/baseApi";

const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ONBOARDING

    getOnboardingData: builder.query({
      query: () => ({
        url: "about/onboarding/",
        providesTags: ["Onboarding"],
      }),
    }),

    register: builder.mutation({
      query: (userInfo) => ({
        url: "auth/register/",
        method: "POST",
        body: userInfo,
      }),
    }),

    verifyOtp: builder.mutation({
      query: (userInfo) => ({
        url: "auth/verify-email/",
        method: "POST",
        body: userInfo,
      }),
    }),

    resendOtp: builder.mutation({
      query: (userInfo) => ({
        url: "auth/resend-verification/",
        method: "POST",
        body: userInfo,
      }),
    }),

    login: builder.mutation({
      query: (userInfo) => ({
        url: "auth/login/",
        method: "POST",
        body: userInfo,
      }),
    }),

    forgetPassword: builder.mutation({
      query: (userInfo) => ({
        url: "auth/password-reset/request/",
        method: "POST",
        body: userInfo,
      }),
    }),

    otpVerify: builder.mutation({
      query: (userInfo) => ({
        url: "auth/password-reset/verify/",
        method: "POST",
        body: userInfo,
      }),
    }),

    changePassword: builder.mutation({
      query: (userInfo) => ({
        url: "auth/password-reset/confirm/",
        method: "POST",
        body: userInfo,
      }),
    }),

    addChild: builder.mutation({
      query: (childInfo) => ({
        url: "auth/children/",
        method: "POST",
        body: childInfo,
      }),
      invalidatesTags: ["Children"],
    }),

    updateChild: builder.mutation({
      query: ({ childInfo, childId }) => ({
        url: `auth/children/${childId}/`,
        method: "PUT",
        body: childInfo,
      }),
      invalidatesTags: ["Children"],
    }),

    deleteChild: builder.mutation({
      query: ({ childId }) => ({
        url: `auth/children/${childId}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Children"],
    }),

    getChildren: builder.query({
      query: () => ({
        url: "auth/children/",
        method: "GET",
      }),
      providesTags: ["Children"],
    }),

    inviteCoParent: builder.mutation({
      query: (inviteData) => ({
        url: "auth/invite/",
        method: "POST",
        body: inviteData,
      }),
    }),

    // NOTE: profile reads/writes live in profileApi.ts (getUserProfile, updateUserProfile) — not duplicated here.

    changePasswordFromProfile: builder.mutation({
      query: (body) => ({
        url: "auth/change-password/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Profile"],
    }),

    // DELETE ACCOUNT
    deleteAccount: builder.mutation({
      query: () => ({
        url: "auth/delete-account/",
        method: "DELETE",
      }),
    }),

    // CHANGE CURRENCY
    changeCurrency: builder.mutation({
      query: (body) => ({
        url: "auth/profile/",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Profile"],
    }),

    // END
  }),
});

export const {
  useGetOnboardingDataQuery,
  useLoginMutation,
  useRegisterMutation,
  useForgetPasswordMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useChangePasswordMutation,
  // useGetUserProfileQuery,

  useChangePasswordFromProfileMutation,
  useAddChildMutation,
  useInviteCoParentMutation,
  useGetChildrenQuery,
  useLazyGetChildrenQuery,
  useOtpVerifyMutation,
  useUpdateChildMutation,
  useDeleteChildMutation,
  useDeleteAccountMutation,
  useChangeCurrencyMutation,
} = authApi;
