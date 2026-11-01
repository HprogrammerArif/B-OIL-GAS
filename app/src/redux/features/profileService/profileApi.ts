import { baseApi } from "../../api/baseApi";

const profileApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // GET PROFILE
    getUserProfile: builder.query({
      query: () => ({
        url: "auth/profile/",
        providesTags: ["Profile"],
      }),
    }),
    // GET CO-PARENT PROFILE
    getCoParentProfile: builder.query({
      query: () => ({
        url: "auth/co-parent/",
        providesTags: ["CoParentProfile"],
      }),
    }),

    // update profile by form data using put method
    // ENDPOINT: /auth/profile/
    updateUserProfile: builder.mutation({
      query: (formData) => ({
        url: "auth/profile/",
        method: "PUT",
        body: formData,
      }),
    }),

    // GET INVITATIONS
    getPendingInvitations: builder.query({
      query: () => ({
        url: "auth/pending-invitations/",
      }),
      providesTags: ["PendingInvitations"],
    }),

    // ACCEPT INVITATION
    acceptInvitation: builder.mutation({
      query: (body) => ({
        url: `auth/accept-invite/`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PendingInvitations"],
    }),

    // REJECT INVITATION
    rejectInvitation: builder.mutation({
      query: (body) => ({
        url: `auth/reject-invite/`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PendingInvitations"],
    }),

    // WITHDRAW INVITATION
    withdrawInvitation: builder.mutation({
      query: (body) => ({
        url: `auth/withdraw-invite/`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PendingInvitations"],
    }),

    // legal and privacy policy
    getLegalAndPrivacyPolicy: builder.query({
      query: () => ({
        url: "about/legal-privacy/",
      }),
    }),

    // END
  }),
});

export const {
  useGetUserProfileQuery,
  useGetCoParentProfileQuery,
  useUpdateUserProfileMutation,
  useGetPendingInvitationsQuery,
  useAcceptInvitationMutation,
  useRejectInvitationMutation,
  useWithdrawInvitationMutation,
  useGetLegalAndPrivacyPolicyQuery,
} = profileApi;
