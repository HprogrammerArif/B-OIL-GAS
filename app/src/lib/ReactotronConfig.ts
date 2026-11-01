import Reactotron from "reactotron-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules } from "react-native";

// Extend Console interface for Reactotron
declare global {
  interface Console {
    tron: typeof Reactotron;
  }
}

const reactotron = Reactotron.setAsyncStorageHandler(AsyncStorage)
  .configure({
    name: "React Native Starter",
    // On Android emulators, the host machine is at 10.0.2.2.
    // For physical devices, you should use your computer's local IP (e.g., 10.10.13.62)
    host: NativeModules.SourceCode?.scriptURL?.split("://")[1]?.split(":")[0] || "localhost",
  })
  .useReactNative({
    asyncStorage: false, // there are more options to the async storage.
    networking: {
      // optionally, you can turn it off with false.
      ignoreUrls: /symbolicate/,
    },
    editor: false, // there are more options to editor
    errors: { veto: (_stackFrame: any) => false }, // or turn it off with false
    overlay: false, // just turning off overlay
  })
  .connect();

// Clear Reactotron on boot
Reactotron.clear?.();

console.tron = reactotron;

export default reactotron;
