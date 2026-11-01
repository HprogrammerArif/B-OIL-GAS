---
name: rtk-query
description: Knows the RTK Query patterns used in this project — how to inject endpoints into baseApi, define tag types, use typed hooks, and handle auth token in headers.
---

# RTK Query Skill — Project Patterns

## Base API Location

`src/redux/api/baseApi.ts` — the single RTK Query base API. All feature APIs are injected into it.

## Adding a New Feature API

**NEVER create a new `createApi()` call.** Always inject into `baseApi`:

```ts
// src/redux/features/myFeature/myFeature.api.ts
import { baseApi } from "@/redux/api/baseApi";

export const myFeatureApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getItems: builder.query<Item[], void>({
      query: () => "/api/items/",
      providesTags: ["Items"],
    }),
    createItem: builder.mutation<Item, Partial<Item>>({
      query: (body) => ({ url: "/api/items/", method: "POST", body }),
      invalidatesTags: ["Items"],
    }),
  }),
});

export const { useGetItemsQuery, useCreateItemMutation } = myFeatureApi;
```

## Registering Tag Types

Add all tag types to `baseApi.ts` `tagTypes` array before using them:

```ts
// In redux/api/baseApi.ts
tagTypes: [
  "Child",
  "Items", // ← add your new tag here
  // ...
];
```

## Using Typed Hooks

```ts
// ✅ Correct — typed wrappers
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";

const dispatch = useAppDispatch();
const user = useAppSelector(selectCurrentUser);

// ❌ Wrong — raw hooks
import { useDispatch, useSelector } from "react-redux";
```

## Invalidating Cache After Mutations

```ts
// In a mutation endpoint
invalidatesTags: [{ type: "Items", id: "LIST" }];

// Manually (from a component)
dispatch(baseApi.util.invalidateTags(["Items"]));
```

## Auth Token

The token is automatically injected in `prepareHeaders` inside `baseApi.ts`.
You do NOT need to manually add `Authorization` headers in individual endpoints.

## Skip Auth for Public Endpoints

Add the endpoint name to the `skipAuth` array in `baseApi.ts`:

```ts
const skipAuth = [
  "login",
  "register",
  "myPublicEndpoint", // ← add here
];
```
