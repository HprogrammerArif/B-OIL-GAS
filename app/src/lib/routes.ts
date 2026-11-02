import type { Href } from "expo-router";

/** Single source of in-app paths; server-provided `route` strings are mapped through `fromServerRoute`. */
export const routes = {
  home: "/" as Href,
  inbox: "/inbox" as Href,
  notifications: "/notifications" as Href,
  approval: (id: string) => `/approvals/${id}` as Href,
  approvalHistory: "/approvals/history" as Href,
  profile: "/profile" as Href,
  settings: "/settings" as Href,
};

/** Only prefixes with a registered screen; anything else falls back so a tap never lands on "unmatched route". */
const KNOWN_PREFIXES = ["/approvals/"];

export function fromServerRoute(route: string | undefined, fallback: Href = routes.inbox): Href {
  if (route && KNOWN_PREFIXES.some((p) => route.startsWith(p))) return route as Href;
  return fallback;
}
