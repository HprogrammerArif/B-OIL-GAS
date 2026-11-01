import * as LocalAuthentication from "expo-local-authentication";

export async function biometricsAvailable(): Promise<boolean> {
  const [hardware, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hardware && enrolled;
}

/** Device-owner check; falls back to the device PIN so a failed sensor never locks the user out. */
export async function authenticate(prompt: string, cancelLabel: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: prompt,
    cancelLabel,
    disableDeviceFallback: false,
  });
  return result.success;
}
