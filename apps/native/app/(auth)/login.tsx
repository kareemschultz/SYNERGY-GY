import { router } from "expo-router";
import { Briefcase, User } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Login role selector screen.
 * User chooses whether to log in as staff or client.
 */
export default function LoginScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-6">
        {/* Logo/Title */}
        <View className="mb-12 items-center">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-2xl bg-primary">
            <Text className="font-bold text-4xl text-primary-foreground">
              GK
            </Text>
          </View>
          <Text className="font-bold text-3xl text-foreground">GK-Nexus</Text>
          <Text className="mt-2 text-muted-foreground">
            Select your account type
          </Text>
        </View>

        {/* Role Selection Cards */}
        <View className="w-full max-w-sm gap-4">
          {/* Staff Login */}
          <Pressable
            className="flex-row items-center gap-4 rounded-xl border border-border bg-card p-5 active:opacity-80"
            onPress={() => router.push("/(auth)/staff-login")}
          >
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Briefcase color="#ffffff" size={24} />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-foreground text-lg">
                Staff Login
              </Text>
              <Text className="text-muted-foreground text-sm">
                For GCMC & KAJ employees
              </Text>
            </View>
          </Pressable>

          {/* Client Login */}
          <Pressable
            className="flex-row items-center gap-4 rounded-xl border border-border bg-card p-5 active:opacity-80"
            onPress={() => router.push("/(auth)/client-login")}
          >
            <View className="h-12 w-12 items-center justify-center rounded-full bg-accent/10">
              <User color="#ffffff" size={24} />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-foreground text-lg">
                Client Portal
              </Text>
              <Text className="text-muted-foreground text-sm">
                Access your account & documents
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Footer */}
        <Text className="absolute bottom-8 text-center text-muted-foreground text-xs">
          GCMC & KAJ Business Services
        </Text>
      </View>
    </SafeAreaView>
  );
}
