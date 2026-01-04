import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  FileText,
} from "lucide-react-native";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNetworkStatus } from "@/hooks/use-network";
import { portalClient, unwrapOrpc } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";

type PortalDashboardData = {
  activeMatters: number;
  totalDocuments: number;
  upcomingAppointments: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    date: string;
  }>;
};

/**
 * Client portal dashboard - overview of client's matters and documents.
 */
export default function ClientDashboardScreen() {
  const { portalUser } = useAuth();
  const { isOnline } = useNetworkStatus();

  // Fetch portal dashboard data
  const {
    data: dashboardRaw,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["portal", "dashboard"],
    queryFn: () => portalClient.portal.dashboard.get({}),
  });

  const dashboard = unwrapOrpc<PortalDashboardData>(dashboardRaw) ?? {
    activeMatters: 0,
    totalDocuments: 0,
    upcomingAppointments: 0,
    recentActivity: [],
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
          <Text className="text-muted-foreground">Welcome back,</Text>
          <Text className="font-bold text-2xl text-foreground">
            {portalUser?.firstName ?? "Client"}
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
            color="#8b5cf6"
            icon={Briefcase}
            title="Active Matters"
            value={dashboard.activeMatters}
          />
          <StatCard
            color="#3b82f6"
            icon={FileText}
            title="Documents"
            value={dashboard.totalDocuments}
          />
        </View>

        <View className="mb-6">
          <StatCard
            color="#10b981"
            icon={Calendar}
            title="Upcoming Appointments"
            value={dashboard.upcomingAppointments}
          />
        </View>

        {/* Recent Activity */}
        <View>
          <Text className="mb-3 font-semibold text-foreground text-lg">
            Recent Activity
          </Text>
          {dashboard.recentActivity.length > 0 ? (
            <View className="gap-2">
              {dashboard.recentActivity.map((activity) => (
                <View
                  className="rounded-lg border border-border bg-card p-4"
                  key={activity.id}
                >
                  <Text className="text-foreground">
                    {activity.description}
                  </Text>
                  <Text className="mt-1 text-muted-foreground text-sm">
                    {new Date(activity.date).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View className="items-center rounded-lg border border-border bg-card p-8">
              <Text className="text-muted-foreground">No recent activity</Text>
            </View>
          )}
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
