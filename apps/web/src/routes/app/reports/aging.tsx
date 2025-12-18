import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Clock,
  DollarSign,
  Download,
  Loader2,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/app/reports/aging")({
  component: AgingReportPage,
});

type Business = "GCMC" | "KAJ" | undefined;

function formatCurrency(amount: string): string {
  return `GYD ${Number.parseFloat(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
  })}`;
}

// Bucket configuration
const bucketConfig = {
  current: {
    label: "Current",
    description: "Not yet due",
    color: "bg-green-500",
    textColor: "text-green-600",
    bgLight: "bg-green-500/10",
  },
  days30: {
    label: "1-30 Days",
    description: "1-30 days overdue",
    color: "bg-yellow-500",
    textColor: "text-yellow-600",
    bgLight: "bg-yellow-500/10",
  },
  days60: {
    label: "31-60 Days",
    description: "31-60 days overdue",
    color: "bg-orange-500",
    textColor: "text-orange-600",
    bgLight: "bg-orange-500/10",
  },
  days90: {
    label: "61-90 Days",
    description: "61-90 days overdue",
    color: "bg-red-400",
    textColor: "text-red-500",
    bgLight: "bg-red-400/10",
  },
  days90Plus: {
    label: "90+ Days",
    description: "Over 90 days overdue",
    color: "bg-red-600",
    textColor: "text-red-700",
    bgLight: "bg-red-600/10",
  },
};

function AgingReportPage() {
  const [business, setBusiness] = useState<Business>(undefined);

  // Fetch aging report data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["invoices", "agingReport", { business }],
    queryFn: () => client.invoices.getAgingReport({ business }),
  });

  // Fetch detailed invoice list for drill-down
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices", "outstanding", { business }],
    queryFn: () =>
      client.invoices.list({
        business,
        status: "OVERDUE",
        page: 1,
        limit: 100,
        sortBy: "dueDate",
        sortOrder: "asc",
      }),
  });

  const handleExportCSV = () => {
    if (!data) return;

    const rows = [
      ["Aging Category", "Amount (GYD)", "Invoice Count"],
      ["Current (Not Due)", data.current.amount, data.current.count.toString()],
      ["1-30 Days Overdue", data.days30.amount, data.days30.count.toString()],
      ["31-60 Days Overdue", data.days60.amount, data.days60.count.toString()],
      ["61-90 Days Overdue", data.days90.amount, data.days90.count.toString()],
      [
        "90+ Days Overdue",
        data.days90Plus.amount,
        data.days90Plus.count.toString(),
      ],
      ["Total", data.total.amount, data.total.count.toString()],
    ];

    const csvContent = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `aging-report-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-muted-foreground">Failed to load aging report</p>
        <Button onClick={() => refetch()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const totalAmount = Number.parseFloat(data.total.amount);
  const overdueAmount =
    Number.parseFloat(data.days30.amount) +
    Number.parseFloat(data.days60.amount) +
    Number.parseFloat(data.days90.amount) +
    Number.parseFloat(data.days90Plus.amount);

  const buckets = [
    { key: "current", ...bucketConfig.current, ...data.current },
    { key: "days30", ...bucketConfig.days30, ...data.days30 },
    { key: "days60", ...bucketConfig.days60, ...data.days60 },
    { key: "days90", ...bucketConfig.days90, ...data.days90 },
    { key: "days90Plus", ...bucketConfig.days90Plus, ...data.days90Plus },
  ];

  const invoices = invoicesData?.invoices ?? [];

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <div className="flex items-center gap-2">
            <Select
              onValueChange={(v) =>
                setBusiness(v === "all" ? undefined : (v as Business))
              }
              value={business || "all"}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Businesses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Businesses</SelectItem>
                <SelectItem value="GCMC">GCMC</SelectItem>
                <SelectItem value="KAJ">KAJ</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Reports", href: "/app/reports" },
          { label: "Invoice Aging" },
        ]}
        description="Track outstanding invoices by age category"
        title="Invoice Aging Report"
      />

      <div className="space-y-6 p-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Total Outstanding
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {formatCurrency(data.total.amount)}
              </div>
              <p className="text-muted-foreground text-xs">
                {data.total.count} invoice(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Current (Not Due)
              </CardTitle>
              <Clock className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl text-green-600">
                {formatCurrency(data.current.amount)}
              </div>
              <p className="text-muted-foreground text-xs">
                {data.current.count} invoice(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Total Overdue
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl text-red-600">
                {formatCurrency(overdueAmount.toFixed(2))}
              </div>
              <p className="text-muted-foreground text-xs">
                {data.days30.count +
                  data.days60.count +
                  data.days90.count +
                  data.days90Plus.count}{" "}
                invoice(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                90+ Days Critical
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-red-700" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl text-red-700">
                {formatCurrency(data.days90Plus.amount)}
              </div>
              <p className="text-muted-foreground text-xs">
                {data.days90Plus.count} invoice(s) require immediate attention
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="breakdown">
          <TabsList>
            <TabsTrigger value="breakdown">Aging Breakdown</TabsTrigger>
            <TabsTrigger value="invoices">
              Invoice Details ({invoices.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent className="mt-6" value="breakdown">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Aging Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Aging Bars */}
                <div className="space-y-4">
                  {buckets.map((bucket) => {
                    const amount = Number.parseFloat(bucket.amount);
                    const percentage =
                      totalAmount > 0 ? (amount / totalAmount) * 100 : 0;

                    return (
                      <div className="space-y-2" key={bucket.key}>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-3 w-3 rounded-full ${bucket.color}`}
                            />
                            <span className="font-medium">{bucket.label}</span>
                            <span className="text-muted-foreground">
                              ({bucket.description})
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant="outline">{bucket.count} inv.</Badge>
                            <span
                              className={`font-semibold ${bucket.textColor}`}
                            >
                              {formatCurrency(bucket.amount)}
                            </span>
                            <span className="w-12 text-right text-muted-foreground">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className={`h-full ${bucket.color} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Visual Distribution Bar */}
                {totalAmount > 0 && (
                  <div className="space-y-2 pt-4">
                    <h4 className="font-medium text-sm">
                      Distribution Overview
                    </h4>
                    <div className="flex h-10 overflow-hidden rounded-lg">
                      {buckets.map((bucket) => {
                        const amount = Number.parseFloat(bucket.amount);
                        const percentage =
                          totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
                        if (percentage === 0) return null;
                        return (
                          <div
                            className={`${bucket.color} flex items-center justify-center font-medium text-white text-xs transition-all`}
                            key={bucket.key}
                            style={{ width: `${percentage}%` }}
                            title={`${bucket.label}: ${formatCurrency(bucket.amount)} (${percentage.toFixed(1)}%)`}
                          >
                            {percentage >= 8 && `${percentage.toFixed(0)}%`}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs">
                      {buckets.map((bucket) => (
                        <div
                          className="flex items-center gap-1"
                          key={bucket.key}
                        >
                          <div
                            className={`h-2 w-2 rounded-full ${bucket.color}`}
                          />
                          <span className="text-muted-foreground">
                            {bucket.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Outstanding */}
                {totalAmount === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <TrendingUp className="mb-4 h-16 w-16 text-green-500 opacity-50" />
                    <p className="font-semibold text-green-600 text-lg">
                      All caught up!
                    </p>
                    <p className="text-muted-foreground">
                      No outstanding invoices to display
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="mt-6" value="invoices">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Overdue Invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
                    <TrendingUp className="mb-2 h-8 w-8 opacity-50" />
                    <p>No overdue invoices</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Days Overdue</TableHead>
                          <TableHead className="text-right">
                            Amount Due
                          </TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((invoice) => {
                          const dueDate = new Date(invoice.dueDate);
                          const today = new Date();
                          const daysOverdue = Math.floor(
                            (today.getTime() - dueDate.getTime()) /
                              (1000 * 60 * 60 * 24)
                          );

                          let urgencyClass = "text-yellow-600";
                          if (daysOverdue > 90) {
                            urgencyClass = "text-red-700 font-semibold";
                          } else if (daysOverdue > 60) {
                            urgencyClass = "text-red-500";
                          } else if (daysOverdue > 30) {
                            urgencyClass = "text-orange-500";
                          }

                          return (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium">
                                {invoice.invoiceNumber}
                              </TableCell>
                              <TableCell>
                                {invoice.client?.displayName || "-"}
                              </TableCell>
                              <TableCell>
                                {dueDate.toLocaleDateString()}
                              </TableCell>
                              <TableCell className={urgencyClass}>
                                {daysOverdue > 0
                                  ? `${daysOverdue} days`
                                  : "Due today"}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(invoice.amountDue)}
                              </TableCell>
                              <TableCell>
                                <Button asChild size="sm" variant="ghost">
                                  <Link
                                    params={{ invoiceId: invoice.id }}
                                    to="/app/invoices/$invoiceId"
                                  >
                                    <ArrowRight className="h-4 w-4" />
                                  </Link>
                                </Button>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
