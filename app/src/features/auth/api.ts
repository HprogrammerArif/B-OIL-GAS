import { baseApi } from "@/redux/api/baseApi";
import type { Envelope } from "@/types/api";
import type { LoginRequest, LoginResponse, Me, MyPermissions, UserSession } from "@/types/domain/identity";

export interface Preferences {
  lang: "EN" | "BN";
  theme: "LIGHT" | "DARK" | "SYSTEM";
  notifications: { channels: ("IN_APP" | "PUSH" | "SMS" | "EMAIL")[]; quietStart: string | null; quietEnd: string | null };
}

export interface DemoPersona {
  empCode: string;
  roleLabel: string;
  roleLabelBn: string;
  fullName: string;
  fullNameBn: string;
  initials: string;
  avatarColor: string;
  designation: string;
  designationBn: string;
}

type DeviceInfo = LoginRequest["device"];

export const authApi = baseApi.injectEndpoints({
  overrideExisting: __DEV__,
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      transformResponse: (r: Envelope<LoginResponse>) => r.data,
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
    }),
    getMe: build.query<Me, void>({
      query: () => "/me",
      transformResponse: (r: Envelope<Me>) => r.data,
      providesTags: ["Me"],
      keepUnusedDataFor: 86_400,
    }),
    updateMe: build.mutation<Me, { preferredLang?: "EN" | "BN"; employee?: { emergencyContact?: string; bloodGroup?: string } }>({
      query: (body) => ({ url: "/me", method: "PATCH", body }),
      transformResponse: (r: Envelope<Me>) => r.data,
      invalidatesTags: ["Me"],
    }),
    getMyPermissions: build.query<MyPermissions, void>({
      query: () => "/me/permissions",
      transformResponse: (r: Envelope<MyPermissions>) => r.data,
      providesTags: ["Permissions"],
      keepUnusedDataFor: 86_400,
    }),
    getPreferences: build.query<Preferences, void>({
      query: () => "/me/preferences",
      transformResponse: (r: Envelope<Preferences>) => r.data,
      providesTags: ["Preferences"],
    }),
    updatePreferences: build.mutation<Preferences, Partial<Preferences>>({
      query: (body) => ({ url: "/me/preferences", method: "PATCH", body }),
      transformResponse: (r: Envelope<Preferences>) => r.data,
      invalidatesTags: ["Preferences"],
    }),
    getSessions: build.query<UserSession[], void>({
      query: () => "/auth/sessions",
      transformResponse: (r: Envelope<UserSession[]>) => r.data,
      providesTags: ["Session"],
    }),
    revokeSession: build.mutation<void, string>({
      query: (id) => ({ url: `/auth/sessions/${id}`, method: "DELETE" }),
      invalidatesTags: ["Session"],
    }),
    demoPersonas: build.query<DemoPersona[], void>({
      query: () => "/__demo/personas",
      transformResponse: (r: Envelope<DemoPersona[]>) => r.data,
    }),
    demoSession: build.mutation<LoginResponse, { empCode: string; device: DeviceInfo }>({
      query: (body) => ({ url: "/__demo/session", method: "POST", body }),
      transformResponse: (r: Envelope<LoginResponse>) => r.data,
    }),
    demoReset: build.mutation<void, void>({
      query: () => ({ url: "/__demo/reset", method: "POST" }),
    }),
  }),
});

export const {
  useLoginMutation,
  useGetMeQuery,
  useUpdateMeMutation,
  useGetMyPermissionsQuery,
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
  useGetSessionsQuery,
  useRevokeSessionMutation,
  useDemoPersonasQuery,
} = authApi;
