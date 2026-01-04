import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Briefcase, ChevronRight, Plus, Search } from "lucide-react-native";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { staffClient, unwrapOrpc } from "@/lib/api";

type Matter = {
  id: string;
  referenceNumber: string;
  title: string;
  status: string;
  priority: string;
  clientName: string;
};

type MattersResponse = {
  matters: Matter[];
  total: number;
};

/**
 * Staff matters list screen.
 */
export default function MattersScreen() {
  const [search, setSearch] = useState("");

  const {
    data: mattersRaw,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["matters", "list", search],
    queryFn: () =>
      staffClient.matters.list({
        search: search || undefined,
        limit: 50,
      }),
  });

  const data = unwrapOrpc<MattersResponse>(mattersRaw);
  const matters = data?.matters ?? [];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "bg-blue-500/20 text-blue-400";
      case "in_progress":
        return "bg-yellow-500/20 text-yellow-400";
      case "completed":
        return "bg-green-500/20 text-green-400";
      case "cancelled":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const renderMatter = ({ item }: { item: Matter }) => (
    <Pressable
      className="border-border border-b bg-card p-4 active:bg-secondary"
      onPress={() => router.push(`/(staff)/matters/${item.id}`)}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-muted-foreground text-xs">
            {item.referenceNumber}
          </Text>
          <Text className="mt-1 font-medium text-foreground">{item.title}</Text>
          <Text className="text-muted-foreground text-sm">
            {item.clientName}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View
            className={`rounded-full px-2 py-1 ${getStatusColor(item.status)}`}
          >
            <Text className="text-xs capitalize">
              {item.status.replace("_", " ")}
            </Text>
          </View>
          <ChevronRight color="#71717a" size={20} />
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <Text className="font-bold text-2xl text-foreground">Matters</Text>
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-primary">
          <Plus color="#0c0c0c" size={20} />
        </Pressable>
      </View>

      {/* Search */}
      <View className="px-4 pb-2">
        <View className="flex-row items-center gap-2 rounded-lg border border-border bg-card px-3">
          <Search color="#71717a" size={18} />
          <TextInput
            className="flex-1 py-3 text-foreground"
            onChangeText={setSearch}
            placeholder="Search matters..."
            placeholderTextColor="#71717a"
            value={search}
          />
        </View>
      </View>

      {/* List */}
      <FlatList
        contentContainerStyle={{ flexGrow: 1 }}
        data={matters}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-8">
            <Briefcase color="#71717a" size={48} />
            <Text className="mt-4 text-muted-foreground">No matters found</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            onRefresh={refetch}
            refreshing={isRefetching}
            tintColor="#ffffff"
          />
        }
        renderItem={renderMatter}
      />
    </SafeAreaView>
  );
}
