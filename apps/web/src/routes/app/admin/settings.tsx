import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Database,
  ExternalLink,
  FileArchive,
  HardDrive,
  Info,
  Loader2,
  RefreshCw,
  Server,
  Settings,
  Shield,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/app/admin/settings")({
  component: SystemSettingsPage,
});

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Admin settings page aggregates app info, backup stats, staff stats, and system configuration across multiple cards
function SystemSettingsPage() {
  const { data: appInfo, isLoading: appInfoLoading } = useQuery({
    queryKey: ["settings", "appInfo"],
    queryFn: () => client.settings.getAppInfo(),
  });

  const { data: backupStats, isLoading: backupStatsLoading } = useQuery({
    queryKey: ["backup", "stats"],
    queryFn: () => client.backup.getStats(),
  });

  const { data: staffStats, isLoading: staffStatsLoading } = useQuery({
    queryKey: ["admin", "staff", "stats"],
    queryFn: () => client.admin.staff.stats(),
  });

  const isLoading = appInfoLoading || backupStatsLoading || staffStatsLoading;

  return (
    <div className="flex flex-col">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Admin", href: "/app/admin" },
          { label: "System Settings" },
        ]}
        description="View system configuration and status"
        title="System Settings"
      />

      <div className="space-y-8 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading system information...
          </div>
        ) : (
          <>
            {/* Application Information */}
            <div>
              <h2 className="mb-4 flex items-center gap-2 font-semibold text-lg">
                <Info className="h-5 w-5" />
                Application Information
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Server className="h-4 w-4" />
                      Version
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-bold text-2xl">
                      {appInfo?.version || "N/A"}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      GK-Nexus Business Management
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Calendar className="h-4 w-4" />
                      Build Date
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-bold text-2xl">
                      {appInfo?.buildDate || "N/A"}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Last deployment date
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Settings className="h-4 w-4" />
                      Environment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          appInfo?.environment === "production"
                            ? "bg-green-500/10 text-green-600"
                            : "bg-yellow-500/10 text-yellow-600"
                        }
                        variant="outline"
                      >
                        {appInfo?.environment || "N/A"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground text-sm">
                      Current environment
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator />

            {/* Backup System Status */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-semibold text-lg">
                  <FileArchive className="h-5 w-5" />
                  Backup System
                </h2>
                <Button asChild size="sm" variant="outline">
                  <Link to="/app/settings">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Manage Backups
                  </Link>
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Database className="h-4 w-4" />
                      Total Backups
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-bold text-2xl">
                      {backupStats?.counts.total || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-muted-foreground text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Completed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-bold text-2xl text-green-600">
                      {backupStats?.counts.completed || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-muted-foreground text-sm">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Failed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-bold text-2xl text-red-600">
                      {backupStats?.counts.failed || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-muted-foreground text-sm">
                      <HardDrive className="h-4 w-4" />
                      Storage Used
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-bold text-2xl">
                      {backupStats?.storage.diskTotalSizeFormatted || "0 B"}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {backupStats?.storage.diskFiles || 0} files
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Latest Backup */}
              {backupStats?.latestBackup ? (
                <Card className="mt-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Clock className="h-4 w-4" />
                      Latest Backup
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <p className="font-medium">
                          {backupStats.latestBackup.name}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {backupStats.latestBackup.completedAt
                            ? new Date(
                                backupStats.latestBackup.completedAt
                              ).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                      <Badge
                        className="bg-green-500/10 text-green-600"
                        variant="outline"
                      >
                        {backupStats.latestBackup.fileSizeFormatted}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="mt-4 border-yellow-200 bg-yellow-500/10">
                  <CardContent className="flex items-center gap-3 pt-6">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-800">
                        No backups found
                      </p>
                      <p className="text-sm text-yellow-700">
                        Create your first backup from the user settings page.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <Separator />

            {/* Staff Overview */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-semibold text-lg">
                  <Shield className="h-5 w-5" />
                  Staff Overview
                </h2>
                <Button asChild size="sm" variant="outline">
                  <Link to="/app/admin/staff">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Manage Staff
                  </Link>
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-muted-foreground text-sm">
                      Total Staff
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-bold text-2xl">
                      {staffStats?.totalStaff || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-muted-foreground text-sm">
                      Active
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-bold text-2xl text-green-600">
                      {staffStats?.activeStaff || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-muted-foreground text-sm">
                      GCMC Staff
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-bold text-2xl text-emerald-600">
                      {staffStats?.byBusiness.GCMC || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-muted-foreground text-sm">
                      KAJ Staff
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-bold text-2xl text-blue-600">
                      {staffStats?.byBusiness.KAJ || 0}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator />

            {/* Business Entities */}
            <div>
              <h2 className="mb-4 flex items-center gap-2 font-semibold text-lg">
                <Server className="h-5 w-5" />
                Business Entities
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-emerald-200">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                        <Server className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle>GCMC</CardTitle>
                        <p className="text-muted-foreground text-sm">
                          Guyana Consultancy & Management Co.
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Services</span>
                        <span>Tax, Immigration, Training</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <Badge
                          className="bg-green-500/10 text-green-600"
                          variant="outline"
                        >
                          Active
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                        <Server className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle>KAJ</CardTitle>
                        <p className="text-muted-foreground text-sm">
                          KAJ Insurance Consultants
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Services</span>
                        <span>NIS, Insurance</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <Badge
                          className="bg-green-500/10 text-green-600"
                          variant="outline"
                        >
                          Active
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator />

            {/* Quick Actions */}
            <div>
              <h2 className="mb-4 flex items-center gap-2 font-semibold text-lg">
                <RefreshCw className="h-5 w-5" />
                Quick Actions
              </h2>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link to="/app/admin/staff">Manage Staff</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/app/admin/roles">View Roles</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/app/admin/services">Manage Services</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/app/settings">User Settings</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
