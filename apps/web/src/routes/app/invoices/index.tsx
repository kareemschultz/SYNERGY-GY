import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  FileText,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BulkActionsToolbar } from "@/components/bulk-actions/bulk-actions-toolbar";
import { AgingReport } from "@/components/invoices/aging-report";
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
import { client } from "@/utils/orpc";

// Sort options for invoices
const sortOptions = [
  { value: "invoiceDate", label: "Invoice Date" },
  { value: "dueDate", label: "Due Date" },
  { value: "invoiceNumber", label: "Invoice #" },
  { value: "totalAmount", label: "Amount" },
  { value: "status", label: "Status" },
] as const;

export const Route = createFileRoute("/app/invoices/")({
  component: InvoicesPage,
});

const statusLabels: Record<string, { label: string; className: string }> = {
  DRAFT: {
    label: "Draft",
    className: "bg-gray-500/10 text-gray-600 border-gray-200",
  },
  SENT: {
    label: "Sent",
    className: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  PAID: {
    label: "Paid",
    className: "bg-green-500/10 text-green-600 border-green-200",
  },
  OVERDUE: {
    label: "Overdue",
    className: "bg-red-500/10 text-red-600 border-red-200",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-gray-500/10 text-gray-600 border-gray-200",
  },
};

function formatCurrency(amount: string): string {
  return Number.parseFloat(amount).toFixed(2);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Invoice list page manages filters, bulk actions, aging report toggle, status badges, and payment tracking
function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [businessFilter, setBusinessFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("invoiceDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [showAgingReport, setShowAgingReport] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [agingBusinessFilter, setAgingBusinessFilter] = useState<
    "GCMC" | "KAJ" | undefined
  >(undefined);

  const queryClient = useQueryClient();

  // Fetch clients for filter dropdown
  const { data: clientsData } = useQuery({
    queryKey: ["clients", "forFilter"],
    queryFn: () =>
      client.clients.list({
        limit: 100,
        status: "ACTIVE",
        sortBy: "displayName",
        sortOrder: "asc",
      }),
    staleTime: 60_000,
  });

  // Fetch invoice summary stats
  const { data: summaryData } = useQuery({
    queryKey: [
      "invoices",
      "summary",
      { business: businessFilter === "all" ? undefined : businessFilter },
    ],
    queryFn: () => client.invoices.getSummary(),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "invoices",
      {
        search,
        status: statusFilter,
        business: businessFilter,
        clientId: clientFilter,
        fromDate,
        toDate,
        sortBy,
        sortOrder,
        page,
      },
    ],
    queryFn: () =>
      client.invoices.list({
        page,
        limit: 20,
        search: search || undefined,
        status:
          statusFilter === "all"
            ? undefined
            : (statusFilter as
                | "DRAFT"
                | "SENT"
                | "PAID"
                | "OVERDUE"
                | "CANCELLED"),
        business:
          businessFilter === "all"
            ? undefined
            : (businessFilter as "GCMC" | "KAJ"),
        clientId: clientFilter === "all" ? undefined : clientFilter,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        sortBy: sortBy as
          | "invoiceNumber"
          | "invoiceDate"
          | "dueDate"
          | "totalAmount"
          | "status",
        sortOrder,
      }),
  });

  // Count active filters
  const activeFilterCount = [clientFilter !== "all", fromDate, toDate].filter(
    Boolean
  ).length;

  const invoices = data?.invoices || [];
  const {
    selectedIdsArray,
    selectedCount,
    isAllSelected,
    isPartiallySelected,
    isSelected,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
  } = useSelection(invoices);

  // Clear selection when filters/search/page changes
  useEffect(() => {
    clearSelection();
  }, [clearSelection]);

  // Bulk export mutation
  const exportMutation = useMutation({
    mutationFn: (ids: string[]) => client.invoices.bulk.export({ ids }),
    onSuccess: (result) => {
      // Download CSV file
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(link.href);

      toast.success(`Exported ${result.exportedCount} invoice(s) to CSV`);
      clearSelection();
    },
    onError: () => {
      toast.error("Failed to export invoices");
    },
  });

  // Bulk mark as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: (ids: string[]) => client.invoices.bulk.markAsPaid({ ids }),
    onSuccess: (result) => {
      toast.success(`Marked ${result.updatedCount} invoice(s) as paid`);
      clearSelection();
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: () => {
      toast.error("Failed to mark invoices as paid");
    },
  });

  const handleExport = () => {
    if (selectedIdsArray.length > 0) {
      exportMutation.mutate(selectedIdsArray);
    }
  };

  const handleMarkAsPaid = () => {
    if (selectedIdsArray.length > 0) {
      markAsPaidMutation.mutate(selectedIdsArray);
    }
  };

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <Button asChild>
            <Link to="/app/invoices/new">
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Link>
          </Button>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Invoices" },
        ]}
        description="Manage invoices and billing for both businesses"
        title="Invoices"
      />

      <div className="p-6">
        {/* Summary Stats Cards */}
        {summaryData ? (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              icon={FileText}
              label="Total Invoices"
              value={String(summaryData.totalInvoices ?? 0)}
            />
            <SummaryCard
              className="text-green-600"
              icon={CheckCircle2}
              label="Total Revenue"
              value={`GYD ${formatCurrency(summaryData.totalRevenue ?? "0")}`}
            />
            <SummaryCard
              className="text-yellow-600"
              icon={Clock}
              label="Outstanding"
              value={`GYD ${formatCurrency(summaryData.totalOutstanding ?? "0")}`}
            />
            <SummaryCard
              className="text-red-600"
              icon={Calendar}
              label="Overdue"
              value={`GYD ${formatCurrency(summaryData.totalOverdue ?? "0")}`}
            />
          </div>
        ) : null}

        {/* Main Filters Row */}
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="relative min-w-64 flex-1">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by invoice number or client..."
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
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SENT">Sent</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Dropdown */}
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

          {/* Sort Order Toggle */}
          <Button
            className="px-3"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            size="icon"
            title={sortOrder === "asc" ? "Ascending" : "Descending"}
            variant="outline"
          >
            {sortOrder === "asc" ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {/* Advanced Filters Toggle */}
          <Button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            variant={activeFilterCount > 0 ? "secondary" : "outline"}
          >
            <ChevronDown
              className={`mr-2 h-4 w-4 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`}
            />
            More Filters
            {activeFilterCount > 0 ? (
              <Badge className="ml-2" variant="secondary">
                {activeFilterCount}
              </Badge>
            ) : null}
          </Button>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters ? (
          <div className="mb-6 rounded-lg border bg-muted/30 p-4">
            <div className="flex flex-wrap items-end gap-4">
              {/* Client Filter */}
              <div className="min-w-48 space-y-2">
                <span className="block font-medium text-sm">Client</span>
                <Select
                  onValueChange={(value) => {
                    setClientFilter(value);
                    setPage(1);
                  }}
                  value={clientFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clientsData?.clients?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <span className="block font-medium text-sm">From Date</span>
                <Input
                  className="w-40"
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setPage(1);
                  }}
                  type="date"
                  value={fromDate}
                />
              </div>

              <div className="space-y-2">
                <span className="block font-medium text-sm">To Date</span>
                <Input
                  className="w-40"
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setPage(1);
                  }}
                  type="date"
                  value={toDate}
                />
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 ? (
                <Button
                  onClick={() => {
                    setClientFilter("all");
                    setFromDate("");
                    setToDate("");
                    setPage(1);
                  }}
                  variant="ghost"
                >
                  Clear Filters
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Aging Report Toggle */}
        <div className="mb-6">
          <Button
            className="w-full justify-between"
            onClick={() => setShowAgingReport(!showAgingReport)}
            variant="outline"
          >
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Accounts Receivable Aging Report
            </span>
            {showAgingReport ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          {showAgingReport ? (
            <div className="mt-4">
              <AgingReport
                business={agingBusinessFilter}
                onBusinessChange={(value) =>
                  setAgingBusinessFilter(
                    value === "all" ? undefined : (value as "GCMC" | "KAJ")
                  )
                }
              />
            </div>
          ) : null}
        </div>

        {/* Error state */}
        {!!error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
            Failed to load invoices. Please try again.
          </div>
        )}

        {/* Invoices Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    aria-label="Select all invoices"
                    checked={
                      isAllSelected ||
                      (isPartiallySelected === true && "indeterminate")
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell className="text-center" colSpan={9}>
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                      <span className="text-muted-foreground">
                        Loading invoices...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
                // biome-ignore lint/style/noNestedTernary: Auto-fix
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell className="text-center" colSpan={9}>
                    <div className="flex flex-col items-center justify-center py-12">
                      <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="mb-2 font-semibold text-lg">
                        No invoices found
                      </h3>
                      <p className="mb-4 text-muted-foreground text-sm">
                        {search ||
                        statusFilter !== "all" ||
                        businessFilter !== "all"
                          ? "Try adjusting your filters to find what you're looking for."
                          : "Get started by creating your first invoice."}
                      </p>
                      {!search &&
                        statusFilter === "all" &&
                        businessFilter === "all" && (
                          <Button asChild>
                            <Link to="/app/invoices/new">
                              <Plus className="mr-2 h-4 w-4" />
                              Create Invoice
                            </Link>
                          </Button>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => {
                  const statusConfig = statusLabels[invoice.status];
                  return (
                    <TableRow
                      className={isSelected(invoice.id) ? "bg-muted/50" : ""}
                      key={invoice.id}
                    >
                      <TableCell>
                        <Checkbox
                          aria-label={`Select ${invoice.invoiceNumber}`}
                          checked={isSelected(invoice.id)}
                          onCheckedChange={() => toggleSelection(invoice.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link
                          className="hover:underline"
                          params={{ invoiceId: invoice.id }}
                          to="/app/invoices/$invoiceId"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {invoice.client.displayName}
                          </span>
                          {!!invoice.matter && (
                            <span className="text-muted-foreground text-xs">
                              {invoice.matter.referenceNumber}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{invoice.business}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-muted-foreground text-sm">
                          <Calendar className="mr-1.5 h-3.5 w-3.5" />
                          {formatDate(invoice.invoiceDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-muted-foreground text-sm">
                          <Calendar className="mr-1.5 h-3.5 w-3.5" />
                          {formatDate(invoice.dueDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            GYD {formatCurrency(invoice.totalAmount)}
                          </span>
                          {Number.parseFloat(invoice.amountDue) > 0 && (
                            <span className="text-muted-foreground text-xs">
                              Due: GYD {formatCurrency(invoice.amountDue)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={statusConfig.className}
                          variant="outline"
                        >
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                params={{ invoiceId: invoice.id }}
                                to="/app/invoices/$invoiceId"
                              >
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                params={{ clientId: invoice.clientId }}
                                to="/app/clients/$clientId"
                              >
                                View Client
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!!data && (data.totalPages ?? 1) > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Showing {invoices.length} of {data.total} invoices
            </p>
            <div className="flex gap-2">
              <Button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                variant="outline"
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  Page {page} of {data.totalPages ?? 1}
                </span>
              </div>
              <Button
                disabled={page >= (data.totalPages ?? 1)}
                onClick={() => setPage((p) => p + 1)}
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Bulk Actions Toolbar */}
        <BulkActionsToolbar
          entityName="invoices"
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
          <Button
            disabled={markAsPaidMutation.isPending}
            onClick={handleMarkAsPaid}
            size="sm"
            variant="default"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {markAsPaidMutation.isPending ? "Updating..." : "Mark as Paid"}
          </Button>
        </BulkActionsToolbar>
      </div>
    </div>
  );
}

// Summary card component for stats display
type SummaryCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  className?: string;
};

function SummaryCard({
  icon: Icon,
  label,
  value,
  className,
}: SummaryCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-muted p-2">
          <Icon className={`h-4 w-4 ${className ?? "text-muted-foreground"}`} />
        </div>
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className={`font-semibold text-lg ${className ?? ""}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}
