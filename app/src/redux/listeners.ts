import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { baseApi } from "./api/baseApi";
import { profileLoaded, sessionExpired, signedOut } from "./slices/auth.slice";
import type { Me } from "@/types/domain/identity";

export const listenerMiddleware = createListenerMiddleware();

/** Mirror the profile into the compact persisted auth summary. */
listenerMiddleware.startListening({
  predicate: (action) =>
    action.type.endsWith("/fulfilled") &&
    (action as { meta?: { arg?: { endpointName?: string } } }).meta?.arg?.endpointName === "getMe",
  effect: (action, api) => {
    const me = (action as unknown as { payload: Me }).payload;
    const e = me.employee;
    api.dispatch(
      profileLoaded({
        id: me.id,
        empCode: e.empCode,
        fullName: e.fullName,
        fullNameBn: e.fullNameBn,
        shortName: e.shortName,
        initials: e.initials,
        avatarColor: e.avatarColor,
      }),
    );
  },
});

/** Session end: drop cached server data (memory and disk) so the next user starts clean. */
listenerMiddleware.startListening({
  matcher: isAnyOf(sessionExpired, signedOut),
  effect: async (_action, api) => {
    api.dispatch(baseApi.util.resetApiState());
    await AsyncStorage.removeItem("persist:baseApi");
  },
});
