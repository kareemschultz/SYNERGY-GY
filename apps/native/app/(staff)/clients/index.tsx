import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ChevronRight, Plus, Search, Users } from "lucide-react-native";
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

type Client = {
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  clientType: string;
};

type ClientsResponse = {
  clients: Client[];
  total: number;
};

/**
 * Staff clients list screen.
 */
export default function ClientsScreen() {
  const [search, setSearch] = useState("");

  const {
    data: clientsRaw,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["clients", "list", search],
    queryFn: () =>
      staffClient.clients.list({
        search: search || undefined,
        limit: 50,
      }),
  });

  const data = unwrapOrpc<ClientsResponse>(clientsRaw);
  const clients = data?.clients ?? [];

  const renderClient = ({ item }: { item: Client }) => (
    <Pressable
      className="flex-row items-center gap-3 border-border border-b bg-card p-4 active:bg-secondary"
      onPress={() => router.push(`/(staff)/clients/${item.id}`)}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/20">
        <Text className="font-semibold text-primary">
          {item.displayName.charAt(0)}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="font-medium text-foreground">{item.displayName}</Text>
        <Text className="text-muted-foreground text-sm">
          {item.email ?? item.phone ?? "No contact info"}
        </Text>
      </View>
      <ChevronRight color="#71717a" size={20} />
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <Text className="font-bold text-2xl text-foreground">Clients</Text>
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
            placeholder="Search clients..."
            placeholderTextColor="#71717a"
            value={search}
          />
        </View>
      </View>

      {/* List */}
      <FlatList
        contentContainerStyle={{ flexGrow: 1 }}
        data={clients}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-8">
            <Users color="#71717a" size={48} />
            <Text className="mt-4 text-muted-foreground">No clients found</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            onRefresh={refetch}
            refreshing={isRefetching}
            tintColor="#ffffff"
          />
        }
        renderItem={renderClient}
      />
    </SafeAreaView>
  );
}
