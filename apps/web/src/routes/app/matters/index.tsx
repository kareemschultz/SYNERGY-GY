import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, MoreHorizontal, Plus, Search } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/app/matters/")({
  component: MattersPage,
});

const statusLabels: Record<string, { label: string; className: string }> = {
  NEW: {
    label: "New",
    className: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  },
  PENDING_CLIENT: {
    label: "Pending Client",
    className: "bg-orange-500/10 text-orange-600 border-orange-200",
  },
  SUBMITTED: {
    label: "Submitted",
    className: "bg-purple-500/10 text-purple-600 border-purple-200",
  },
  COMPLETE: {
    label: "Complete",
    className: "bg-green-500/10 text-green-600 border-green-200",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-gray-500/10 text-gray-600 border-gray-200",
  },
};

const priorityLabels: Record<string, { label: string; className: string }> = {
  LOW: {
    label: "Low",
    className: "bg-gray-500/10 text-gray-600 border-gray-200",
  },
  NORMAL: {
    label: "Normal",
    className: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  HIGH: {
    label: "High",
    className: "bg-orange-500/10 text-orange-600 border-orange-200",
  },
  URGENT: {
    label: "Urgent",
    className: "bg-red-500/10 text-red-600 border-red-200",
  },
};

function MattersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [businessFilter, setBusinessFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "matters",
      { search, status: statusFilter, business: businessFilter, page },
    ],
    queryFn: () =>
      client.matters.list({
        page,
        limit: 20,
        search: search || undefined,
        status:
          statusFilter === "all"
            ? undefined
            : (statusFilter as
                | "NEW"
                | "IN_PROGRESS"
                | "PENDING_CLIENT"
                | "SUBMITTED"
                | "COMPLETE"
                | "CANCELLED"),
        business:
          businessFilter === "all"
            ? undefined
            : (businessFilter as "GCMC" | "KAJ"),
      }),
  });

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <Button asChild>
            <Link to="/app/matters/new">
              <Plus className="mr-2 h-4 w-4" />
              New Matter
            </Link>
          </Button>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Matters" },
        ]}
        description="Track service requests and cases across both businesses"
        title="Matters"
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
              placeholder="Search by title or reference number..."
              value={search}
            />
          </div>

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
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="PENDING_CLIENT">Pending Client</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="COMPLETE">Complete</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Error state */}
        {!!error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
            Failed to load matters. Please try again.
          </div>
        )}

        {/* Matters Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell className="h-32 text-center" colSpan={8}>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading matters...
                    </div>
                  </TableCell>
                </TableRow>
                // biome-ignore lint/nursery/noLeakedRender: Auto-fix
                // biome-ignore lint/style/noNestedTernary: Auto-fix
              ) : data?.matters && data.matters.length > 0 ? (
                data.matters.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-sm">
                      <Link
                        className="hover:underline"
                        params={{ matterId: m.id }}
                        to="/app/matters/$matterId"
                      >
                        {m.referenceNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        className="hover:underline"
                        params={{ matterId: m.id }}
                        to="/app/matters/$matterId"
                      >
                        {m.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {m.client ? (
                        <Link
                          className="hover:underline"
                          params={{ clientId: m.client.id }}
                          to="/app/clients/$clientId"
                        >
                          {m.client.displayName}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BusinessBadge business={m.business} />
                        <span className="text-sm">
                          {m.serviceType?.name || "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={m.status} />
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={m.priority} />
                    </TableCell>
                    <TableCell>
                      {m.dueDate
                        ? new Date(m.dueDate).toLocaleDateString()
                        : "-"}
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
                              params={{ matterId: m.id }}
                              to="/app/matters/$matterId"
                            >
                              View Details
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="h-32 text-center" colSpan={8}>
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <p>No matters found</p>
                      <Button asChild size="sm" variant="outline">
                        <Link to="/app/matters/new">
                          <Plus className="mr-2 h-4 w-4" />
                          Create your first matter
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
        {!!data?.totalPages && data.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)}{" "}
              of {data.total} matters
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

function BusinessBadge({ business }: { business: string }) {
  const isGCMC = business === "GCMC";
  return (
    <Badge
      className={
        isGCMC
          ? "bg-emerald-500/10 text-emerald-600"
          : "bg-blue-500/10 text-blue-600"
      }
      variant="outline"
    >
      {business}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant = statusLabels[status] || statusLabels.NEW;
  return (
    <Badge className={variant.className} variant="outline">
      {variant.label}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const variant = priorityLabels[priority] || priorityLabels.NORMAL;
  return (
    <Badge className={variant.className} variant="outline">
      {variant.label}
    </Badge>
  );
}
