import { Stack } from "expo-router";

/**
 * Auth layout - simple stack for login/register screens.
 * No header shown for a cleaner auth experience.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0c0c0c" },
        animation: "fade",
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="staff-login" />
      <Stack.Screen name="client-login" />
    </Stack>
  );
}
