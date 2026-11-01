import { baseApi } from "../../api/baseApi";

const milestoneApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // post milestone
    postMilestone: builder.mutation({
      query: (body) => ({
        url: `milestones/journal/`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Milestones"],
    }),

    // get milestones
    getALlMilestones: builder.query({
      query: (childId?: string) => {
        const params = childId ? { child_id: childId } : undefined;
        return {
          url: `milestones/journal/`,
          params,
        };
      },
      providesTags: ["Milestones"],
    }),

    // update milestone
    updateMilestone: builder.mutation({
      query: ({ id, body }) => ({
        url: `milestones/journal/details/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Milestones"],
    }),

    // delete milestone
    deleteMilestone: builder.mutation({
      query: (id: string) => ({
        url: `milestones/journal/details/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Milestones"],
    }),

    // get milestone by id
    getMilestoneById: builder.query({
      query: (id: string) => ({
        url: `milestones/journal/details/${id}/`,
      }),
      providesTags: ["Milestones"],
    }),

    // END
  }),
});

export const {
  usePostMilestoneMutation,
  useGetALlMilestonesQuery,
  useUpdateMilestoneMutation,
  useDeleteMilestoneMutation,
  useGetMilestoneByIdQuery,
} = milestoneApi;
