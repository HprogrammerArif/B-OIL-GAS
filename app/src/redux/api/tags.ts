/** Tag taxonomy shared with `frontend/` (doc 05 §4.3). */
export const TAG_TYPES = [
  "Me", "Session", "Permissions", "Preferences", "Notification", "NotificationPreference",
  "Inbox", "Approval", "Delegation",
  "Notice", "Broadcast", "Briefing",
  "NoteSheet", "Parcel", "Visit", "Incident", "Capa",
  "Trip", "TripEvent", "TollClaim", "Requisition", "FleetChat", "FuelVoucher", "Vehicle", "Driver",
  "AttendanceToday", "AttendanceDay", "Punch", "Regularisation", "Geofence",
  "LeaveRequest", "LeaveBalance", "LeaveType",
  "Claim", "Advance", "ExpensePolicy",
  "BusSeat", "BusRoute", "Waitlist", "SeatOffer",
  "ChatChannel", "ChatMessage", "Directive",
  "Asset", "Custody", "Licence", "Employee", "Dashboard", "DueItem",
] as const;

export type TagType = (typeof TAG_TYPES)[number];

export const LIST = "LIST" as const;

/** `providesTags` helper for list responses: one tag per item plus the LIST tag. */
export function listTags<T extends TagType>(type: T, items: { id: string }[] | undefined) {
  return [...(items ?? []).map(({ id }) => ({ type, id })), { type, id: LIST }];
}
