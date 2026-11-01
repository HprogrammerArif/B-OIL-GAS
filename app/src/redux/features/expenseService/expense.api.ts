import { baseApi } from "../../api/baseApi";

const expenseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // get all expenses and recent expenses and category expenses
    getALlExpenses: builder.query({
      query: (params?: { status?: string; child?: number | string }) => {
        const queryParams: Record<string, string | number> = {};
        if (params?.status) queryParams.status = params.status;
        if (params?.child && params.child !== "all") queryParams.child = params.child;

        return {
          url: `expenses/list/`,
          params: queryParams,
        };
      },
      providesTags: ["Expense"],
    }),

    // POST EXPENSES FILES BY FORM DATA
    postExpenses: builder.mutation({
      query: (body) => ({
        url: `expenses/list/`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Expense"],
    }),

    // approve expense
    approveExpense: builder.mutation({
      query: ({ id, payload }: { id: string | number; payload: Record<string, unknown> }) => ({
        url: `expenses/approve/${id}/`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Expense"],
    }),

    // reject expense
    rejectExpense: builder.mutation({
      query: ({ id, payload }: { id: string | number; payload: Record<string, unknown> }) => ({
        url: `expenses/approve/${id}/`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Expense"],
    }),

    // SHOW STATICS DATA
    getStaticsData: builder.query({
      query: (params?: { child_id?: string | number; year?: number }) => {
        // Build query params object, filtering out undefined values
        const queryParams: any = {};

        if (params?.year) {
          queryParams.year = params.year;
        }

        if (params?.child_id && params.child_id !== "all") {
          queryParams.child_id = params.child_id;
        }

        return {
          url: `expenses/stats/`,
          params: queryParams,
        };
      },
      providesTags: ["Expense"],
    }),

    // END
  }),
});

export const {
  usePostExpensesMutation,
  useGetALlExpensesQuery,
  useApproveExpenseMutation,
  useRejectExpenseMutation,
  useGetStaticsDataQuery,
} = expenseApi;
