import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react";
import { useState } from "react";
import { AgingReport } from "@/components/invoices/aging-report";
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

function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [businessFilter, setBusinessFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [showAgingReport, setShowAgingReport] = useState(false);
  const [agingBusinessFilter, setAgingBusinessFilter] = useState<
    "GCMC" | "KAJ" | undefined
  >(undefined);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "invoices",
      { search, status: statusFilter, business: businessFilter, page },
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
      }),
  });

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
        </div>

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
                  <TableCell className="text-center" colSpan={8}>
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                      <span className="text-muted-foreground">
                        Loading invoices...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
                // biome-ignore lint/style/noNestedTernary: Auto-fix
              ) : data?.invoices.length === 0 ? (
                <TableRow>
                  <TableCell className="text-center" colSpan={8}>
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
                data?.invoices.map((invoice) => {
                  const statusConfig = statusLabels[invoice.status];
                  return (
                    <TableRow key={invoice.id}>
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
              Showing {data.invoices.length} of {data.total} invoices
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
      </div>
    </div>
  );
}
