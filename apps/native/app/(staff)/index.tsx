import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  Clock,
  Users,
} from "lucide-react-native";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNetworkStatus } from "@/hooks/use-network";
import { staffClient, unwrapOrpc } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";

type DashboardStats = {
  totalClients: number;
  activeMatters: number;
  todayAppointments: number;
  pendingTasks: number;
};

/**
 * Staff dashboard - overview of key metrics and recent activity.
 */
export default function StaffDashboardScreen() {
  const { staffUser } = useAuth();
  const { isOnline } = useNetworkStatus();

  // Fetch dashboard stats
  const {
    data: statsRaw,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => staffClient.dashboard.getStats({}),
  });

  const stats = unwrapOrpc<DashboardStats>(statsRaw) ?? {
    totalClients: 0,
    activeMatters: 0,
    todayAppointments: 0,
    pendingTasks: 0,
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            onRefresh={refetch}
            refreshing={isRefetching}
            tintColor="#ffffff"
          />
        }
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-muted-foreground">Good {getTimeOfDay()}, </Text>
          <Text className="font-bold text-2xl text-foreground">
            {staffUser?.name ?? "Staff"}
          </Text>
          {!isOnline && (
            <View className="mt-2 flex-row items-center gap-2">
              <AlertCircle color="#f59e0b" size={14} />
              <Text className="text-sm text-warning">
                Offline - using cached data
              </Text>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View className="mb-6 flex-row gap-3">
          <StatCard
            color="#3b82f6"
            icon={Users}
            title="Clients"
            value={stats.totalClients}
          />
          <StatCard
            color="#8b5cf6"
            icon={Briefcase}
            title="Active Matters"
            value={stats.activeMatters}
          />
        </View>

        <View className="mb-6 flex-row gap-3">
          <StatCard
            color="#10b981"
            icon={Calendar}
            title="Today's Appts"
            value={stats.todayAppointments}
          />
          <StatCard
            color="#f59e0b"
            icon={Clock}
            title="Pending Tasks"
            value={stats.pendingTasks}
          />
        </View>

        {/* Quick Actions */}
        <View className="mb-4">
          <Text className="mb-3 font-semibold text-foreground text-lg">
            Quick Actions
          </Text>
          <View className="gap-2">
            <QuickAction icon={Users} title="Add New Client" />
            <QuickAction icon={Briefcase} title="Create Matter" />
            <QuickAction icon={Calendar} title="Schedule Appointment" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <View className="flex-1 rounded-xl border border-border bg-card p-4">
      <View className="mb-3">
        <Icon color={color} size={20} />
      </View>
      <Text className="font-bold text-2xl text-foreground">{value}</Text>
      <Text className="mt-1 text-muted-foreground text-sm">{title}</Text>
    </View>
  );
}

function QuickAction({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-lg border border-border bg-card p-4">
      <Icon color="#71717a" size={20} />
      <Text className="flex-1 text-foreground">{title}</Text>
    </View>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "morning";
  }
  if (hour < 17) {
    return "afternoon";
  }
  return "evening";
}
