import { baseApi } from "../../api/baseApi";

const supportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    submitSupportForm: builder.mutation({
      query: (body) => ({
        url: "support/form-submit/",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useSubmitSupportFormMutation } = supportApi;
