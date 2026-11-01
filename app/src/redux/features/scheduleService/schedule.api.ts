import { baseApi } from "../../api/baseApi";

const scheduleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // get all schedules and recent schedules and category schedules
    getALlSchedules: builder.query({
      query: (filter?: string) => {
        // Map filter to backend parameter
        // "All" -> undefined, "My event" -> "myEvent", "Coparent event" -> "coparentEvent"
        const params: { events?: string } = {};
        if (filter && filter !== "All") {
          params.events = filter === "My event" ? "myEvent" : "coparentEvent";
        }
        return {
          url: `schedules/events/`,
          params: Object.keys(params).length > 0 ? params : undefined,
        };
      },
      providesTags: ["Schedule"],
    }),

    // POST SCHEDULES FILES BY FORM DATA
    postSchedules: builder.mutation({
      query: (body) => ({
        url: `schedules/events/`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Schedule"],
    }),

    // delete schedule
    deleteSchedule: builder.mutation({
      query: (id: number) => ({
        url: `schedules/events/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Schedule"],
    }),

    // update schedule
    updateSchedule: builder.mutation({
      query: (body) => ({
        url: `schedules/events/${body.id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Schedule"],
    }),

    // get today schedules
    getTodaySchedules: builder.query({
      query: () => `schedules/events/today/`,
      providesTags: ["Schedule"],
    }),

    // END
  }),
});

export const {
  usePostSchedulesMutation,
  useGetALlSchedulesQuery,
  useDeleteScheduleMutation,
  useUpdateScheduleMutation,
  useGetTodaySchedulesQuery,
} = scheduleApi;
