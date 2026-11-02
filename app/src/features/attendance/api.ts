import { baseApi } from "@/redux/api/baseApi";
import { LIST } from "@/redux/api/tags";
import type { Envelope } from "@/types/api";
import type {
  AttendanceKpis,
  AttendanceRange,
  CreateRegularisationRequest,
  Geofence,
  PunchRequest,
  PunchResponse,
  Regularisation,
  RosterFilter,
  RosterRow,
  TodayAttendance,
} from "@/types/domain/attendance";
import { newIdempotencyKey } from "@/lib/device";

const TODAY = { type: "AttendanceToday" as const, id: "ME" };
const ROSTER = { type: "AttendanceDay" as const, id: "ROSTER" };
const REGS = { type: "Regularisation" as const, id: LIST };

export const attendanceApi = baseApi.injectEndpoints({
  overrideExisting: __DEV__,
  endpoints: (build) => ({
    getGeofences: build.query<Geofence[], void>({
      query: () => "/geofences",
      transformResponse: (r: Envelope<Geofence[]>) => r.data,
      providesTags: [{ type: "Geofence", id: LIST }],
      keepUnusedDataFor: 24 * 3600,
    }),
    getTodayAttendance: build.query<TodayAttendance, { lat?: number; lng?: number } | void>({
      query: (args) => ({ url: "/attendance/me/today", params: args ? { lat: args.lat, lng: args.lng } : undefined }),
      transformResponse: (r: Envelope<TodayAttendance>) => r.data,
      // Position-specific args are not cacheable; the offline copy is keyed by the coordinate-free call.
      serializeQueryArgs: ({ endpointName }) => endpointName,
      providesTags: [TODAY],
    }),
    punchAttendance: build.mutation<PunchResponse, { body: PunchRequest; idempotencyKey: string }>({
      query: ({ body, idempotencyKey }) => ({ url: "/attendance/punch", method: "POST", body, headers: { "idempotency-key": idempotencyKey } }),
      transformResponse: (r: Envelope<PunchResponse>) => r.data,
      invalidatesTags: [TODAY, ROSTER, REGS, { type: "AttendanceDay", id: LIST }, { type: "Notification", id: "COUNT" }],
    }),
    getAttendanceRange: build.query<AttendanceRange, { from: string; to: string }>({
      query: (params) => ({ url: "/attendance/me", params }),
      transformResponse: (r: Envelope<AttendanceRange>) => r.data,
      providesTags: [{ type: "AttendanceDay", id: LIST }],
    }),
    getRoster: build.query<RosterRow[], { status: RosterFilter; q?: string }>({
      query: ({ status, q }) => ({ url: "/attendance/live", params: { status, q } }),
      transformResponse: (r: Envelope<RosterRow[]>) => r.data,
      providesTags: [ROSTER],
    }),
    getAttendanceKpis: build.query<AttendanceKpis, void>({
      query: () => "/attendance/kpis",
      transformResponse: (r: Envelope<AttendanceKpis>) => r.data,
      providesTags: [ROSTER],
    }),
    getRegularisations: build.query<Regularisation[], { scope: "mine" | "team" }>({
      query: ({ scope }) => ({ url: "/attendance/regularisations", params: { scope } }),
      transformResponse: (r: Envelope<Regularisation[]>) => r.data,
      providesTags: [REGS],
    }),
    createRegularisation: build.mutation<Regularisation, { body: CreateRegularisationRequest; idempotencyKey?: string }>({
      query: ({ body, idempotencyKey }) => ({
        url: "/attendance/regularisations",
        method: "POST",
        body,
        headers: { "idempotency-key": idempotencyKey ?? newIdempotencyKey() },
      }),
      transformResponse: (r: Envelope<Regularisation>) => r.data,
      invalidatesTags: [REGS, TODAY, { type: "AttendanceDay", id: LIST }, { type: "Inbox", id: LIST }],
    }),
  }),
});

export const {
  useGetGeofencesQuery,
  useGetTodayAttendanceQuery,
  usePunchAttendanceMutation,
  useGetAttendanceRangeQuery,
  useGetRosterQuery,
  useGetAttendanceKpisQuery,
  useGetRegularisationsQuery,
  useCreateRegularisationMutation,
} = attendanceApi;
