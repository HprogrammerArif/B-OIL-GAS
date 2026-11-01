import { baseApi } from "../../api/baseApi";

const documentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // get all documents and recent documents and category documents
    getALlDocuments: builder.query({
      query: (category?: string) => {
        const params = category ? { category } : undefined;
        return {
          url: `documents/files/recent/`,
          params,
        };
      },
      providesTags: ["documents"],
    }),

    // POST DOCUMENTS FILES BY FORM DATA
    postDocumentsFiles: builder.mutation({
      query: (body) => ({
        url: `documents/files/`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["documents"],
    }),

    // update document
    updateDocument: builder.mutation({
      query: ({ id, body }) => ({
        url: `documents/files/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["documents"],
    }),

    // delete document
    deleteDocument: builder.mutation({
      query: (id: string) => ({
        url: `documents/files/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["documents"],
    }),

    // get document by id
    getDocumentById: builder.query({
      query: (id: string) => ({
        url: `documents/files/${id}/`,
      }),
      providesTags: ["documents"],
    }),

    // END
  }),
});

export const {
  usePostDocumentsFilesMutation,
  useGetALlDocumentsQuery,
  useUpdateDocumentMutation,
  useDeleteDocumentMutation,
  useGetDocumentByIdQuery,
} = documentsApi;
