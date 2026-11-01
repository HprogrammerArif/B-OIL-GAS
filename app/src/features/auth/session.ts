import * as Application from "expo-application";
import { secure } from "@/lib/storage/secure";
import { SecureKeys } from "@/lib/storage/keys";
import { clientPlatform, deviceName, getDeviceId } from "@/lib/device";
import { logger } from "@/lib/logger";
import { baseApi } from "@/redux/api/baseApi";
import { sessionStarted, signedOut } from "@/redux/slices/auth.slice";
import type { AppDispatch } from "@/redux/store";
import type { LoginRequest, LoginResponse } from "@/types/domain/identity";
import { authApi } from "./api";

async function deviceInfo(): Promise<LoginRequest["device"]> {
  return {
    id: await getDeviceId(),
    name: deviceName(),
    platform: clientPlatform,
    appVersion: Application.nativeApplicationVersion ?? "dev",
  };
}

async function establish(dispatch: AppDispatch, res: LoginResponse, rememberMe: boolean): Promise<void> {
  // A fresh login replaces any previous user's cached data.
  dispatch(baseApi.util.resetApiState());
  await secure.set(SecureKeys.refreshToken, res.refreshToken);
  dispatch(
    sessionStarted({
      accessToken: res.accessToken,
      expiresIn: res.expiresIn,
      roles: res.user.roles,
      keepSignedIn: rememberMe,
    }),
  );
  await Promise.all([
    dispatch(authApi.endpoints.getMe.initiate(undefined, { forceRefetch: true })),
    dispatch(authApi.endpoints.getMyPermissions.initiate(undefined, { forceRefetch: true })),
  ]);
}

/** Password sign-in. Throws the RTK Query error for the screen to map. */
export async function signIn(
  dispatch: AppDispatch,
  input: { identifier: string; password: string; rememberMe: boolean },
): Promise<void> {
  const res = await dispatch(authApi.endpoints.login.initiate({ ...input, device: await deviceInfo() })).unwrap();
  if (input.rememberMe) await secure.set(SecureKeys.rememberedIdentifier, input.identifier.trim());
  else await secure.remove(SecureKeys.rememberedIdentifier);
  await establish(dispatch, res, input.rememberMe);
}

/** Presenter panel: switch persona without credentials (mock API only). */
export async function signInAsPersona(dispatch: AppDispatch, empCode: string): Promise<void> {
  const res = await dispatch(authApi.endpoints.demoSession.initiate({ empCode, device: await deviceInfo() })).unwrap();
  await establish(dispatch, res, true);
}

/** Revoke server-side best-effort, then always clear local state. */
export async function signOut(dispatch: AppDispatch): Promise<void> {
  try {
    await dispatch(authApi.endpoints.logout.initiate()).unwrap();
  } catch (error) {
    logger.warn("logout request failed; clearing locally", error);
  }
  await secure.remove(SecureKeys.refreshToken);
  dispatch(signedOut());
}

export function rememberedIdentifier(): Promise<string | null> {
  return secure.get(SecureKeys.rememberedIdentifier);
}
