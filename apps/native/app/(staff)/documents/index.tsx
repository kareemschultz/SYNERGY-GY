import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Camera, FileText, Plus } from "lucide-react-native";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { staffClient, unwrapOrpc } from "@/lib/api";

type Document = {
  id: string;
  name: string;
  category: string;
  clientName: string;
  createdAt: string;
};

type DocumentsResponse = {
  documents: Document[];
  total: number;
};

/**
 * Staff documents list screen.
 */
export default function DocumentsScreen() {
  const {
    data: docsRaw,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["documents", "list"],
    queryFn: () => staffClient.documents.list({ limit: 50 }),
  });

  const data = unwrapOrpc<DocumentsResponse>(docsRaw);
  const documents = data?.documents ?? [];

  const renderDocument = ({ item }: { item: Document }) => (
    <Pressable className="flex-row items-center gap-3 border-border border-b bg-card p-4 active:bg-secondary">
      <View className="h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
        <FileText color="#3b82f6" size={20} />
      </View>
      <View className="flex-1">
        <Text className="font-medium text-foreground">{item.name}</Text>
        <Text className="text-muted-foreground text-sm">
          {item.clientName} - {item.category}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <Text className="font-bold text-2xl text-foreground">Documents</Text>
        <View className="flex-row gap-2">
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full bg-secondary"
            onPress={() => router.push("/(staff)/documents/scan")}
          >
            <Camera color="#ffffff" size={20} />
          </Pressable>
          <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-primary">
            <Plus color="#0c0c0c" size={20} />
          </Pressable>
        </View>
      </View>

      {/* List */}
      <FlatList
        contentContainerStyle={{ flexGrow: 1 }}
        data={documents}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-8">
            <FileText color="#71717a" size={48} />
            <Text className="mt-4 text-muted-foreground">
              No documents found
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
        renderItem={renderDocument}
      />
    </SafeAreaView>
  );
}
