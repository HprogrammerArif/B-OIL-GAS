import Toast from "react-native-toast-message";
import { haptic } from "./haptics";

/** Transient feedback; screens pass already-translated strings. */
export const toast = {
  success(title: string, message?: string) {
    haptic.success();
    Toast.show({ type: "success", text1: title, text2: message, visibilityTime: 2600 });
  },
  error(title: string, message?: string) {
    haptic.error();
    Toast.show({ type: "error", text1: title, text2: message, visibilityTime: 3600 });
  },
  info(title: string, message?: string) {
    Toast.show({ type: "info", text1: title, text2: message, visibilityTime: 2600 });
  },
};
