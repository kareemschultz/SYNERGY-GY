import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/providers/auth-provider";

/**
 * Entry point - redirects based on auth state.
 * Shows a loading spinner while checking authentication.
 */
export default function Index() {
  const { isLoading, isAuthenticated, userType } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      // Not authenticated - go to login
      router.replace("/(auth)/login");
    } else if (userType === "staff") {
      // Staff user - go to staff dashboard
      router.replace("/(staff)");
    } else if (userType === "portal") {
      // Portal/client user - go to client dashboard
      router.replace("/(client)");
    } else {
      // Unknown state - go to login
      router.replace("/(auth)/login");
    }
  }, [isLoading, isAuthenticated, userType]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator color="#ffffff" size="large" />
    </View>
  );
}
