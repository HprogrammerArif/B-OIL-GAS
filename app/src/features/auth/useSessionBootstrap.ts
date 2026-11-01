import { useGetMeQuery, useGetMyPermissionsQuery } from "./api";

/**
 * Keeps the profile and grants subscribed for the whole signed-in session so they
 * refetch on focus/reconnect and stay in the persisted offline cache.
 */
export function useSessionBootstrap(): void {
  useGetMeQuery();
  useGetMyPermissionsQuery();
}
