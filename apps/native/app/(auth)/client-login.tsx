import { router } from "expo-router";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { portalClient, unwrapOrpc } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";

/**
 * Client portal login screen.
 * Uses portal authentication (separate from staff auth).
 */
export default function ClientLoginScreen() {
  const { loginPortal } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!(email.trim() && password.trim())) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      // Call the portal login API
      const response = await portalClient.portal.auth.login({
        email: email.trim(),
        password,
      });

      const data = unwrapOrpc<{
        sessionToken: string;
        user: {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          clientId: string;
        };
      }>(response);

      if (data.sessionToken && data.user) {
        await loginPortal(data.sessionToken, {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          clientId: data.user.clientId,
        });

        // Navigate to client dashboard
        router.replace("/(client)");
      } else {
        Alert.alert("Error", "Invalid response from server");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Login failed. Please check your credentials.";
      Alert.alert("Login Failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-2">
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full active:bg-secondary"
            onPress={() => router.back()}
          >
            <ArrowLeft color="#ffffff" size={24} />
          </Pressable>
        </View>

        <View className="flex-1 justify-center px-6">
          {/* Title */}
          <View className="mb-8">
            <Text className="font-bold text-3xl text-foreground">
              Client Portal
            </Text>
            <Text className="mt-2 text-muted-foreground">
              Sign in to access your documents and matters
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            {/* Email */}
            <View>
              <Text className="mb-2 text-foreground text-sm">Email</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                className="rounded-lg border border-border bg-card px-4 py-3 text-foreground"
                editable={!isLoading}
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#71717a"
                value={email}
              />
            </View>

            {/* Password */}
            <View>
              <Text className="mb-2 text-foreground text-sm">Password</Text>
              <View className="relative">
                <TextInput
                  autoCapitalize="none"
                  autoComplete="password"
                  className="rounded-lg border border-border bg-card px-4 py-3 pr-12 text-foreground"
                  editable={!isLoading}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#71717a"
                  secureTextEntry={!showPassword}
                  value={password}
                />
                <Pressable
                  className="absolute top-3 right-3"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff color="#71717a" size={20} />
                  ) : (
                    <Eye color="#71717a" size={20} />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Submit Button */}
            <Pressable
              className="mt-4 items-center justify-center rounded-lg bg-primary py-4 active:opacity-80 disabled:opacity-50"
              disabled={isLoading}
              onPress={handleLogin}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" color="#0c0c0c" size={20} />
              ) : (
                <Text className="font-semibold text-primary-foreground">
                  Sign In
                </Text>
              )}
            </Pressable>

            {/* Forgot Password Link */}
            <Pressable className="mt-4 items-center">
              <Text className="text-muted-foreground text-sm">
                Forgot your password?{" "}
                <Text className="text-primary">Reset it here</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
