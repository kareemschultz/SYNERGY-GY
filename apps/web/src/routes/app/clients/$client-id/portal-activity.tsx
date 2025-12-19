import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, Clock, Download, LogIn, Shield, User } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/app/clients/$client-id/portal-activity")(
  {
    component: PortalActivityPage,
  }
);

function PortalActivityPage() {
  const { "client-id": clientId } = Route.useParams();

  const { data: stats } = useQuery(
    orpc.portal.analytics.getActivityStats.queryOptions({
      input: { clientId },
    })
  );
  const { data: activityData } = useQuery(
    orpc.portal.analytics.getPortalActivity.queryOptions({
      input: { clientId, limit: 50 },
    })
  );
  const { data: impersonationHistory } = useQuery(
    orpc.portal.analytics.getImpersonationHistory.queryOptions({
      input: { clientId },
    })
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Clients", href: "/app/clients" },
          { label: "Client Details", href: `/app/clients/${clientId}` },
          { label: "Portal Activity" },
        ]}
        description="Monitor client portal usage and staff access"
        title="Portal Activity"
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatsCard
          icon={<LogIn className="h-4 w-4 text-muted-foreground" />}
          title="Total Logins"
          value={stats?.totalLogins.toString() || "0"}
        />
        <StatsCard
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          title="Avg Session"
          value={
            stats?.avgSessionDuration
              ? `${stats.avgSessionDuration} min`
              : "0 min"
          }
        />
        <StatsCard
          icon={<Download className="h-4 w-4 text-muted-foreground" />}
          title="Downloads"
          value={stats?.totalDownloads.toString() || "0"}
        />
        <StatsCard
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          title="Last Active"
          value={
            stats?.lastLoginAt
              ? new Date(stats.lastLoginAt).toLocaleDateString()
              : "Never"
          }
        />
      </div>

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="impersonation">Impersonation History</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest actions performed by the client on the portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Context</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityData?.activities.length === 0 ? (
                    <TableRow>
                      <TableCell
                        className="py-8 text-center text-muted-foreground"
                        colSpan={5}
                      >
                        No activity recorded
                      </TableCell>
                    </TableRow>
                  ) : (
                    activityData?.activities.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {log.action.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.entityType ? (
                            <span className="text-sm">
                              {log.entityType}: {log.entityId?.slice(0, 8)}...
                            </span>
                          ) : null}
                          {log.metadata ? (
                            <div className="text-muted-foreground text-xs">
                              {JSON.stringify(
                                log.metadata as Record<string, unknown>
                              )}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground text-xs">
                          {log.ipAddress || "Unknown"}
                        </TableCell>
                        <TableCell>
                          {log.isImpersonated ? (
                            <Badge
                              className="flex w-fit items-center gap-1"
                              variant="destructive"
                            >
                              <Shield className="h-3 w-3" /> Staff
                            </Badge>
                          ) : (
                            <Badge
                              className="flex w-fit items-center gap-1"
                              variant="secondary"
                            >
                              <User className="h-3 w-3" /> Client
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4" value="impersonation">
          <Card>
            <CardHeader>
              <CardTitle>Staff Impersonation Audit</CardTitle>
              <CardDescription>
                Record of staff members accessing this client's portal account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Started At</TableHead>
                    <TableHead>Ended At</TableHead>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {impersonationHistory?.length === 0 ? (
                    <TableRow>
                      <TableCell
                        className="py-8 text-center text-muted-foreground"
                        colSpan={5}
                      >
                        No impersonation history
                      </TableCell>
                    </TableRow>
                  ) : (
                    impersonationHistory?.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          {new Date(session.startedAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {session.endedAt
                            ? new Date(session.endedAt).toLocaleString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs">
                              {session.staffUser?.name?.slice(0, 1) || "S"}
                            </div>
                            <span>
                              {session.staffUser?.name || "Unknown Staff"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{session.reason}</TableCell>
                        <TableCell>
                          {session.isActive ? (
                            <Badge className="bg-green-500/10 text-green-600">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline">Ended</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-medium text-sm">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="font-bold text-2xl">{value}</div>
      </CardContent>
    </Card>
  );
}
