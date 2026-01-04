import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { staffClient, unwrapOrpc } from "@/lib/api";

type MatterDetail = {
  id: string;
  referenceNumber: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  clientName: string;
  serviceType: string | null;
  createdAt: string;
};

/**
 * Matter detail screen.
 */
export default function MatterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: matterRaw, isLoading } = useQuery({
    queryKey: ["matters", "detail", id],
    queryFn: () => staffClient.matters.getById({ id: id ?? "" }),
    enabled: !!id,
  });

  const matter = unwrapOrpc<MatterDetail>(matterRaw);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#ffffff" size="large" />
      </SafeAreaView>
    );
  }

  if (!matter) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Matter not found</Text>
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
        <View className="flex-1">
          <Text className="text-muted-foreground text-sm">
            {matter.referenceNumber}
          </Text>
          <Text className="font-bold text-foreground text-lg">
            {matter.title}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Status Card */}
        <View className="mb-4 flex-row gap-2">
          <View className="flex-1 rounded-lg border border-border bg-card p-4">
            <Text className="text-muted-foreground text-xs">Status</Text>
            <Text className="mt-1 font-medium text-foreground capitalize">
              {matter.status.replace("_", " ")}
            </Text>
          </View>
          <View className="flex-1 rounded-lg border border-border bg-card p-4">
            <Text className="text-muted-foreground text-xs">Priority</Text>
            <Text className="mt-1 font-medium text-foreground capitalize">
              {matter.priority.toLowerCase()}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View className="gap-2">
          <View className="rounded-lg border border-border bg-card p-4">
            <Text className="text-muted-foreground text-xs">Client</Text>
            <Text className="mt-1 text-foreground">{matter.clientName}</Text>
          </View>

          {matter.serviceType ? (
            <View className="rounded-lg border border-border bg-card p-4">
              <Text className="text-muted-foreground text-xs">
                Service Type
              </Text>
              <Text className="mt-1 text-foreground">{matter.serviceType}</Text>
            </View>
          ) : null}

          {matter.description ? (
            <View className="rounded-lg border border-border bg-card p-4">
              <Text className="text-muted-foreground text-xs">Description</Text>
              <Text className="mt-1 text-foreground">{matter.description}</Text>
            </View>
          ) : null}

          <View className="rounded-lg border border-border bg-card p-4">
            <Text className="text-muted-foreground text-xs">Created</Text>
            <Text className="mt-1 text-foreground">
              {new Date(matter.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
