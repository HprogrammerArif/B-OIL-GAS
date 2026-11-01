import { combineReducers, configureStore, type Reducer } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { AppState } from "react-native";
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from "redux-persist";
import { connectivity } from "@/lib/connectivity";
import { baseApi } from "./api/baseApi";
import { apiPersistConfig, authPersistConfig, uiPersistConfig } from "./persist/config";
import authReducer from "./slices/auth.slice";
import uiReducer from "./slices/ui.slice";
import { listenerMiddleware } from "./listeners";

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  ui: persistReducer(uiPersistConfig, uiReducer),
  [baseApi.reducerPath]: persistReducer(
    apiPersistConfig,
    baseApi.reducer as unknown as Reducer<Record<string, unknown>>,
  ) as unknown as typeof baseApi.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] },
      // The API cache and seed-sized payloads make the dev-only immutability walk slow on device.
      immutableCheck: { warnAfter: 128 },
    })
      .prepend(listenerMiddleware.middleware)
      .concat(baseApi.middleware),
});

export const persistor = persistStore(store);

/** RTK Query's focus/reconnect events, driven by React Native sources instead of the DOM. */
setupListeners(store.dispatch, (dispatch, actions) => {
  const stopConnectivity = connectivity.start();
  const unsubscribeNet = connectivity.subscribe((online) => dispatch(online ? actions.onOnline() : actions.onOffline()));
  const appState = AppState.addEventListener("change", (next) =>
    dispatch(next === "active" ? actions.onFocus() : actions.onFocusLost()),
  );
  return () => {
    unsubscribeNet();
    stopConnectivity();
    appState.remove();
  };
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
