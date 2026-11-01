import React, { ReactNode } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/redux/store";
import { ActivityIndicator, View } from "react-native";

interface ReduxProviderProps {
  children: ReactNode;
}

/**
 * ReduxProvider — wraps the app with the Redux store and PersistGate.
 *
 * PersistGate delays rendering until the persisted state is rehydrated
 * from SecureStore, preventing flash-of-unauthenticated-content.
 */
export function ReduxProvider({ children }: ReduxProviderProps) {
  return (
    <Provider store={store}>
      <PersistGate
        loading={
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#2B7FFF" />
          </View>
        }
        persistor={persistor}
      >
        {children}
      </PersistGate>
    </Provider>
  );
}
