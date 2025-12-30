import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  Bell,
  Calendar,
  Clock,
  FileText,
  FolderOpen,
  Loader2,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { client } from "@/utils/orpc";
import { unwrapOrpc } from "@/utils/orpc-response";

export const Route = createFileRoute("/app/")({
  component: DashboardPage,
});

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Auto-fix
function DashboardPage() {
  const { data: statsRaw, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => client.dashboard.getStats(),
  });

  const { data: mattersByStatusRaw } = useQuery({
    queryKey: ["mattersByStatus"],
    queryFn: () => client.dashboard.getMattersByStatus(),
  });

  const { data: recentMattersRaw } = useQuery({
    queryKey: ["recentMatters"],
    queryFn: () => client.dashboard.getRecentMatters({ limit: 5 }),
  });

  const { data: upcomingDeadlinesRaw } = useQuery({
    queryKey: ["dashboardUpcomingDeadlines"],
    queryFn: () => client.dashboard.getUpcomingDeadlines({ limit: 5 }),
  });

  // KPI analytics for revenue and growth metrics
  const { data: kpisRaw, isLoading: kpisLoading } = useQuery({
    queryKey: ["dashboardKpis"],
    queryFn: () => client.analytics.getKPIs(),
  });

  // Today's appointments
  const { data: todayAppointmentsRaw, isLoading: appointmentsLoading } =
    useQuery({
      queryKey: ["dashboardTodayAppointments"],
      queryFn: () => client.appointments.getToday(),
    });

  // Unread notifications count
  const { data: unreadCountRaw } = useQuery({
    queryKey: ["dashboardUnreadNotifications"],
    queryFn: () => client.notifications.getUnreadCount(),
  });

  // Type definitions for dashboard data
  type DashboardDeadline = {
    id: string;
    title: string;
    dueDate: string;
    priority: string;
    client?: { displayName: string } | null;
  };

  type DashboardMatter = {
    id: string;
    title: string;
    referenceNumber: string;
    status: string;
    client?: { displayName: string } | null;
  };

  type KPIsData = {
    clients: { total: number; newThisMonth: number; growth: number };
    matters: { total: number; completedThisMonth: number };
    deadlines: { overdue: number; completionRate: number };
    revenue: {
      thisMonth: number;
      lastMonth: number;
      ytd: number;
      growth: number;
    };
  };

  // Unwrap oRPC response envelopes
  const stats = unwrapOrpc<{
    activeClients: number;
    openMatters: number;
    upcomingDeadlines: number;
    overdueDeadlines: number;
    totalDocuments: number;
  }>(statsRaw);
  const mattersByStatus =
    unwrapOrpc<Record<string, number>>(mattersByStatusRaw);
  const recentMatters = unwrapOrpc<DashboardMatter[]>(recentMattersRaw);
  const upcomingDeadlines =
    unwrapOrpc<DashboardDeadline[]>(upcomingDeadlinesRaw);
  const kpis = unwrapOrpc<KPIsData>(kpisRaw);
  const todayAppointments =
    unwrapOrpc<TodayAppointment[]>(todayAppointmentsRaw);
  const unreadCount = unwrapOrpc<number>(unreadCountRaw) || 0;

  return (
    <div className="flex flex-col">
      <PageHeader
        description="Overview of your business operations"
        title="Dashboard"
      />

      <div className="p-6">
        {/* Quick Actions Bar */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link to="/app/clients/new">
            <Button size="sm" variant="outline">
              <Plus className="mr-1 h-4 w-4" />
              New Client
            </Button>
          </Link>
          <Link to="/app/matters/new">
            <Button size="sm" variant="outline">
              <Plus className="mr-1 h-4 w-4" />
              New Matter
            </Button>
          </Link>
          <Link to="/app/calendar">
            <Button size="sm" variant="outline">
              <Calendar className="mr-1 h-4 w-4" />
              Schedule
            </Button>
          </Link>
          <Link className="ml-auto" to="/app/notifications">
            <Button className="relative" size="sm" variant="outline">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 ? (
                <span className="-right-1 -top-1 absolute flex h-4 w-4 items-center justify-center rounded-full bg-red-500 font-bold text-[10px] text-white">
                  {unreadCount > 9 ? "9+" : String(unreadCount)}
                </span>
              ) : null}
            </Button>
          </Link>
        </div>

        {/* Revenue KPIs */}
        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <RevenueCard
            growth={kpis?.revenue.growth}
            isLoading={kpisLoading}
            subtitle="This month"
            title="Revenue"
            value={kpis?.revenue.thisMonth || 0}
          />
          <RevenueCard
            isLoading={kpisLoading}
            subtitle="Year to date"
            title="YTD Revenue"
            value={kpis?.revenue.ytd || 0}
          />
          <KpiCard
            growth={kpis?.clients.growth}
            isLoading={kpisLoading}
            subtitle="New this month"
            title="Client Growth"
            value={kpis?.clients.newThisMonth || 0}
          />
          <KpiCard
            isLoading={kpisLoading}
            subtitle="Completion rate"
            suffix="%"
            title="Deadlines"
            value={kpis?.deadlines.completionRate || 0}
          />
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            description="Across both businesses"
            icon={Users}
            isLoading={statsLoading}
            title="Active Clients"
            value={stats?.activeClients || 0}
          />
          <StatsCard
            description="In progress"
            icon={FolderOpen}
            isLoading={statsLoading}
            title="Open Matters"
            value={stats?.openMatters || 0}
          />
          <StatsCard
            description="Next 7 days"
            icon={Calendar}
            isLoading={statsLoading}
            title="Upcoming Deadlines"
            value={stats?.upcomingDeadlines || 0}
          />
          <StatsCard
            description="Requires attention"
            icon={AlertCircle}
            iconClassName="text-red-500"
            isLoading={statsLoading}
            title="Overdue"
            value={stats?.overdueDeadlines || 0}
            valueClassName={
              // biome-ignore lint/nursery/noLeakedRender: Auto-fix
              (stats?.overdueDeadlines || 0) > 0 ? "text-red-600" : undefined
            }
          />
          <StatsCard
            description="Total uploaded"
            icon={FileText}
            isLoading={statsLoading}
            title="Documents"
            value={stats?.totalDocuments || 0}
          />
        </div>

        {/* Matters by Status */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
                Matters by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-6">
                <StatusCard
                  color="bg-blue-500"
                  count={mattersByStatus?.NEW || 0}
                  label="New"
                />
                <StatusCard
                  color="bg-yellow-500"
                  count={mattersByStatus?.IN_PROGRESS || 0}
                  label="In Progress"
                />
                <StatusCard
                  color="bg-orange-500"
                  count={mattersByStatus?.PENDING_CLIENT || 0}
                  label="Pending Client"
                />
                <StatusCard
                  color="bg-purple-500"
                  count={mattersByStatus?.SUBMITTED || 0}
                  label="Submitted"
                />
                <StatusCard
                  color="bg-green-500"
                  count={mattersByStatus?.COMPLETE || 0}
                  label="Complete"
                />
                <StatusCard
                  color="bg-gray-500"
                  count={mattersByStatus?.CANCELLED || 0}
                  label="Cancelled"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Appointments */}
        <div className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                Today's Appointments
                {!!todayAppointments && todayAppointments.length > 0 && (
                  <Badge variant="secondary">{todayAppointments.length}</Badge>
                )}
              </CardTitle>
              <Link
                className="text-primary text-sm hover:underline"
                to="/app/calendar"
              >
                View calendar
              </Link>
            </CardHeader>
            <CardContent>
              <TodayAppointmentsContent
                appointments={todayAppointments}
                isLoading={appointmentsLoading}
              />
            </CardContent>
          </Card>
        </div>

        {/* Deadlines & Recent Matters */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Upcoming Deadlines
              </CardTitle>
              <Link
                className="text-primary text-sm hover:underline"
                to="/app/calendar"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {!!upcomingDeadlines && upcomingDeadlines.length > 0 ? (
                <div className="space-y-3">
                  {upcomingDeadlines.map((d) => (
                    <div
                      className="flex items-center justify-between rounded-lg border p-3"
                      key={d.id}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">
                          {d.title}
                        </p>
                        {!!d.client && (
                          <p className="truncate text-muted-foreground text-xs">
                            {d.client.displayName}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge
                          className={getPriorityClass(d.priority)}
                          variant="outline"
                        >
                          {d.priority}
                        </Badge>
                        <p className="mt-1 text-muted-foreground text-xs">
                          {new Date(d.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  No upcoming deadlines
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Matters */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                Recent Matters
              </CardTitle>
              <Link
                className="text-primary text-sm hover:underline"
                to="/app/matters"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {!!recentMatters && recentMatters.length > 0 ? (
                <div className="space-y-3">
                  {recentMatters.map((m) => (
                    <Link
                      className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
                      key={m.id}
                      params={{ matterId: m.id }}
                      to="/app/matters/$matterId"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-sm">
                            {m.title}
                          </p>
                          <p className="truncate text-muted-foreground text-xs">
                            {m.referenceNumber} · {m.client?.displayName}
                          </p>
                        </div>
                        <Badge
                          className={getStatusClass(m.status)}
                          variant="outline"
                        >
                          {formatStatus(m.status)}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  No recent matters
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

type StatsCardProps = {
  title: string;
  value: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isLoading?: boolean;
  valueClassName?: string;
  iconClassName?: string;
};

function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  isLoading,
  valueClassName,
  iconClassName,
}: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-medium text-sm">{title}</CardTitle>
        <Icon
          className={`h-4 w-4 ${iconClassName || "text-muted-foreground"}`}
        />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className={`font-bold text-2xl ${valueClassName || ""}`}>
              {value}
            </div>
            <p className="text-muted-foreground text-xs">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

type StatusCardProps = {
  label: string;
  count: number;
  color: string;
};

function StatusCard({ label, count, color }: StatusCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className={`h-3 w-3 rounded-full ${color}`} />
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="font-bold text-2xl">{count}</p>
      </div>
    </div>
  );
}

// Helper to avoid nested ternary in appointments section
type TodayAppointmentsContentProps = {
  appointments: TodayAppointment[] | undefined;
  isLoading: boolean;
};

type TodayAppointment = {
  id: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  locationType: string;
  location?: string | null;
  status: string;
  client?: { id: string; displayName: string; phone?: string | null } | null;
  assignedStaff?: { user?: { name: string } | null } | null;
};

function TodayAppointmentsContent({
  appointments,
  isLoading,
}: TodayAppointmentsContentProps) {
  if (isLoading) {
    return (
      <div className="flex h-24 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (appointments && appointments.length > 0) {
    return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {appointments.slice(0, 6).map((apt) => (
          <AppointmentCard appointment={apt} key={apt.id} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-24 items-center justify-center text-muted-foreground">
      No appointments scheduled for today
    </div>
  );
}

function getPriorityClass(priority: string): string {
  const classes: Record<string, string> = {
    LOW: "bg-gray-500/10 text-gray-600 border-gray-200",
    NORMAL: "bg-blue-500/10 text-blue-600 border-blue-200",
    HIGH: "bg-orange-500/10 text-orange-600 border-orange-200",
    URGENT: "bg-red-500/10 text-red-600 border-red-200",
  };
  return classes[priority] || classes.NORMAL;
}

function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    NEW: "bg-blue-500/10 text-blue-600 border-blue-200",
    IN_PROGRESS: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    PENDING_CLIENT: "bg-orange-500/10 text-orange-600 border-orange-200",
    SUBMITTED: "bg-purple-500/10 text-purple-600 border-purple-200",
    COMPLETE: "bg-green-500/10 text-green-600 border-green-200",
    CANCELLED: "bg-gray-500/10 text-gray-600 border-gray-200",
  };
  return classes[status] || classes.NEW;
}

function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    NEW: "New",
    IN_PROGRESS: "In Progress",
    PENDING_CLIENT: "Pending",
    SUBMITTED: "Submitted",
    COMPLETE: "Complete",
    CANCELLED: "Cancelled",
  };
  return labels[status] || status;
}

// Revenue card with currency formatting and growth indicator
type RevenueCardProps = {
  title: string;
  value: number;
  subtitle: string;
  growth?: number;
  isLoading?: boolean;
};

function RevenueCard({
  title,
  value,
  subtitle,
  growth,
  isLoading,
}: RevenueCardProps) {
  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-medium text-sm">{title}</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className="font-bold text-2xl">{formatCurrency(value)}</div>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground text-xs">{subtitle}</p>
              {growth !== undefined && (
                <span
                  className={`flex items-center text-xs ${growth >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {growth >= 0 ? "+" : ""}
                  {growth.toFixed(1)}%
                </span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// KPI card for numeric metrics with optional suffix
type KpiCardProps = {
  title: string;
  value: number;
  subtitle: string;
  suffix?: string;
  growth?: number;
  isLoading?: boolean;
};

function KpiCard({
  title,
  value,
  subtitle,
  suffix,
  growth,
  isLoading,
}: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-medium text-sm">{title}</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className="font-bold text-2xl">
              {value}
              {suffix}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground text-xs">{subtitle}</p>
              {growth !== undefined && (
                <span
                  className={`flex items-center text-xs ${growth >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {growth >= 0 ? "+" : ""}
                  {growth.toFixed(1)}%
                </span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Appointment card for today's appointments widget
type AppointmentCardProps = {
  appointment: {
    id: string;
    title: string;
    scheduledAt: string;
    durationMinutes: number;
    locationType: string;
    location?: string | null;
    status: string;
    client?: { id: string; displayName: string; phone?: string | null } | null;
    assignedStaff?: { user?: { name: string } | null } | null;
  };
};

function AppointmentCard({ appointment }: AppointmentCardProps) {
  const time = new Date(appointment.scheduledAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const getLocationLabel = (type: string): string => {
    const labels: Record<string, string> = {
      IN_PERSON: "In-Person",
      VIDEO_CALL: "Video Call",
      PHONE_CALL: "Phone Call",
    };
    return labels[type] || type;
  };

  const getStatusBadgeClass = (status: string): string => {
    const classes: Record<string, string> = {
      SCHEDULED: "bg-blue-500/10 text-blue-600 border-blue-200",
      CONFIRMED: "bg-green-500/10 text-green-600 border-green-200",
      IN_PROGRESS: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
      COMPLETED: "bg-gray-500/10 text-gray-600 border-gray-200",
      CANCELLED: "bg-red-500/10 text-red-600 border-red-200",
    };
    return classes[status] || classes.SCHEDULED;
  };

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-sm">{appointment.title}</p>
          {!!appointment.client && (
            <p className="truncate text-muted-foreground text-xs">
              {appointment.client.displayName}
            </p>
          )}
        </div>
        <Badge
          className={getStatusBadgeClass(appointment.status)}
          variant="outline"
        >
          {appointment.status}
        </Badge>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {time} ({appointment.durationMinutes}m)
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {getLocationLabel(appointment.locationType)}
        </span>
        {!!appointment.assignedStaff?.user && (
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {appointment.assignedStaff.user.name}
          </span>
        )}
      </div>
    </div>
  );
}
