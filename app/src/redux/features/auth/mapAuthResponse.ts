import { TUser } from "./authSlice";

/**
 * Raw shape returned by POST /auth/login/ and /auth/register/.
 *
 * The exact field names depend on your backend — this adapter is the single
 * place that translates the wire response into the app's auth state, so you
 * only need to update it here (not in every screen) if your API differs.
 */
export interface RawAuthResponse {
  user: Omit<TUser, "role"> & { role?: string };
  role?: string;
  access?: string;
  token?: string;
  refresh?: string;
  refreshToken?: string;
  is_add_child?: boolean;
  isAddChild?: boolean;
  is_send_invite?: boolean;
  isSendInvite?: boolean;
  device_token?: string;
}

export function mapAuthResponse(response: RawAuthResponse) {
  return {
    user: response.user,
    role: response.role ?? response.user?.role ?? "parent",
    token: response.access ?? response.token ?? "",
    refreshToken: response.refresh ?? response.refreshToken ?? "",
    isAddChild: response.isAddChild ?? response.is_add_child ?? false,
    isSendInvite: response.isSendInvite ?? response.is_send_invite ?? false,
    device_token: response.device_token ?? "",
  };
}
