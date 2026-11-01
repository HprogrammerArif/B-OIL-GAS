import { Stack } from "expo-router";

/**
 * Auth Layout — unauthenticated route group.
 * Screens: welcome, login, register, forgot-password
 */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
