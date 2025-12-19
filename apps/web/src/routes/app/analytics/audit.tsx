import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  Loader2,
  LogIn,
  LogOut,
  Plus,
  Search,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { useState } from "react";
import {
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/app/analytics/audit")({
  component: AuditTrailPage,
});

const ACTION_ICONS: Record<string, typeof Activity> = {
  CREATE: Plus,
  UPDATE: Edit,
  DELETE: Trash2,
  VIEW: Eye,
  LOGIN: LogIn,
  LOGOUT: LogOut,
  UPLOAD: Upload,
  DOWNLOAD: Download,
  STATUS_CHANGE: Activity,
  ASSIGN: User,
  COMPLETE: Activity,
  ARCHIVE: FileText,
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700 border-green-200",
  UPDATE: "bg-blue-100 text-blue-700 border-blue-200",
  DELETE: "bg-red-100 text-red-700 border-red-200",
  VIEW: "bg-gray-100 text-gray-700 border-gray-200",
  LOGIN: "bg-purple-100 text-purple-700 border-purple-200",
  LOGOUT: "bg-purple-100 text-purple-700 border-purple-200",
  UPLOAD: "bg-cyan-100 text-cyan-700 border-cyan-200",
  DOWNLOAD: "bg-cyan-100 text-cyan-700 border-cyan-200",
  STATUS_CHANGE: "bg-orange-100 text-orange-700 border-orange-200",
  ASSIGN: "bg-indigo-100 text-indigo-700 border-indigo-200",
  COMPLETE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ARCHIVE: "bg-slate-100 text-slate-700 border-slate-200",
};

const ENTITY_ICONS: Record<string, typeof FileText> = {
  CLIENT: User,
  MATTER: FileText,
  DOCUMENT: FileText,
  DEADLINE: Calendar,
  STAFF: User,
  SERVICE_TYPE: Activity,
  TEMPLATE: FileText,
  COMMUNICATION: Activity,
  NOTE: FileText,
  SESSION: LogIn,
  APPOINTMENT: Calendar,
  INVOICE: FileText,
};

const CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

function AuditTrailPage() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState<string>("all");
  const [action, setAction] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const limit = 25;

  // Fetch activity logs
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ["activity", "list", page, limit, entityType, action],
    queryFn: () =>
      client.activity.list({
        page,
        limit,
        entityType: entityType === "all" ? undefined : (entityType as "CLIENT"),
        action: action === "all" ? undefined : (action as "CREATE"),
      }),
  });

  // Fetch activity stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["activity", "getStats", 30],
    queryFn: () => client.activity.getStats({ days: 30 }),
  });

  // Transform stats for charts
  const actionChartData = stats?.byAction
    ? Object.entries(stats.byAction)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
    : [];

  const entityChartData = stats?.byEntity
    ? Object.entries(stats.byEntity)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
    : [];

  const logs = logsData?.logs || [];
  const totalPages = logsData?.totalPages || 1;

  return (
    <div className="flex flex-col">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Analytics", href: "/app/analytics" },
          { label: "Audit Trail" },
        ]}
        description="Track all system activities and changes"
        title="Audit Trail"
      >
        <Button asChild variant="outline">
          <Link to="/app/analytics">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Analytics
          </Link>
        </Button>
      </PageHeader>

      <div className="space-y-6 p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Total Activities
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  (stats?.total?.toLocaleString() ?? 0)
                )}
              </div>
              <p className="text-muted-foreground text-xs">{stats?.period}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">Creates</CardTitle>
              <Plus className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {stats?.byAction?.CREATE?.toLocaleString() ?? 0}
              </div>
              <p className="text-muted-foreground text-xs">New records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">Updates</CardTitle>
              <Edit className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {stats?.byAction?.UPDATE?.toLocaleString() ?? 0}
              </div>
              <p className="text-muted-foreground text-xs">Modifications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">Logins</CardTitle>
              <LogIn className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {stats?.byAction?.LOGIN?.toLocaleString() ?? 0}
              </div>
              <p className="text-muted-foreground text-xs">User sessions</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Activity by Action Type</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                if (statsLoading) {
                  return (
                    <div className="flex h-[250px] items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  );
                }
                if (actionChartData.length > 0) {
                  return (
                    <ResponsiveContainer height={250} width="100%">
                      <BarChart data={actionChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis fontSize={12} type="number" />
                        <YAxis
                          dataKey="name"
                          fontSize={12}
                          type="category"
                          width={100}
                        />
                        <Tooltip />
                        <Bar dataKey="value" name="Count">
                          {actionChartData.map((entry) => (
                            <Cell
                              fill={
                                CHART_COLORS[
                                  actionChartData.indexOf(entry) %
                                    CHART_COLORS.length
                                ]
                              }
                              key={`cell-${entry.name}`}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  );
                }
                return (
                  <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                    No activity data
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity by Entity Type</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                if (statsLoading) {
                  return (
                    <div className="flex h-[250px] items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  );
                }
                if (entityChartData.length > 0) {
                  return (
                    <ResponsiveContainer height={250} width="100%">
                      <PieChart>
                        <Pie
                          cx="50%"
                          cy="50%"
                          data={entityChartData}
                          dataKey="value"
                          innerRadius={50}
                          label={({ name, percent }) =>
                            `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                          }
                          labelLine={false}
                          outerRadius={90}
                        >
                          {entityChartData.map((entry) => (
                            <Cell
                              fill={
                                CHART_COLORS[
                                  entityChartData.indexOf(entry) %
                                    CHART_COLORS.length
                                ]
                              }
                              key={`cell-${entry.name}`}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  );
                }
                return (
                  <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                    No activity data
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search activities..."
                  value={searchQuery}
                />
              </div>

              <div className="flex gap-2">
                <Select
                  onValueChange={(value) => {
                    setEntityType(value);
                    setPage(1);
                  }}
                  value={entityType}
                >
                  <SelectTrigger className="w-40">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Entity Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entities</SelectItem>
                    <SelectItem value="CLIENT">Client</SelectItem>
                    <SelectItem value="MATTER">Matter</SelectItem>
                    <SelectItem value="DOCUMENT">Document</SelectItem>
                    <SelectItem value="DEADLINE">Deadline</SelectItem>
                    <SelectItem value="STAFF">Staff</SelectItem>
                    <SelectItem value="INVOICE">Invoice</SelectItem>
                    <SelectItem value="APPOINTMENT">Appointment</SelectItem>
                    <SelectItem value="SESSION">Session</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  onValueChange={(value) => {
                    setAction(value);
                    setPage(1);
                  }}
                  value={action}
                >
                  <SelectTrigger className="w-40">
                    <Activity className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="CREATE">Create</SelectItem>
                    <SelectItem value="UPDATE">Update</SelectItem>
                    <SelectItem value="DELETE">Delete</SelectItem>
                    <SelectItem value="VIEW">View</SelectItem>
                    <SelectItem value="LOGIN">Login</SelectItem>
                    <SelectItem value="LOGOUT">Logout</SelectItem>
                    <SelectItem value="UPLOAD">Upload</SelectItem>
                    <SelectItem value="DOWNLOAD">Download</SelectItem>
                    <SelectItem value="STATUS_CHANGE">Status Change</SelectItem>
                    <SelectItem value="ASSIGN">Assign</SelectItem>
                    <SelectItem value="COMPLETE">Complete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Log Table */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              if (logsLoading) {
                return (
                  <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                );
              }
              if (logs.length === 0) {
                return (
                  <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
                    <Activity className="mb-2 h-12 w-12" />
                    <p>No activity logs found</p>
                    <p className="text-sm">
                      Activity will appear here as users interact with the
                      system
                    </p>
                  </div>
                );
              }
              return (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[180px]">Timestamp</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Entity</TableHead>
                          <TableHead className="max-w-[300px]">
                            Description
                          </TableHead>
                          <TableHead>IP Address</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => {
                          const ActionIcon =
                            ACTION_ICONS[log.action] || Activity;
                          const EntityIcon =
                            ENTITY_ICONS[log.entityType] || FileText;
                          const actionColor =
                            ACTION_COLORS[log.action] ||
                            "bg-gray-100 text-gray-700";

                          return (
                            <TableRow key={log.id}>
                              <TableCell className="whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className="font-medium text-sm">
                                    {new Date(
                                      log.createdAt
                                    ).toLocaleDateString()}
                                  </span>
                                  <span className="text-muted-foreground text-xs">
                                    {new Date(
                                      log.createdAt
                                    ).toLocaleTimeString()}
                                  </span>
                                  <span className="text-muted-foreground text-xs">
                                    {formatDistanceToNow(
                                      new Date(log.createdAt),
                                      {
                                        addSuffix: true,
                                      }
                                    )}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                    <User className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {log.user?.name || "System"}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                      {log.user?.email || ""}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={`${actionColor} gap-1`}
                                  variant="outline"
                                >
                                  <ActionIcon className="h-3 w-3" />
                                  {log.action}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <EntityIcon className="h-4 w-4 text-muted-foreground" />
                                  <span>{log.entityType}</span>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[300px] truncate">
                                {log.description}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {log.ipAddress || "-"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-muted-foreground text-sm">
                      Showing {(page - 1) * limit + 1} to{" "}
                      {Math.min(page * limit, logsData?.total || 0)} of{" "}
                      {logsData?.total || 0} entries
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        size="sm"
                        variant="outline"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {page} of {totalPages}
                      </span>
                      <Button
                        disabled={page >= totalPages}
                        onClick={() => setPage(page + 1)}
                        size="sm"
                        variant="outline"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
