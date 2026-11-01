// src/app/redux/store.ts
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import NetInfo from "@react-native-community/netinfo";
import { AppState } from "react-native";
import authReducer from "./features/auth/authSlice";
import childReducer from "./features/child/childSlice";
import tabIndicatorReducer from "./features/notificationService/tabIndicatorSlice";
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import secureStorage from "./storage";
import { baseApi } from "./api/baseApi";

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  child: childReducer,
  tabIndicator: tabIndicatorReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

// Persist config
const persistConfig = {
  key: "root",
  version: 1,
  storage: secureStorage, // Use SecureStore
  whitelist: ["auth", "child"], // Persist only auth and child states, not the API cache
  keyPrefix: "persist_", // Use underscore instead of colon for SecureStore compatibility
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware),
});

export const persistor = persistStore(store);

// Wire RTK Query's internal event system to real React Native events.
// This makes both `refetchOnReconnect` and `refetchOnFocus` work in RN,
// since the browser events RTK Query uses (window.online, visibilitychange)
// don't exist in React Native.
setupListeners(store.dispatch, (dispatch, actions) => {
  // ── Network connectivity ──────────────────────────────────────────────
  const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      dispatch(actions.onOnline());
    } else {
      dispatch(actions.onOffline());
    }
  });

  // ── App foreground / background ───────────────────────────────────────
  // When the user reopens the app (Case 1, 2, 3 from race condition analysis)
  // RTK Query's `refetchOnFocus: true` will re-fetch all active queries.
  const appStateSubscription = AppState.addEventListener("change", (nextState) => {
    if (nextState === "active") {
      dispatch(actions.onFocus());
    } else {
      dispatch(actions.onFocusLost());
    }
  });

  return () => {
    unsubscribeNetInfo();
    appStateSubscription.remove();
  };
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
