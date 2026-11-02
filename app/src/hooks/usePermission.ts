import { useMemo } from "react";
import { authApi } from "@/features/auth/api";
import { useAppSelector } from "@/redux/hooks";
import type { GrantScope, ModuleKey, PermissionGrant, PermissionKey } from "@/types/domain/identity";

const SCOPE_RANK: Record<GrantScope, number> = { SELF: 0, TEAM: 1, DEPARTMENT: 2, SITE: 3, COMPANY: 4 };
const selectPermissions = authApi.endpoints.getMyPermissions.select();

/**
 * UI gating only — the server re-checks every request. Grants come from `GET /me/permissions`
 * (persisted for offline use), never from role names.
 */
export function usePermissions() {
  const data = useAppSelector((s) => selectPermissions(s).data);
  return useMemo(() => {
    const byKey = new Map<string, PermissionGrant>((data?.grants ?? []).map((g) => [g.key, g]));
    return {
      loaded: !!data,
      navigation: data?.navigation ?? ([] as ModuleKey[]),
      can: (key: PermissionKey, atLeast: GrantScope = "SELF") => {
        const g = byKey.get(key);
        return !!g && SCOPE_RANK[g.scope] >= SCOPE_RANK[atLeast];
      },
      scopeOf: (key: PermissionKey): GrantScope | null => byKey.get(key)?.scope ?? null,
      grant: (key: PermissionKey) => byKey.get(key),
      hasModule: (m: ModuleKey) => (data?.navigation ?? []).includes(m),
    };
  }, [data]);
}

export function useCan(key: PermissionKey, atLeast: GrantScope = "SELF"): boolean {
  return usePermissions().can(key, atLeast);
}
