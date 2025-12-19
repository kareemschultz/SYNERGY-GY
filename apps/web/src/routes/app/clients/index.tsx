import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Archive,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Download,
  Grid3X3,
  List,
  MoreHorizontal,
  Plus,
  Search,
  UserPlus,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BulkActionsToolbar } from "@/components/bulk-actions/bulk-actions-toolbar";
import { ClientCard } from "@/components/clients/client-card";
import {
  EngagementBadge,
  FinancialBadge,
  WorkloadBadge,
} from "@/components/clients/client-stats-badge";
import { ComplianceIndicator } from "@/components/clients/compliance-indicator";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSelection } from "@/hooks/use-selection";
import { client, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/app/clients/")({
  component: ClientsPage,
});

const clientTypeLabels: Record<string, string> = {
  INDIVIDUAL: "Individual",
  SMALL_BUSINESS: "Small Business",
  CORPORATION: "Corporation",
  NGO: "NGO",
  COOP: "Cooperative",
  CREDIT_UNION: "Credit Union",
  FOREIGN_NATIONAL: "Foreign National",
  INVESTOR: "Investor",
};

function LoadingSkeleton({
  effectiveView,
  canViewFinancials,
}: {
  effectiveView: "table" | "cards";
  canViewFinancials: boolean;
}) {
  if (effectiveView === "cards") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton loaders don't need stable keys
          <Skeleton className="h-48 rounded-lg" key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12" />
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Businesses</TableHead>
            <TableHead>Workload</TableHead>
            <TableHead className="hidden lg:table-cell">Compliance</TableHead>
            {canViewFinancials ? (
              <TableHead className="hidden xl:table-cell">Financial</TableHead>
            ) : null}
            <TableHead className="hidden md:table-cell">Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton loaders don't need stable keys
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-4" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-12" />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <Skeleton className="h-4 w-16" />
              </TableCell>
              {canViewFinancials ? (
                <TableCell className="hidden xl:table-cell">
                  <Skeleton className="h-4 w-16" />
                </TableCell>
              ) : null}
              <TableCell className="hidden md:table-cell">
                <Skeleton className="h-8 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Sort options for clients list
const sortOptions = [
  { value: "displayName", label: "Name" },
  { value: "createdAt", label: "Date Added" },
  { value: "updatedAt", label: "Last Updated" },
  { value: "activeMatterCount", label: "Active Matters" },
] as const;

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Page component with multiple filters, bulk actions, and view modes
function ClientsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [businessFilter, setBusinessFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");
  const [sortBy, setSortBy] = useState<string>("displayName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const isMobile = useMediaQuery("(max-width: 768px)");
  const effectiveView = isMobile ? "cards" : viewMode;

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "clientsWithStats",
      {
        search,
        type: typeFilter,
        business: businessFilter,
        status: statusFilter,
        sortBy,
        sortOrder,
        page,
      },
    ],
    queryFn: () =>
      client.clients.listWithStats({
        page,
        limit: 20,
        search: search || undefined,
        type:
          typeFilter === "all"
            ? undefined
            : (typeFilter as
                | "INDIVIDUAL"
                | "SMALL_BUSINESS"
                | "CORPORATION"
                | "NGO"
                | "COOP"
                | "CREDIT_UNION"
                | "FOREIGN_NATIONAL"
                | "INVESTOR"),
        business:
          businessFilter === "all"
            ? undefined
            : (businessFilter as "GCMC" | "KAJ"),
        status:
          statusFilter === "all"
            ? undefined
            : (statusFilter as "ACTIVE" | "INACTIVE" | "ARCHIVED"),
        sortBy: sortBy as
          | "displayName"
          | "createdAt"
          | "updatedAt"
          | "activeMatterCount",
        sortOrder,
      }),
  });

  const canViewFinancials = data?.canViewFinancials ?? false;

  // Selection state for bulk actions
  const {
    selectedIds,
    selectedCount,
    hasSelection,
    isAllSelected,
    isPartiallySelected,
    isSelected,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
  } = useSelection(data?.clients ?? []);

  // Bulk archive mutation
  const archiveMutation = useMutation({
    mutationFn: (ids: string[]) => client.clients.bulk.archive({ ids }),
    onSuccess: (result) => {
      toast.success(`${result.archivedCount} clients archived`);
      clearSelection();
      queryClient.invalidateQueries({ queryKey: ["clientsWithStats"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to archive clients");
    },
  });

  // Bulk export mutation
  const exportMutation = useMutation({
    mutationFn: (ids: string[]) => client.clients.bulk.export({ ids }),
    onSuccess: (result) => {
      // Create and download CSV file
      const blob = new Blob([result.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${result.exportedCount} clients exported`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to export clients");
    },
  });

  // Assign staff modal state
  const [showAssignStaffModal, setShowAssignStaffModal] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");

  // Query for staff list (for assign staff dropdown)
  const { data: staffData } = useQuery({
    queryKey: ["admin", "staff", "forAssign"],
    queryFn: () =>
      client.admin.staff.list({ limit: 100, isActive: true, sortBy: "name" }),
    staleTime: 60_000,
    enabled: showAssignStaffModal, // Only fetch when modal is open
  });

  // Bulk assign staff mutation
  const assignStaffMutation = useMutation({
    mutationFn: (input: { ids: string[]; primaryStaffId: string }) =>
      client.clients.bulk.assignStaff(input),
    onSuccess: (result) => {
      toast.success(`${result.updatedCount} clients updated`);
      clearSelection();
      setShowAssignStaffModal(false);
      setSelectedStaffId("");
      queryClient.invalidateQueries({ queryKey: ["clientsWithStats"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to assign staff");
    },
  });

  const handleBulkArchive = () => {
    if (selectedCount > 0) {
      archiveMutation.mutate(Array.from(selectedIds));
    }
  };

  const handleBulkExport = () => {
    if (selectedCount > 0) {
      exportMutation.mutate(Array.from(selectedIds));
    }
  };

  const handleBulkAssignStaff = () => {
    if (selectedCount > 0 && selectedStaffId) {
      assignStaffMutation.mutate({
        ids: Array.from(selectedIds),
        primaryStaffId: selectedStaffId,
      });
    }
  };

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <div className="flex gap-2">
            <Button
              asChild
              data-testid="clients-quick-add-btn"
              variant="outline"
            >
              <Link to="/app/clients/new">
                <Plus className="mr-2 h-4 w-4" />
                Quick Add
              </Link>
            </Button>
            <Button asChild data-testid="clients-wizard-btn">
              <Link to="/app/clients/onboard">
                <Wand2 className="mr-2 h-4 w-4" />
                Client Wizard
              </Link>
            </Button>
          </div>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Clients" },
        ]}
        description="Manage clients across both businesses"
        title="Clients"
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
                clearSelection();
              }}
              placeholder="Search clients by name, email, or TIN..."
              value={search}
            />
          </div>

          <Select
            onValueChange={(value) => {
              setBusinessFilter(value);
              setPage(1);
              clearSelection();
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
              setTypeFilter(value);
              setPage(1);
              clearSelection();
            }}
            value={typeFilter}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="INDIVIDUAL">Individual</SelectItem>
              <SelectItem value="SMALL_BUSINESS">Small Business</SelectItem>
              <SelectItem value="CORPORATION">Corporation</SelectItem>
              <SelectItem value="NGO">NGO</SelectItem>
              <SelectItem value="COOP">Cooperative</SelectItem>
              <SelectItem value="CREDIT_UNION">Credit Union</SelectItem>
              <SelectItem value="FOREIGN_NATIONAL">Foreign National</SelectItem>
              <SelectItem value="INVESTOR">Investor</SelectItem>
            </SelectContent>
          </Select>

          <Select
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
              clearSelection();
            }}
            value={statusFilter}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1">
            <Select
              onValueChange={(value) => {
                setSortBy(value);
                setPage(1);
              }}
              value={sortBy}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                if (sortOrder === "asc") {
                  setSortOrder("desc");
                } else {
                  setSortOrder("asc");
                }
                setPage(1);
              }}
              size="icon"
              title={sortOrder === "asc" ? "Ascending" : "Descending"}
              variant="outline"
            >
              {sortOrder === "asc" ? (
                <ArrowUpWideNarrow className="h-4 w-4" />
              ) : (
                <ArrowDownWideNarrow className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* View Toggle (hidden on mobile) */}
          {!isMobile && (
            <div className="flex rounded-md border">
              <Button
                className="rounded-r-none"
                onClick={() => setViewMode("table")}
                size="icon"
                variant={viewMode === "table" ? "secondary" : "ghost"}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                className="rounded-l-none"
                onClick={() => setViewMode("cards")}
                size="icon"
                variant={viewMode === "cards" ? "secondary" : "ghost"}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Error state */}
        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
            Failed to load clients. Please try again.
          </div>
        ) : null}

        {/* Loading state */}
        {isLoading ? (
          <LoadingSkeleton
            canViewFinancials={canViewFinancials}
            effectiveView={effectiveView}
          />
        ) : null}

        {/* Content */}
        {/* biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Content rendering handles loading states, view mode switching, empty states, and table row mapping */}
        {(() => {
          if (isLoading) {
            return null;
          }
          if (effectiveView === "cards") {
            // Card View
            if (data?.clients?.length) {
              return (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.clients.map((c) => (
                    <ClientCard
                      canViewFinancials={canViewFinancials}
                      client={c}
                      key={c.id}
                    />
                  ))}
                </div>
              );
            }
            return (
              <div className="rounded-lg border-2 border-dashed py-12 text-center">
                <p className="text-muted-foreground">No clients found</p>
                <Button asChild className="mt-4" size="sm" variant="outline">
                  <Link to="/app/clients/onboard">
                    <Wand2 className="mr-2 h-4 w-4" />
                    Add your first client
                  </Link>
                </Button>
              </div>
            );
          }
          // Table View
          return (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        aria-label="Select all clients"
                        checked={
                          isAllSelected ||
                          (isPartiallySelected ? "indeterminate" : false)
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Businesses</TableHead>
                    <TableHead>Workload</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Compliance
                    </TableHead>
                    {canViewFinancials ? (
                      <TableHead className="hidden xl:table-cell">
                        Financial
                      </TableHead>
                    ) : null}
                    <TableHead className="hidden md:table-cell">
                      Engagement
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.clients?.length ? (
                    data.clients.map((c) => (
                      <TableRow
                        className={isSelected(c.id) ? "bg-muted/50" : ""}
                        key={c.id}
                      >
                        <TableCell>
                          <Checkbox
                            aria-label={`Select ${c.displayName}`}
                            checked={isSelected(c.id)}
                            onCheckedChange={() => toggleSelection(c.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <Link
                            className="hover:underline"
                            params={{ clientId: c.id }}
                            to="/app/clients/$clientId"
                          >
                            {c.displayName}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {clientTypeLabels[c.type] || c.type}
                        </TableCell>
                        <TableCell>
                          <BusinessBadges businesses={c.businesses} />
                        </TableCell>
                        <TableCell>
                          <WorkloadBadge
                            activeMatterCount={c.activeMatterCount}
                            pendingMatterCount={c.pendingMatterCount}
                            totalMatterCount={c.totalMatterCount}
                          />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <ComplianceIndicator
                            amlRiskRating={c.amlRiskRating}
                            compact
                            graCompliant={c.graCompliant}
                            nisCompliant={c.nisCompliant}
                          />
                        </TableCell>
                        {canViewFinancials ? (
                          <TableCell className="hidden xl:table-cell">
                            {c.financials ? (
                              <FinancialBadge
                                overdueAmount={c.financials.overdueAmount}
                                overdueCount={c.financials.overdueCount}
                                totalOutstanding={c.financials.totalOutstanding}
                              />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        ) : null}
                        <TableCell className="hidden md:table-cell">
                          <EngagementBadge
                            lastContactDate={c.lastContactDate}
                            nextAppointmentDate={c.nextAppointmentDate}
                            upcomingAppointmentCount={
                              c.upcomingAppointmentCount
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={c.status} />
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
                                  params={{ clientId: c.id }}
                                  to="/app/clients/$clientId"
                                >
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  params={{ clientId: c.id }}
                                  search={{ edit: true }}
                                  to="/app/clients/$clientId"
                                >
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        className="h-32 text-center"
                        colSpan={canViewFinancials ? 10 : 9}
                      >
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <p>No clients found</p>
                          <Button asChild size="sm" variant="outline">
                            <Link to="/app/clients/onboard">
                              <Wand2 className="mr-2 h-4 w-4" />
                              Add your first client
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          );
        })()}

        {/* Bulk Actions Toolbar */}
        {hasSelection ? (
          <div className="mt-4">
            <BulkActionsToolbar
              entityName="clients"
              onClearSelection={clearSelection}
              selectedCount={selectedCount}
            >
              <Button
                disabled={exportMutation.isPending}
                onClick={handleBulkExport}
                size="sm"
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button
                onClick={() => setShowAssignStaffModal(true)}
                size="sm"
                variant="outline"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Staff
              </Button>
              <Button
                disabled={archiveMutation.isPending}
                onClick={handleBulkArchive}
                size="sm"
                variant="destructive"
              >
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </Button>
            </BulkActionsToolbar>
          </div>
        ) : null}

        {/* Pagination */}
        {(data?.totalPages ?? 0) > 1 ? (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Showing {(page - 1) * 20 + 1} to{" "}
              {Math.min(page * 20, data?.total ?? 0)} of {data?.total} clients
            </p>
            <div className="flex gap-2">
              <Button
                disabled={page === 1}
                onClick={() => {
                  setPage(page - 1);
                  clearSelection();
                }}
                size="sm"
                variant="outline"
              >
                Previous
              </Button>
              <Button
                disabled={page === data?.totalPages}
                onClick={() => {
                  setPage(page + 1);
                  clearSelection();
                }}
                size="sm"
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}

        {/* Assign Staff Modal */}
        <Dialog
          onOpenChange={(open) => {
            setShowAssignStaffModal(open);
            if (!open) {
              setSelectedStaffId("");
            }
          }}
          open={showAssignStaffModal}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Primary Staff</DialogTitle>
              <DialogDescription>
                Select a staff member to assign as the primary contact for{" "}
                {selectedCount} selected client{selectedCount !== 1 ? "s" : ""}.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select
                onValueChange={(value) => setSelectedStaffId(value)}
                value={selectedStaffId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffData?.staff?.map(
                    (s: {
                      id: string;
                      userName: string;
                      jobTitle: string | null;
                    }) => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex flex-col">
                          <span>{s.userName}</span>
                          {s.jobTitle ? (
                            <span className="text-muted-foreground text-xs">
                              {s.jobTitle}
                            </span>
                          ) : null}
                        </div>
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setShowAssignStaffModal(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={!selectedStaffId || assignStaffMutation.isPending}
                onClick={handleBulkAssignStaff}
              >
                {assignStaffMutation.isPending
                  ? "Assigning..."
                  : "Assign Staff"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function BusinessBadges({ businesses }: { businesses: string[] }) {
  return (
    <div className="flex gap-1">
      {businesses.includes("GCMC") ? (
        <Badge className="bg-emerald-500/10 text-emerald-600" variant="outline">
          GCMC
        </Badge>
      ) : null}
      {businesses.includes("KAJ") ? (
        <Badge className="bg-blue-500/10 text-blue-600" variant="outline">
          KAJ
        </Badge>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; label: string }> = {
    ACTIVE: {
      className: "bg-green-500/10 text-green-600 border-green-200",
      label: "Active",
    },
    INACTIVE: {
      className: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
      label: "Inactive",
    },
    ARCHIVED: {
      className: "bg-gray-500/10 text-gray-600 border-gray-200",
      label: "Archived",
    },
  };

  const variant = variants[status] || variants.ACTIVE;

  return (
    <Badge className={variant.className} variant="outline">
      {variant.label}
    </Badge>
  );
}
