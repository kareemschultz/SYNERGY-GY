import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/app/analytics/")({
  component: AnalyticsPage,
});

// Color palette for charts
const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#6366f1",
  "#84cc16",
];

const MATTER_STATUS_COLORS: Record<string, string> = {
  NEW: "#3b82f6",
  IN_PROGRESS: "#8b5cf6",
  PENDING_CLIENT: "#f59e0b",
  SUBMITTED: "#06b6d4",
  COMPLETE: "#10b981",
  CANCELLED: "#ef4444",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GY", {
    style: "currency",
    currency: "GYD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Analytics dashboard aggregates KPIs, monthly trends, matter distribution, and revenue charts from multiple data sources
function AnalyticsPage() {
  const queryClient = useQueryClient();

  // Fetch KPIs
  const {
    data: kpis,
    isLoading: kpisLoading,
    isError: kpisError,
    error: kpisErrorDetails,
  } = useQuery({
    queryKey: ["analytics", "getKPIs"],
    queryFn: () => client.analytics.getKPIs(),
  });

  // Fetch monthly trends
  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ["analytics", "getMonthlyTrends", 12],
    queryFn: () => client.analytics.getMonthlyTrends({ months: 12 }),
  });

  // Fetch matters by status
  const { data: mattersByStatus, isLoading: mattersLoading } = useQuery({
    queryKey: ["dashboard", "getMattersByStatus"],
    queryFn: () => client.dashboard.getMattersByStatus(),
  });

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  // Fetch matters by business
  const { data: mattersByBusiness } = useQuery({
    queryKey: ["dashboard", "getMattersByBusiness"],
    queryFn: () => client.dashboard.getMattersByBusiness(),
  });

  // Fetch deadline distribution
  const { data: deadlineDistribution } = useQuery({
    queryKey: ["analytics", "getDeadlineDistribution"],
    queryFn: () => client.analytics.getDeadlineDistribution(),
  });

  // Fetch client type distribution
  const { data: clientTypes } = useQuery({
    queryKey: ["analytics", "getClientTypeDistribution"],
    queryFn: () => client.analytics.getClientTypeDistribution(),
  });

  // Fetch revenue by business
  const { data: revenueByBusiness } = useQuery({
    queryKey: ["analytics", "getRevenueByBusiness"],
    queryFn: () => client.analytics.getRevenueByBusiness(),
  });

  // Fetch staff workload
  const { data: staffWorkload } = useQuery({
    queryKey: ["analytics", "getStaffWorkload"],
    queryFn: () => client.analytics.getStaffWorkload(),
  });

  // Transform matters by status for pie chart
  const matterStatusData = mattersByStatus
    ? Object.entries(mattersByStatus).map(([status, count]) => ({
        name: status.replace(/_/g, " "),
        value: count,
        fill: MATTER_STATUS_COLORS[status] || "#6b7280",
      }))
    : [];

  // Transform matters by business for pie chart
  const businessData = mattersByBusiness
    ? Object.entries(mattersByBusiness).map(([business, count]) => ({
        name: business,
        value: count,
        fill: business === "GCMC" ? "#3b82f6" : "#10b981",
      }))
    : [];

  if (kpisLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (kpisError) {
    return (
      <div className="flex flex-col">
        <PageHeader
          breadcrumbs={[
            { label: "Dashboard", href: "/app" },
            { label: "Analytics" },
          ]}
          description="Business performance insights and visualizations"
          title="Analytics Dashboard"
        />
        <div className="p-6">
          <ErrorState
            action={{ label: "Try Again", onClick: handleRetry }}
            message={
              kpisErrorDetails instanceof Error
                ? kpisErrorDetails.message
                : "Failed to load analytics data. Please try again."
            }
            title="Could not load analytics"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/app/reports">
                <FileText className="mr-2 h-4 w-4" />
                Reports
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/app/analytics/audit">
                <BarChart3 className="mr-2 h-4 w-4" />
                Audit Trail
              </Link>
            </Button>
          </div>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Analytics" },
        ]}
        description="Business performance insights and visualizations"
        title="Analytics Dashboard"
      />

      <div className="space-y-6 p-6">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Total Clients
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{kpis?.clients.total}</div>
              <div className="flex items-center text-muted-foreground text-xs">
                {kpis?.clients.growth !== undefined &&
                kpis.clients.growth >= 0 ? (
                  <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDown className="mr-1 h-3 w-3 text-red-500" />
                )}
                <span
                  className={
                    (kpis?.clients.growth ?? 0) >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  {Math.abs(kpis?.clients.growth ?? 0)}%
                </span>
                <span className="ml-1">from last month</span>
              </div>
              <p className="mt-1 text-muted-foreground text-xs">
                +{kpis?.clients.newThisMonth} new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Active Matters
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{kpis?.matters.total}</div>
              <p className="text-muted-foreground text-xs">
                {kpis?.matters.completedThisMonth} completed this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Deadline Completion
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {kpis?.deadlines.completionRate}%
              </div>
              <p className="text-muted-foreground text-xs">
                {kpis?.deadlines.overdue} overdue deadlines
              </p>
              {(kpis?.deadlines.overdue ?? 0) > 0 && (
                <Badge className="mt-1" variant="destructive">
                  Action Required
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Revenue (YTD)
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {formatCurrency(kpis?.revenue.ytd ?? 0)}
              </div>
              <div className="flex items-center text-muted-foreground text-xs">
                {(kpis?.revenue.growth ?? 0) >= 0 ? (
                  <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDown className="mr-1 h-3 w-3 text-red-500" />
                )}
                <span
                  className={
                    (kpis?.revenue.growth ?? 0) >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  {Math.abs(kpis?.revenue.growth ?? 0)}%
                </span>
                <span className="ml-1">from last month</span>
              </div>
              <p className="mt-1 text-muted-foreground text-xs">
                {formatCurrency(kpis?.revenue.thisMonth ?? 0)} this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="matters">Matters</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
          </TabsList>

          <TabsContent className="space-y-6" value="overview">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Revenue Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Revenue Trend (12 Months)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {trendsLoading ? (
                    <div className="flex h-[300px] items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    <ResponsiveContainer height={300} width="100%">
                      <AreaChart data={trends}>
                        <defs>
                          <linearGradient
                            id="colorRevenue"
                            x1="0"
                            x2="0"
                            y1="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#3b82f6"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#3b82f6"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" fontSize={12} />
                        <YAxis
                          fontSize={12}
                          tickFormatter={(value) =>
                            formatCurrency(value).replace("GYD", "")
                          }
                        />
                        <Tooltip
                          formatter={(value) => [
                            formatCurrency(value as number),
                            "Revenue",
                          ]}
                        />
                        <Area
                          dataKey="revenue"
                          fill="url(#colorRevenue)"
                          fillOpacity={1}
                          stroke="#3b82f6"
                          type="monotone"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Client & Matter Growth */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Client & Matter Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {trendsLoading ? (
                    <div className="flex h-[300px] items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    <ResponsiveContainer height={300} width="100%">
                      <BarChart data={trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="clients"
                          fill="#3b82f6"
                          name="New Clients"
                        />
                        <Bar
                          dataKey="matters"
                          fill="#10b981"
                          name="New Matters"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Deadline Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Deadline Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer height={300} width="100%">
                    <PieChart>
                      <Pie
                        cx="50%"
                        cy="50%"
                        data={deadlineDistribution}
                        dataKey="value"
                        innerRadius={60}
                        label={({ name, percent }) =>
                          `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                        }
                        labelLine={false}
                        outerRadius={100}
                      >
                        {deadlineDistribution?.map((entry) => (
                          <Cell fill={entry.fill} key={`cell-${entry.name}`} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Business Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Matters by Business
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer height={300} width="100%">
                    <PieChart>
                      <Pie
                        cx="50%"
                        cy="50%"
                        data={businessData}
                        dataKey="value"
                        innerRadius={60}
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                        outerRadius={100}
                      >
                        {businessData.map((entry) => (
                          <Cell fill={entry.fill} key={`cell-${entry.name}`} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent className="space-y-6" value="clients">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Client Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Client Type Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer height={350} width="100%">
                    <PieChart>
                      <Pie
                        cx="50%"
                        cy="50%"
                        data={clientTypes}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                        }
                        labelLine
                        outerRadius={120}
                      >
                        {clientTypes?.map((entry) => (
                          <Cell
                            fill={
                              COLORS[clientTypes.indexOf(entry) % COLORS.length]
                            }
                            key={`cell-${entry.name}`}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Client Growth Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Client Growth (12 Months)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer height={350} width="100%">
                    <AreaChart data={trends}>
                      <defs>
                        <linearGradient
                          id="colorClients"
                          x1="0"
                          x2="0"
                          y1="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#8b5cf6"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#8b5cf6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Area
                        dataKey="clients"
                        fill="url(#colorClients)"
                        fillOpacity={1}
                        name="New Clients"
                        stroke="#8b5cf6"
                        type="monotone"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent className="space-y-6" value="matters">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Matter Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Matter Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {mattersLoading ? (
                    <div className="flex h-[350px] items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    <ResponsiveContainer height={350} width="100%">
                      <PieChart>
                        <Pie
                          cx="50%"
                          cy="50%"
                          data={matterStatusData}
                          dataKey="value"
                          innerRadius={60}
                          label={({ name, value }) => `${name}: ${value}`}
                          labelLine
                          outerRadius={120}
                        >
                          {matterStatusData.map((entry) => (
                            <Cell
                              fill={entry.fill}
                              key={`cell-${entry.name}`}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Matter Volume Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Matter Volume (12 Months)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer height={350} width="100%">
                    <BarChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="matters" fill="#10b981" name="New Matters">
                        {trends?.map((trend) => (
                          <Cell
                            fill={COLORS[trends.indexOf(trend) % COLORS.length]}
                            key={`cell-${trend.month}`}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent className="space-y-6" value="revenue">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Revenue by Business */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Business</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer height={350} width="100%">
                    <PieChart>
                      <Pie
                        cx="50%"
                        cy="50%"
                        data={revenueByBusiness}
                        dataKey="value"
                        innerRadius={60}
                        label={({ name, value }) =>
                          `${name}: ${formatCurrency(value)}`
                        }
                        labelLine
                        outerRadius={120}
                      >
                        {revenueByBusiness?.map((entry) => (
                          <Cell
                            fill={entry.name === "GCMC" ? "#3b82f6" : "#10b981"}
                            key={`cell-${entry.name}`}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(value as number)}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Revenue Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer height={350} width="100%">
                    <BarChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis
                        fontSize={12}
                        tickFormatter={(value) =>
                          formatCurrency(value).replace("GYD", "")
                        }
                      />
                      <Tooltip
                        formatter={(value) => [
                          formatCurrency(value as number),
                          "Revenue",
                        ]}
                      />
                      <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent className="space-y-6" value="staff">
            {/* Staff Workload */}
            <Card>
              <CardHeader>
                <CardTitle>Staff Workload Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {staffWorkload !== undefined && staffWorkload.length > 0 ? (
                  <ResponsiveContainer height={400} width="100%">
                    <BarChart data={staffWorkload} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis fontSize={12} type="number" />
                      <YAxis
                        dataKey="name"
                        fontSize={12}
                        type="category"
                        width={150}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="activeMatters"
                        fill="#3b82f6"
                        name="Active Matters"
                        stackId="a"
                      />
                      <Bar
                        dataKey="pendingDeadlines"
                        fill="#f59e0b"
                        name="Pending Deadlines"
                        stackId="a"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                    No staff workload data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
