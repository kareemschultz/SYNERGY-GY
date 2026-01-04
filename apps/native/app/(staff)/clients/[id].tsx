import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Mail, Phone } from "lucide-react-native";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { staffClient, unwrapOrpc } from "@/lib/api";

type ClientDetail = {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  clientType: string;
};

/**
 * Client detail screen.
 */
export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: clientRaw, isLoading } = useQuery({
    queryKey: ["clients", "detail", id],
    queryFn: () => staffClient.clients.getById({ id: id ?? "" }),
    enabled: !!id,
  });

  const client = unwrapOrpc<ClientDetail>(clientRaw);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#ffffff" size="large" />
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Client not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 py-2">
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full active:bg-secondary"
          onPress={() => router.back()}
        >
          <ArrowLeft color="#ffffff" size={24} />
        </Pressable>
        <Text className="flex-1 font-bold text-foreground text-xl">
          {client.displayName}
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Profile Card */}
        <View className="mb-4 items-center rounded-xl border border-border bg-card p-6">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-primary">
            <Text className="font-bold text-3xl text-primary-foreground">
              {client.displayName.charAt(0)}
            </Text>
          </View>
          <Text className="font-bold text-foreground text-xl">
            {client.displayName}
          </Text>
          <Text className="text-muted-foreground capitalize">
            {client.clientType.toLowerCase()}
          </Text>
        </View>

        {/* Contact Info */}
        <View className="gap-2">
          {client.email ? (
            <View className="flex-row items-center gap-3 rounded-lg border border-border bg-card p-4">
              <Mail color="#71717a" size={20} />
              <View className="flex-1">
                <Text className="text-muted-foreground text-sm">Email</Text>
                <Text className="text-foreground">{client.email}</Text>
              </View>
            </View>
          ) : null}

          {client.phone ? (
            <View className="flex-row items-center gap-3 rounded-lg border border-border bg-card p-4">
              <Phone color="#71717a" size={20} />
              <View className="flex-1">
                <Text className="text-muted-foreground text-sm">Phone</Text>
                <Text className="text-foreground">{client.phone}</Text>
              </View>
            </View>
          ) : null}

          {client.address ? (
            <View className="rounded-lg border border-border bg-card p-4">
              <Text className="mb-1 text-muted-foreground text-sm">
                Address
              </Text>
              <Text className="text-foreground">
                {client.address}
                {client.city ? `, ${client.city}` : ""}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
