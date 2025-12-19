import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Download,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Wand2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { BulkActionsToolbar } from "@/components/bulk-actions/bulk-actions-toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useSelection } from "@/hooks/use-selection";
import { useToast } from "@/hooks/use-toast";
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

const statusValues = [
  "NEW",
  "IN_PROGRESS",
  "PENDING_CLIENT",
  "SUBMITTED",
  "COMPLETE",
  "CANCELLED",
] as const;

const priorityValues = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

function MattersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [businessFilter, setBusinessFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  const matters = data?.matters || [];
  const {
    selectedIdsArray,
    selectedCount,
    isAllSelected,
    isPartiallySelected,
    isSelected,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
  } = useSelection(matters);

  // Clear selection when filters/search/page changes
  useEffect(() => {
    clearSelection();
  }, [clearSelection]);

  // Bulk export mutation
  const exportMutation = useMutation({
    mutationFn: (ids: string[]) => client.matters.bulk.export({ ids }),
    onSuccess: (result) => {
      // Download CSV file
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `matters-export-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);

      toast({
        title: "Export complete",
        description: `Exported ${result.count} matter(s) to CSV`,
      });
      clearSelection();
    },
    onError: () => {
      toast({
        title: "Export failed",
        description: "Failed to export matters. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Bulk update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({
      ids,
      status,
    }: {
      ids: string[];
      status: (typeof statusValues)[number];
    }) => client.matters.bulk.updateStatus({ ids, status }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["matters"] });
      toast({
        title: "Status updated",
        description: `Updated ${result.count} matter(s)`,
      });
      clearSelection();
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Bulk update priority mutation
  const updatePriorityMutation = useMutation({
    mutationFn: ({
      ids,
      priority,
    }: {
      ids: string[];
      priority: (typeof priorityValues)[number];
    }) => client.matters.bulk.updatePriority({ ids, priority }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["matters"] });
      toast({
        title: "Priority updated",
        description: `Updated ${result.count} matter(s)`,
      });
      clearSelection();
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update priority. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleExport = () => {
    if (selectedIdsArray.length > 0) {
      exportMutation.mutate(selectedIdsArray);
    }
  };

  const handleUpdateStatus = (status: (typeof statusValues)[number]) => {
    if (selectedIdsArray.length > 0) {
      updateStatusMutation.mutate({ ids: selectedIdsArray, status });
    }
  };

  const handleUpdatePriority = (priority: (typeof priorityValues)[number]) => {
    if (selectedIdsArray.length > 0) {
      updatePriorityMutation.mutate({ ids: selectedIdsArray, priority });
    }
  };

  // Helper function to render matters table body content
  const renderMattersTableContent = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell className="h-32 text-center" colSpan={9}>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading matters...
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (matters.length > 0) {
      return matters.map((m) => (
        <TableRow className={isSelected(m.id) ? "bg-muted/50" : ""} key={m.id}>
          <TableCell>
            <Checkbox
              aria-label={`Select ${m.referenceNumber}`}
              checked={isSelected(m.id)}
              onCheckedChange={() => toggleSelection(m.id)}
            />
          </TableCell>
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
              <span className="text-sm">{m.serviceType?.name || "-"}</span>
            </div>
          </TableCell>
          <TableCell>
            <StatusBadge status={m.status} />
          </TableCell>
          <TableCell>
            <PriorityBadge priority={m.priority} />
          </TableCell>
          <TableCell>
            {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : "-"}
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
                  <Link params={{ matterId: m.id }} to="/app/matters/$matterId">
                    View Details
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      ));
    }

    return (
      <TableRow>
        <TableCell className="h-32 text-center" colSpan={9}>
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <p>No matters found</p>
            <Button asChild size="sm">
              <Link to="/app/matters/wizard">
                <Wand2 className="mr-2 h-4 w-4" />
                Create your first matter
              </Link>
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/app/matters/new">
                <Plus className="mr-2 h-4 w-4" />
                Quick Add
              </Link>
            </Button>
            <Button asChild>
              <Link to="/app/matters/wizard">
                <Wand2 className="mr-2 h-4 w-4" />
                Matter Wizard
              </Link>
            </Button>
          </div>
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
                <TableHead className="w-12">
                  <Checkbox
                    aria-label="Select all matters"
                    checked={
                      isAllSelected ||
                      (isPartiallySelected === true && "indeterminate")
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
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
            <TableBody>{renderMattersTableContent()}</TableBody>
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

        {/* Bulk Actions Toolbar */}
        <BulkActionsToolbar
          entityName="matters"
          onClearSelection={clearSelection}
          selectedCount={selectedCount}
        >
          <Button
            disabled={exportMutation.isPending}
            onClick={handleExport}
            size="sm"
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            {exportMutation.isPending ? "Exporting..." : "Export CSV"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={updateStatusMutation.isPending}
                size="sm"
                variant="outline"
              >
                {updateStatusMutation.isPending
                  ? "Updating..."
                  : "Update Status"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {statusValues.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => handleUpdateStatus(status)}
                >
                  <StatusBadge status={status} />
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={updatePriorityMutation.isPending}
                size="sm"
                variant="outline"
              >
                {updatePriorityMutation.isPending
                  ? "Updating..."
                  : "Update Priority"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {priorityValues.map((priority) => (
                <DropdownMenuItem
                  key={priority}
                  onClick={() => handleUpdatePriority(priority)}
                >
                  <PriorityBadge priority={priority} />
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </BulkActionsToolbar>
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
