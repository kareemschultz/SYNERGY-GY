import { router } from "expo-router";
import {
  Bell,
  ChevronRight,
  Fingerprint,
  LogOut,
  Shield,
  User,
} from "lucide-react-native";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBiometricAuth } from "@/hooks/use-biometric";
import { useAuth } from "@/providers/auth-provider";

/**
 * Client settings screen.
 */
export default function ClientSettingsScreen() {
  const { portalUser, logout } = useAuth();
  const { isAvailable, isEnabled, biometricType, toggleBiometric } =
    useBiometricAuth();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleBiometricToggle = async (value: boolean) => {
    const success = await toggleBiometric(value);
    if (!success && value) {
      Alert.alert(
        "Biometric Setup Failed",
        "Could not enable biometric authentication."
      );
    }
  };

  const fullName = portalUser
    ? `${portalUser.firstName} ${portalUser.lastName}`
    : "Client";

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <Text className="mb-6 font-bold text-2xl text-foreground">
          Settings
        </Text>

        {/* Profile Section */}
        <View className="mb-6 rounded-xl border border-border bg-card p-4">
          <View className="flex-row items-center gap-4">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-accent">
              <Text className="font-bold text-accent-foreground text-lg">
                {portalUser?.firstName?.charAt(0) ?? "C"}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-foreground text-lg">
                {fullName}
              </Text>
              <Text className="text-muted-foreground text-sm">
                {portalUser?.email}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings List */}
        <View className="gap-2">
          <SettingsItem icon={User} title="Profile">
            <ChevronRight color="#71717a" size={20} />
          </SettingsItem>

          <SettingsItem icon={Bell} title="Notifications">
            <ChevronRight color="#71717a" size={20} />
          </SettingsItem>

          {isAvailable ? (
            <SettingsItem
              icon={Fingerprint}
              subtitle={`Use ${biometricType ?? "biometrics"} to unlock`}
              title={`${biometricType ?? "Biometric"} Login`}
            >
              <Switch
                onValueChange={handleBiometricToggle}
                thumbColor={isEnabled ? "#ffffff" : "#71717a"}
                trackColor={{ false: "#27272a", true: "#3b82f6" }}
                value={isEnabled}
              />
            </SettingsItem>
          ) : null}

          <SettingsItem icon={Shield} title="Privacy & Security">
            <ChevronRight color="#71717a" size={20} />
          </SettingsItem>
        </View>

        {/* Sign Out */}
        <Pressable
          className="mt-8 flex-row items-center justify-center gap-2 rounded-lg border border-destructive bg-destructive/10 py-4"
          onPress={handleLogout}
        >
          <LogOut color="#ef4444" size={20} />
          <Text className="font-semibold text-destructive">Sign Out</Text>
        </Pressable>

        {/* App Version */}
        <Text className="mt-8 text-center text-muted-foreground text-xs">
          GK-Nexus v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsItem({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-4 rounded-lg border border-border bg-card p-4">
      <Icon color="#71717a" size={22} />
      <View className="flex-1">
        <Text className="text-foreground">{title}</Text>
        {subtitle ? (
          <Text className="text-muted-foreground text-sm">{subtitle}</Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}
