import { baseApi } from "../../api/baseApi";

const homeScreenSentimentGraphApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // get all expenses and recent expenses and category expenses
    getHomeScreenSentimentGraphData: builder.query({
      query: (params?: { period?: string }) => {
        return {
          url: `chat/sentiment-stats/`,
          params,
        };
      },
      providesTags: ["HomeScreenSentimentGraph"],
    }),

    // END
  }),
});

export const { useGetHomeScreenSentimentGraphDataQuery } = homeScreenSentimentGraphApi;
