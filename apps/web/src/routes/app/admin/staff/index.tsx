import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  Check,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useToast } from "@/hooks/use-toast";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/app/admin/staff/")({
  component: StaffListPage,
});

const roleLabels: Record<string, string> = {
  OWNER: "Owner",
  GCMC_MANAGER: "GCMC Manager",
  KAJ_MANAGER: "KAJ Manager",
  STAFF_GCMC: "GCMC Staff",
  STAFF_KAJ: "KAJ Staff",
  STAFF_BOTH: "Staff (Both)",
  RECEPTIONIST: "Receptionist",
};

function StaffListPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [businessFilter, setBusinessFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("true");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "admin",
      "staff",
      "list",
      {
        search,
        role: roleFilter,
        business: businessFilter,
        status: statusFilter,
        page,
      },
    ],
    queryFn: () =>
      client.admin.staff.list({
        page,
        limit: 20,
        search: search || undefined,
        role:
          roleFilter === "all"
            ? undefined
            : (roleFilter as
                | "OWNER"
                | "GCMC_MANAGER"
                | "KAJ_MANAGER"
                | "STAFF_GCMC"
                | "STAFF_KAJ"
                | "STAFF_BOTH"
                | "RECEPTIONIST"),
        business:
          businessFilter === "all"
            ? undefined
            : (businessFilter as "GCMC" | "KAJ"),
        isActive: statusFilter === "all" ? undefined : statusFilter === "true",
      }),
  });

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <Button asChild>
            <Link to="/app/admin/staff/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Staff
            </Link>
          </Button>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Admin", href: "/app/admin" },
          { label: "Staff" },
        ]}
        description="Manage staff members, roles, and permissions"
        title="Staff Management"
      />

      <div className="p-6">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative min-w-64 flex-1">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email, or job title..."
              value={search}
            />
          </div>

          <Select
            onValueChange={(value) => {
              setRoleFilter(value);
              setPage(1);
            }}
            value={roleFilter}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="OWNER">Owner</SelectItem>
              <SelectItem value="GCMC_MANAGER">GCMC Manager</SelectItem>
              <SelectItem value="KAJ_MANAGER">KAJ Manager</SelectItem>
              <SelectItem value="STAFF_GCMC">GCMC Staff</SelectItem>
              <SelectItem value="STAFF_KAJ">KAJ Staff</SelectItem>
              <SelectItem value="STAFF_BOTH">Staff (Both)</SelectItem>
              <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
            </SelectContent>
          </Select>

          <Select
            onValueChange={(value) => {
              setBusinessFilter(value);
              setPage(1);
            }}
            value={businessFilter}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Business" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Businesses</SelectItem>
              <SelectItem value="GCMC">GCMC</SelectItem>
              <SelectItem value="KAJ">KAJ</SelectItem>
            </SelectContent>
          </Select>

          <Select
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            value={statusFilter}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Failed to load staff</p>
              <p className="text-sm">
                {error instanceof Error
                  ? error.message
                  : "An error occurred. Please try again."}
              </p>
            </div>
          </div>
        )}

        {/* Staff Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Business Access</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell className="h-32 text-center" colSpan={7}>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading staff...
                    </div>
                  </TableCell>
                </TableRow>
              ) : data?.staff && data.staff.length > 0 ? (
                data.staff.map((s) => <StaffTableRow key={s.id} staff={s} />)
              ) : (
                <TableRow>
                  <TableCell className="h-32 text-center" colSpan={7}>
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <p>No staff members found</p>
                      <Button asChild size="sm" variant="outline">
                        <Link to="/app/admin/staff/new">
                          <Plus className="mr-2 h-4 w-4" />
                          Add your first staff member
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)}{" "}
              of {data.total} staff members
            </p>
            <div className="flex gap-2">
              <Button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                size="sm"
                variant="outline"
              >
                Previous
              </Button>
              <Button
                disabled={page === data.totalPages}
                onClick={() => setPage(page + 1)}
                size="sm"
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type StaffMember = {
  id: string;
  userId: string;
  role: string;
  businesses: string[];
  phone: string | null;
  jobTitle: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  userName: string;
  userEmail: string;
  userImage: string | null;
};

function StaffTableRow({ staff }: { staff: StaffMember }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const toggleActiveMutation = useMutation({
    mutationFn: (isActive: boolean) =>
      client.admin.staff.toggleActive({ id: staff.id, isActive }),
    onSuccess: (_, isActive) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
      toast({
        title: isActive ? "Staff activated" : "Staff deactivated",
        description: `${staff.userName} has been ${isActive ? "activated" : "deactivated"} successfully.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update staff status. Please try again.",
      });
    },
  });

  return (
    <TableRow>
      <TableCell className="font-medium">
        <Link
          className="hover:underline"
          params={{ staffId: staff.id }}
          to="/app/admin/staff/$staffId"
        >
          {staff.userName}
        </Link>
      </TableCell>
      <TableCell className="text-sm">{staff.userEmail}</TableCell>
      <TableCell>
        <RoleBadge role={staff.role} />
      </TableCell>
      <TableCell>
        <BusinessBadges businesses={staff.businesses} />
      </TableCell>
      <TableCell className="text-sm">{staff.jobTitle || "-"}</TableCell>
      <TableCell>
        <StatusBadge isActive={staff.isActive} />
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link
                params={{ staffId: staff.id }}
                to="/app/admin/staff/$staffId"
              >
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                params={{ staffId: staff.id }}
                search={{ edit: true }}
                to="/app/admin/staff/$staffId"
              >
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={toggleActiveMutation.isPending}
              onClick={() => toggleActiveMutation.mutate(!staff.isActive)}
            >
              {toggleActiveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {staff.isActive ? "Deactivating..." : "Activating..."}
                </>
              ) : staff.isActive ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = ["OWNER", "GCMC_MANAGER", "KAJ_MANAGER"].includes(role);

  return (
    <Badge
      className={
        isAdmin
          ? "border-purple-200 bg-purple-500/10 text-purple-600"
          : "border-blue-200 bg-blue-500/10 text-blue-600"
      }
      variant="outline"
    >
      {roleLabels[role] || role}
    </Badge>
  );
}

function BusinessBadges({ businesses }: { businesses: string[] }) {
  return (
    <div className="flex gap-1">
      {businesses.includes("GCMC") && (
        <Badge className="bg-emerald-500/10 text-emerald-600" variant="outline">
          GCMC
        </Badge>
      )}
      {businesses.includes("KAJ") && (
        <Badge className="bg-blue-500/10 text-blue-600" variant="outline">
          KAJ
        </Badge>
      )}
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      className={
        isActive
          ? "border-green-200 bg-green-500/10 text-green-600"
          : "border-gray-200 bg-gray-500/10 text-gray-600"
      }
      variant="outline"
    >
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}
