import { useGetMeQuery, useGetMyPermissionsQuery } from "./api";

/**
 * Keeps the profile and grants subscribed for the whole signed-in session so they
 * refetch on focus/reconnect and stay in the persisted offline cache. Mounted once per
 * session, so the forced refetch revalidates whatever was rehydrated from disk.
 */
export function useSessionBootstrap(): void {
  useGetMeQuery(undefined, { refetchOnMountOrArgChange: true });
  useGetMyPermissionsQuery(undefined, { refetchOnMountOrArgChange: true });
}
