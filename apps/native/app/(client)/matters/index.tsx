import { useQuery } from "@tanstack/react-query";
import { Briefcase, ChevronRight } from "lucide-react-native";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { portalClient, unwrapOrpc } from "@/lib/api";

type Matter = {
  id: string;
  referenceNumber: string;
  title: string;
  status: string;
  serviceType: string | null;
};

type MattersResponse = {
  matters: Matter[];
};

/**
 * Client portal - my matters screen.
 */
export default function ClientMattersScreen() {
  const {
    data: mattersRaw,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["portal", "matters"],
    queryFn: () => portalClient.portal.matters.list({}),
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
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const renderMatter = ({ item }: { item: Matter }) => (
    <Pressable className="border-border border-b bg-card p-4 active:bg-secondary">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-muted-foreground text-xs">
            {item.referenceNumber}
          </Text>
          <Text className="mt-1 font-medium text-foreground">{item.title}</Text>
          {item.serviceType ? (
            <Text className="text-muted-foreground text-sm">
              {item.serviceType}
            </Text>
          ) : null}
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
      <View className="px-4 py-2">
        <Text className="font-bold text-2xl text-foreground">My Matters</Text>
      </View>

      {/* List */}
      <FlatList
        contentContainerStyle={{ flexGrow: 1 }}
        data={matters}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-8">
            <Briefcase color="#71717a" size={48} />
            <Text className="mt-4 text-muted-foreground">No matters yet</Text>
            <Text className="mt-2 text-center text-muted-foreground text-sm">
              Your active matters will appear here
            </Text>
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
