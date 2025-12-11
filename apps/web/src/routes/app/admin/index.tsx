import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Loader2,
  Shield,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/app/admin/")({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "staff", "stats"],
    queryFn: () => client.admin.staff.stats(),
  });

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <Button asChild>
            <Link to="/app/admin/staff">
              <Users className="mr-2 h-4 w-4" />
              View All Staff
            </Link>
          </Button>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Admin Panel" },
        ]}
        description="Manage staff, roles, and system settings"
        title="Admin Panel"
      />

      <div className="p-6">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="mb-4 font-semibold text-lg">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <QuickActionCard
              description="View and manage all staff members"
              href="/app/admin/staff"
              icon={Users}
              title="Staff List"
            />
            <QuickActionCard
              description="Add a new staff member to the system"
              href="/app/admin/staff/new"
              icon={UserPlus}
              title="Add Staff"
            />
            <QuickActionCard
              description="Configure roles and permissions"
              href="/app/admin/roles"
              icon={Shield}
              isDisabled
              title="Roles & Permissions"
            />
            <QuickActionCard
              description="System settings and configuration"
              href="/app/admin/settings"
              icon={UserCog}
              isDisabled
              title="System Settings"
            />
          </div>
        </div>

        {/* Staff Statistics */}
        <div className="mb-8">
          <h2 className="mb-4 font-semibold text-lg">Staff Overview</h2>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading statistics...
            </div>
            // biome-ignore lint/style/noNestedTernary: Auto-fix
          ) : stats ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Users}
                title="Total Staff"
                value={stats.totalStaff}
                variant="default"
              />
              <StatCard
                icon={UserCheck}
                title="Active Staff"
                value={stats.activeStaff}
                variant="success"
              />
              <StatCard
                icon={UserX}
                title="Inactive Staff"
                value={stats.inactiveStaff}
                variant="warning"
              />
              <StatCard
                icon={Shield}
                title="Admin Roles"
                value={stats.byRole
                  .filter((r) =>
                    ["OWNER", "GCMC_MANAGER", "KAJ_MANAGER"].includes(r.role)
                  )
                  .reduce((sum, r) => sum + r.count, 0)}
                variant="info"
              />
            </div>
          ) : null}
        </div>

        {/* Business Distribution */}
        {!!stats && (
          <div className="mb-8">
            <h2 className="mb-4 font-semibold text-lg">
              Business Distribution
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">GCMC Staff</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-3xl">
                      {stats.byBusiness.GCMC}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      staff members
                    </span>
                  </div>
                  <Badge
                    className="mt-2 bg-emerald-500/10 text-emerald-600"
                    variant="outline"
                  >
                    GCMC
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">KAJ Staff</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-3xl">
                      {stats.byBusiness.KAJ}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      staff members
                    </span>
                  </div>
                  <Badge
                    className="mt-2 bg-blue-500/10 text-blue-600"
                    variant="outline"
                  >
                    KAJ
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Role Breakdown */}
        {!!stats && stats.byRole.length > 0 && (
          <div>
            <h2 className="mb-4 font-semibold text-lg">Staff by Role</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {stats.byRole.map((roleData) => (
                    <div
                      className="flex items-center justify-between"
                      key={roleData.role}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{roleData.roleDisplay}</p>
                          <p className="text-muted-foreground text-sm">
                            {roleData.role}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{roleData.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

type QuickActionCardProps = {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isDisabled?: boolean;
};

function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
  isDisabled,
}: QuickActionCardProps) {
  const content = (
    <Card
      className={
        isDisabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer transition-shadow hover:shadow-md"
      }
    >
      <CardHeader>
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{description}</p>
        {!!isDisabled && (
          <Badge className="mt-2" variant="outline">
            Coming Soon
          </Badge>
        )}
      </CardContent>
    </Card>
  );

  if (isDisabled) {
    return content;
  }

  return <Link to={href}>{content}</Link>;
}

type StatCardProps = {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "success" | "warning" | "info";
};

function StatCard({
  title,
  value,
  icon: Icon,
  variant = "default",
}: StatCardProps) {
  const colorClasses = {
    default: "bg-gray-500/10 text-gray-600",
    success: "bg-green-500/10 text-green-600",
    warning: "bg-yellow-500/10 text-yellow-600",
    info: "bg-blue-500/10 text-blue-600",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="font-medium text-muted-foreground text-sm">
          {title}
        </CardTitle>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${colorClasses[variant]}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="font-bold text-3xl">{value}</div>
      </CardContent>
    </Card>
  );
}
