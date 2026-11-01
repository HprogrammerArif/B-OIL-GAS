import { selectCurrentToken } from "@/redux/features/auth/authSlice";
import { useAppSelector } from "@/redux/hooks";
import { Redirect } from "expo-router";

/**
 * Root redirect — determines where to send the user on app launch.
 * - Has token → go to main app tabs
 * - No token  → go to onboarding/welcome
 *
 * The auth guard in (app)/_layout.tsx handles session expiry redirects.
 */
export default function Index() {
  const token = useAppSelector(selectCurrentToken);

  if (token) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}
