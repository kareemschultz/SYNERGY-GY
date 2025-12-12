import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { client as api } from "@/utils/orpc";

export const Route = createFileRoute("/portal/financials")({
  component: PortalFinancials,
});

type FinancialSummary = {
  totalInvoiced: string;
  totalPaid: string;
  totalOutstanding: string;
  totalOverdue: string;
  overdueCount: number;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  business: string;
  invoiceDate: string;
  dueDate: string;
  status: string;
  totalAmount: string;
  amountPaid: string;
  amountDue: string;
  paidDate: string | null;
};

const statusLabels: Record<string, { label: string; className: string }> = {
  SENT: { label: "Sent", className: "bg-blue-100 text-blue-700" },
  PAID: { label: "Paid", className: "bg-green-100 text-green-700" },
  OVERDUE: { label: "Overdue", className: "bg-red-100 text-red-700" },
};

function formatCurrency(amount: string): string {
  return `GYD ${Number.parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function PortalFinancials() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    async function loadFinancials() {
      const sessionToken = localStorage.getItem("portal-session");

      if (!sessionToken) {
        await navigate({ to: "/portal/login" });
        return;
      }

      try {
        const [summaryData, invoicesData] = await Promise.all([
          api.portal.financials.summary(),
          api.portal.financials.invoices({ limit: 50 }),
        ]);

        setSummary(summaryData);
        setInvoices(invoicesData.invoices);
      } catch (_err) {
        setError("Failed to load financial information. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadFinancials();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.portal.auth.logout();
    } catch (_err) {
      // Ignore error
    } finally {
      localStorage.removeItem("portal-session");
      localStorage.removeItem("portal-user");
      await navigate({ to: "/portal/login" });
    }
  };

  const filteredInvoices =
    statusFilter === "all"
      ? invoices
      : invoices.filter((inv) => inv.status === statusFilter);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Alert className="max-w-md" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-slate-200 border-b bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild size="sm" variant="ghost">
                <Link to="/portal">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="font-bold text-slate-900 text-xl dark:text-white">
                  My Financials
                </h1>
              </div>
            </div>
            <Button onClick={handleLogout} size="sm" variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-medium text-sm">
                  Total Invoiced
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {formatCurrency(summary?.totalInvoiced || "0")}
                </div>
                <p className="text-muted-foreground text-xs">All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-medium text-sm">
                  Total Paid
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl text-green-600">
                  {formatCurrency(summary?.totalPaid || "0")}
                </div>
                <p className="text-muted-foreground text-xs">
                  Payments received
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-medium text-sm">
                  Outstanding
                </CardTitle>
                <Calendar className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl text-amber-600">
                  {formatCurrency(summary?.totalOutstanding || "0")}
                </div>
                <p className="text-muted-foreground text-xs">Amount due</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-medium text-sm">Overdue</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl text-red-600">
                  {formatCurrency(summary?.totalOverdue || "0")}
                </div>
                <p className="text-muted-foreground text-xs">
                  {summary?.overdueCount || 0} invoice(s)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Invoices */}
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>View your invoice history</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filter Tabs */}
              <Tabs
                className="mb-4"
                onValueChange={setStatusFilter}
                value={statusFilter}
              >
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="SENT">Pending</TabsTrigger>
                  <TabsTrigger value="OVERDUE">Overdue</TabsTrigger>
                  <TabsTrigger value="PAID">Paid</TabsTrigger>
                </TabsList>
              </Tabs>

              {filteredInvoices.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>No invoices found</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => {
                        const statusConfig = statusLabels[invoice.status] || {
                          label: invoice.status,
                          className: "",
                        };
                        return (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium font-mono">
                              {invoice.invoiceNumber}
                            </TableCell>
                            <TableCell>
                              {formatDate(invoice.invoiceDate)}
                            </TableCell>
                            <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {formatCurrency(invoice.totalAmount)}
                                </span>
                                {Number.parseFloat(invoice.amountDue) > 0 && (
                                  <span className="text-muted-foreground text-xs">
                                    Due: {formatCurrency(invoice.amountDue)}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={statusConfig.className}>
                                {statusConfig.label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
