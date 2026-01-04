import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Plus } from "lucide-react-native";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { staffClient, unwrapOrpc } from "@/lib/api";

type Appointment = {
  id: string;
  title: string;
  clientName: string;
  startTime: string;
  endTime: string;
  status: string;
};

type AppointmentsResponse = {
  appointments: Appointment[];
  total: number;
};

/**
 * Staff calendar/appointments screen.
 */
export default function AppointmentsScreen() {
  const {
    data: apptRaw,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["appointments", "list"],
    queryFn: () =>
      staffClient.appointments.list({
        startDate: new Date().toISOString(),
        limit: 50,
      }),
  });

  const data = unwrapOrpc<AppointmentsResponse>(apptRaw);
  const appointments = data?.appointments ?? [];

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const renderAppointment = ({ item }: { item: Appointment }) => (
    <View className="border-border border-b bg-card p-4">
      <View className="flex-row items-start gap-4">
        <View className="items-center">
          <Text className="font-bold text-foreground">
            {formatDate(item.startTime).split(" ")[2]}
          </Text>
          <Text className="text-muted-foreground text-xs">
            {formatDate(item.startTime).split(" ")[1]}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="font-medium text-foreground">{item.title}</Text>
          <Text className="text-muted-foreground text-sm">
            {item.clientName}
          </Text>
          <View className="mt-2 flex-row items-center gap-1">
            <Clock color="#71717a" size={14} />
            <Text className="text-muted-foreground text-xs">
              {formatTime(item.startTime)} - {formatTime(item.endTime)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <Text className="font-bold text-2xl text-foreground">Calendar</Text>
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-primary">
          <Plus color="#0c0c0c" size={20} />
        </Pressable>
      </View>

      {/* List */}
      <FlatList
        contentContainerStyle={{ flexGrow: 1 }}
        data={appointments}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-8">
            <Calendar color="#71717a" size={48} />
            <Text className="mt-4 text-muted-foreground">
              No upcoming appointments
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
        renderItem={renderAppointment}
      />
    </SafeAreaView>
  );
}
