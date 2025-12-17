import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Building2,
  Check,
  Crown,
  Eye,
  FileText,
  Loader2,
  Settings,
  Shield,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/app/admin/roles")({
  component: RolesPermissionsPage,
});

// Role definitions with their permissions and requirements
const roleDefinitions = [
  {
    role: "OWNER",
    displayName: "Owner",
    description: "Full system access with all administrative privileges",
    requiredBusinesses: ["GCMC", "KAJ"],
    icon: Crown,
    color: "text-amber-600 bg-amber-500/10",
    permissions: {
      manageStaff: true,
      manageClients: true,
      manageServices: true,
      manageDocuments: true,
      viewFinancials: true,
      viewAllBusinesses: true,
      systemSettings: true,
      auditLogs: true,
    },
  },
  {
    role: "GCMC_MANAGER",
    displayName: "GCMC Manager",
    description: "Full management access for GCMC business operations",
    requiredBusinesses: ["GCMC"],
    icon: ShieldCheck,
    color: "text-emerald-600 bg-emerald-500/10",
    permissions: {
      manageStaff: true,
      manageClients: true,
      manageServices: true,
      manageDocuments: true,
      viewFinancials: true,
      viewAllBusinesses: false,
      systemSettings: false,
      auditLogs: true,
    },
  },
  {
    role: "KAJ_MANAGER",
    displayName: "KAJ Manager",
    description: "Full management access for KAJ business operations",
    requiredBusinesses: ["KAJ"],
    icon: ShieldCheck,
    color: "text-blue-600 bg-blue-500/10",
    permissions: {
      manageStaff: true,
      manageClients: true,
      manageServices: true,
      manageDocuments: true,
      viewFinancials: true,
      viewAllBusinesses: false,
      systemSettings: false,
      auditLogs: true,
    },
  },
  {
    role: "STAFF_GCMC",
    displayName: "GCMC Staff",
    description: "Standard staff access for GCMC operations",
    requiredBusinesses: ["GCMC"],
    icon: Users,
    color: "text-emerald-600 bg-emerald-500/10",
    permissions: {
      manageStaff: false,
      manageClients: true,
      manageServices: true,
      manageDocuments: true,
      viewFinancials: false,
      viewAllBusinesses: false,
      systemSettings: false,
      auditLogs: false,
    },
  },
  {
    role: "STAFF_KAJ",
    displayName: "KAJ Staff",
    description: "Standard staff access for KAJ operations",
    requiredBusinesses: ["KAJ"],
    icon: Users,
    color: "text-blue-600 bg-blue-500/10",
    permissions: {
      manageStaff: false,
      manageClients: true,
      manageServices: true,
      manageDocuments: true,
      viewFinancials: false,
      viewAllBusinesses: false,
      systemSettings: false,
      auditLogs: false,
    },
  },
  {
    role: "STAFF_BOTH",
    displayName: "Staff (Both)",
    description: "Staff access for both GCMC and KAJ operations",
    requiredBusinesses: ["GCMC", "KAJ"],
    icon: Users,
    color: "text-purple-600 bg-purple-500/10",
    permissions: {
      manageStaff: false,
      manageClients: true,
      manageServices: true,
      manageDocuments: true,
      viewFinancials: false,
      viewAllBusinesses: true,
      systemSettings: false,
      auditLogs: false,
    },
  },
  {
    role: "RECEPTIONIST",
    displayName: "Receptionist",
    description: "Limited access for front desk and basic client operations",
    requiredBusinesses: ["GCMC", "KAJ"],
    icon: Shield,
    color: "text-slate-600 bg-slate-500/10",
    permissions: {
      manageStaff: false,
      manageClients: true,
      manageServices: false,
      manageDocuments: false,
      viewFinancials: false,
      viewAllBusinesses: true,
      systemSettings: false,
      auditLogs: false,
    },
  },
] as const;

const permissionLabels: Record<string, { label: string; icon: typeof Shield }> =
  {
    manageStaff: { label: "Manage Staff", icon: Users },
    manageClients: { label: "Manage Clients", icon: Users },
    manageServices: { label: "Manage Services", icon: Settings },
    manageDocuments: { label: "Manage Documents", icon: FileText },
    viewFinancials: { label: "View Financials", icon: Eye },
    viewAllBusinesses: { label: "View All Businesses", icon: Building2 },
    systemSettings: { label: "System Settings", icon: Settings },
    auditLogs: { label: "Audit Logs", icon: Eye },
  };

function RolesPermissionsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "staff", "stats"],
    queryFn: () => client.admin.staff.stats(),
  });

  return (
    <div className="flex flex-col">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Admin", href: "/app/admin" },
          { label: "Roles & Permissions" },
        ]}
        description="View system roles and their associated permissions"
        title="Roles & Permissions"
      />

      <div className="space-y-8 p-6">
        {/* Role Statistics */}
        <div>
          <h2 className="mb-4 font-semibold text-lg">Role Distribution</h2>
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading statistics...
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
              {roleDefinitions.map((roleDef) => {
                const roleStats = stats?.byRole.find(
                  (r) => r.role === roleDef.role
                );
                const Icon = roleDef.icon;
                return (
                  <Card key={roleDef.role}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        <div
                          className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full ${roleDef.color}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <p className="font-medium text-sm">
                          {roleDef.displayName}
                        </p>
                        <p className="font-bold text-2xl">
                          {roleStats?.count ?? 0}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Role Cards */}
        <div>
          <h2 className="mb-4 font-semibold text-lg">Role Definitions</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {roleDefinitions.map((roleDef) => {
              const Icon = roleDef.icon;
              return (
                <Card key={roleDef.role}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${roleDef.color}`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {roleDef.displayName}
                        </CardTitle>
                        <p className="mt-1 text-muted-foreground text-sm">
                          {roleDef.description}
                        </p>
                        <div className="mt-2 flex gap-2">
                          {roleDef.requiredBusinesses.map((biz) => (
                            <Badge
                              className={
                                biz === "GCMC"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : "bg-blue-500/10 text-blue-600"
                              }
                              key={biz}
                              variant="outline"
                            >
                              {biz}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(roleDef.permissions).map(
                        ([perm, hasPermission]) => {
                          const permInfo = permissionLabels[perm];
                          const PermIcon = permInfo?.icon || Shield;
                          return (
                            <div
                              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                                hasPermission
                                  ? "bg-green-500/10 text-green-700"
                                  : "bg-gray-100 text-gray-400 dark:bg-gray-800/50"
                              }`}
                              key={perm}
                            >
                              {hasPermission ? (
                                <Check className="h-4 w-4 shrink-0" />
                              ) : (
                                <X className="h-4 w-4 shrink-0" />
                              )}
                              <PermIcon className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">
                                {permInfo?.label || perm}
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Permission Matrix */}
        <div>
          <h2 className="mb-4 font-semibold text-lg">Permission Matrix</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-48">Permission</TableHead>
                      {roleDefinitions.map((roleDef) => (
                        <TableHead
                          className="w-24 text-center"
                          key={roleDef.role}
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="cursor-help">
                                <span className="text-xs">
                                  {roleDef.displayName}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{roleDef.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(permissionLabels).map(
                      ([permKey, permInfo]) => {
                        const PermIcon = permInfo.icon;
                        return (
                          <TableRow key={permKey}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <PermIcon className="h-4 w-4 text-muted-foreground" />
                                {permInfo.label}
                              </div>
                            </TableCell>
                            {roleDefinitions.map((roleDef) => {
                              const hasPermission =
                                roleDef.permissions[
                                  permKey as keyof typeof roleDef.permissions
                                ];
                              return (
                                <TableCell
                                  className="text-center"
                                  key={roleDef.role}
                                >
                                  {hasPermission ? (
                                    <Check className="inline h-5 w-5 text-green-600" />
                                  ) : (
                                    <X className="inline h-5 w-5 text-gray-300" />
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      }
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Business Access Requirements */}
        <div>
          <h2 className="mb-4 font-semibold text-lg">Business Access Rules</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-500/10 p-4">
                  <Crown className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800">
                      Owner & Staff (Both)
                    </p>
                    <p className="text-amber-700 text-sm">
                      Must have access to both GCMC and KAJ businesses. Cannot
                      be restricted to a single business.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-500/10 p-4">
                  <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-medium text-emerald-800">GCMC Roles</p>
                    <p className="text-emerald-700 text-sm">
                      GCMC Manager and GCMC Staff must have GCMC business
                      access. May optionally have KAJ access.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-500/10 p-4">
                  <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">KAJ Roles</p>
                    <p className="text-blue-700 text-sm">
                      KAJ Manager and KAJ Staff must have KAJ business access.
                      May optionally have GCMC access.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-500/10 p-4">
                  <Shield className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />
                  <div>
                    <p className="font-medium text-slate-800">Receptionist</p>
                    <p className="text-slate-700 text-sm">
                      Receptionists can be assigned to either or both
                      businesses. Access is flexible based on front desk needs.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
