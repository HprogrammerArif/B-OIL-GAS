import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RoleKey } from "@/types/domain/identity";

/** Small identity summary for instant header/lock-screen render; the full profile is `getMe`. */
export interface AuthUser {
  id: string;
  empCode: string;
  fullName: string;
  fullNameBn: string;
  shortName: string;
  initials: string;
  avatarColor: string;
}

export interface AuthState {
  status: "signedOut" | "signedIn";
  user: AuthUser | null;
  roles: RoleKey[];
  /** In memory only (blacklisted from persistence); restored via refresh on cold start. */
  accessToken: string | null;
  accessTokenExpiresAt: number | null;
  biometricEnabled: boolean;
  /** When false the session ends at the next cold start ("Keep me signed in" off). */
  keepSignedIn: boolean;
  /** Set on cold start / long background when biometrics are on; cleared by unlock. */
  locked: boolean;
  lastActiveAt: number | null;
  /** Why the last session ended, for the login screen banner. */
  endReason: "expired" | "signedOut" | null;
}

const initialState: AuthState = {
  status: "signedOut",
  user: null,
  roles: [],
  accessToken: null,
  accessTokenExpiresAt: null,
  biometricEnabled: false,
  keepSignedIn: true,
  locked: false,
  lastActiveAt: null,
  endReason: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    sessionStarted(
      state,
      action: PayloadAction<{ accessToken: string; expiresIn: number; roles: RoleKey[]; keepSignedIn: boolean }>,
    ) {
      state.status = "signedIn";
      state.keepSignedIn = action.payload.keepSignedIn;
      state.accessToken = action.payload.accessToken;
      state.accessTokenExpiresAt = Date.now() + action.payload.expiresIn * 1000;
      state.roles = action.payload.roles;
      state.user = null;
      state.locked = false;
      state.lastActiveAt = Date.now();
      state.endReason = null;
    },
    profileLoaded(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
    },
    tokenRefreshed(state, action: PayloadAction<{ accessToken: string; expiresIn: number }>) {
      state.accessToken = action.payload.accessToken;
      state.accessTokenExpiresAt = Date.now() + action.payload.expiresIn * 1000;
    },
    sessionExpired(state) {
      return { ...initialState, biometricEnabled: state.biometricEnabled, endReason: "expired" };
    },
    signedOut(state) {
      return { ...initialState, biometricEnabled: state.biometricEnabled, endReason: "signedOut" };
    },
    biometricToggled(state, action: PayloadAction<boolean>) {
      state.biometricEnabled = action.payload;
    },
    locked(state) {
      if (state.status === "signedIn" && state.biometricEnabled) state.locked = true;
    },
    unlocked(state) {
      state.locked = false;
      state.lastActiveAt = Date.now();
    },
    activityPinged(state) {
      state.lastActiveAt = Date.now();
    },
  },
});

export const {
  sessionStarted,
  profileLoaded,
  tokenRefreshed,
  sessionExpired,
  signedOut,
  biometricToggled,
  locked,
  unlocked,
  activityPinged,
} = authSlice.actions;

export default authSlice.reducer;
