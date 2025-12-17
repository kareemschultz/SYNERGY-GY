import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  Calendar,
  ChevronRight,
  ClipboardList,
  FileText,
  Loader2,
  Search,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export const Route = createFileRoute("/app/reports/")({
  component: ReportsPage,
});

// Category icons mapping
const categoryIcons: Record<string, typeof Users> = {
  CLIENT: Users,
  MATTER: ClipboardList,
  FINANCIAL: Wallet,
  DEADLINE: Calendar,
  STAFF: BarChart3,
};

// Category colors
const categoryColors: Record<string, string> = {
  CLIENT: "bg-blue-500/10 text-blue-600 border-blue-200",
  MATTER: "bg-purple-500/10 text-purple-600 border-purple-200",
  FINANCIAL: "bg-green-500/10 text-green-600 border-green-200",
  DEADLINE: "bg-orange-500/10 text-orange-600 border-orange-200",
  STAFF: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
};

type ReportFilters = {
  business?: "GCMC" | "KAJ";
  fromDate?: string;
  toDate?: string;
};

function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<{
    code: string;
    name: string;
    description: string;
  } | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({});
  const [format, setFormat] = useState<"PDF" | "EXCEL" | "CSV">("PDF");
  const [showResults, setShowResults] = useState(false);
  const [reportResults, setReportResults] = useState<{
    columns: Array<{ key: string; label: string; type?: string }>;
    data: unknown[];
    summary: Record<string, unknown>;
  } | null>(null);

  // Fetch available reports
  const {
    data: reportsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["reports", selectedCategory, searchQuery],
    queryFn: () =>
      client.reports.list({
        category:
          selectedCategory === "all"
            ? undefined
            : (selectedCategory as
                | "CLIENT"
                | "MATTER"
                | "FINANCIAL"
                | "DEADLINE"
                | "DOCUMENT"
                | "STAFF"),
        search: searchQuery || undefined,
      }),
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["report-categories"],
    queryFn: () => client.reports.categories(),
  });

  // Execute report mutation
  const executeReportMutation = useMutation({
    mutationFn: (params: {
      reportCode: string;
      format: "PDF" | "EXCEL" | "CSV";
      filters?: ReportFilters;
    }) =>
      client.reports.execute({
        reportCode: params.reportCode,
        format: params.format,
        filters: params.filters,
      }),
    onSuccess: (data) => {
      setReportResults({
        columns: data.columns,
        data: data.data as unknown[],
        summary: data.summary,
      });
      setShowResults(true);
      toast.success(`Report generated with ${data.rowCount} rows`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to execute report");
    },
  });

  // Export report mutation
  const exportReportMutation = useMutation({
    mutationFn: (params: {
      reportCode: string;
      format: "PDF" | "EXCEL" | "CSV";
      filters?: ReportFilters;
    }) =>
      client.reports.export({
        reportCode: params.reportCode,
        format: params.format,
        filters: params.filters,
      }),
    onSuccess: (data) => {
      // Convert base64 to blob and download
      const binaryString = atob(data.file);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: data.contentType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(
        `Report exported as ${data.format} (${data.rowCount} rows)`
      );
    },
    onError: (err) => {
      toast.error(err.message || "Failed to export report");
    },
  });

  const handleRunReport = () => {
    if (!selectedReport) {
      return;
    }
    executeReportMutation.mutate({
      reportCode: selectedReport.code,
      format,
      filters,
    });
  };

  const handleExportReport = (exportFormat: "PDF" | "EXCEL" | "CSV") => {
    if (!selectedReport) {
      return;
    }
    exportReportMutation.mutate({
      reportCode: selectedReport.code,
      format: exportFormat,
      filters,
    });
  };

  const formatCellValue = (value: unknown, type?: string): string => {
    if (value === null || value === undefined) {
      return "-";
    }
    if (type === "currency" && typeof value === "string") {
      return `GYD ${Number.parseFloat(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
      })}`;
    }
    if (type === "date" && value) {
      return new Date(value as string).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
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
        <p className="text-muted-foreground">Failed to load reports</p>
      </div>
    );
  }

  const reports = reportsData?.reports || [];
  const categories = categoriesData || [];

  return (
    <div className="flex flex-col">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Reports" },
        ]}
        description="Generate reports and analytics for your business data"
        title="Reports"
      />

      <div className="p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search reports..."
                    value={searchQuery}
                  />
                </div>
                <Select
                  onValueChange={setSelectedCategory}
                  value={selectedCategory}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Reports Grid */}
          {reports.length === 0 ? (
            <Card>
              <CardContent className="flex h-48 items-center justify-center">
                <p className="text-muted-foreground">No reports found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reports.map((report) => {
                const Icon = categoryIcons[report.category] || FileText;
                const colorClass =
                  categoryColors[report.category] || "bg-gray-100";

                return (
                  <Card
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    key={report.code}
                    onClick={() =>
                      setSelectedReport({
                        code: report.code,
                        name: report.name,
                        description: report.description,
                      })
                    }
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div
                          className={`rounded-lg p-2 ${colorClass.split(" ")[0]}`}
                        >
                          <Icon
                            className={`h-5 w-5 ${colorClass.split(" ")[1]}`}
                          />
                        </div>
                        <Badge className={colorClass} variant="outline">
                          {report.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-semibold">{report.name}</h3>
                      <p className="mt-1 text-muted-foreground text-sm">
                        {report.description}
                      </p>
                      <Button
                        className="mt-4 w-full"
                        size="sm"
                        variant="outline"
                      >
                        Run Report
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Report Configuration Dialog */}
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setSelectedReport(null);
            setFilters({});
            setShowResults(false);
            setReportResults(null);
          }
        }}
        open={!!selectedReport}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedReport?.name}</DialogTitle>
            <DialogDescription>{selectedReport?.description}</DialogDescription>
          </DialogHeader>

          {showResults ? (
            <>
              {/* Report Results */}
              <Tabs defaultValue="data">
                <TabsList>
                  <TabsTrigger value="data">Data</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                </TabsList>

                <TabsContent className="mt-4" value="data">
                  {reportResults && reportResults.data.length > 0 ? (
                    <div className="max-h-[400px] overflow-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {reportResults.columns.map((col) => (
                              <TableHead key={col.key}>{col.label}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(
                            reportResults.data as Record<string, unknown>[]
                          ).map((row, idx) => (
                            <TableRow key={idx}>
                              {reportResults.columns.map((col) => (
                                <TableCell key={col.key}>
                                  {formatCellValue(row[col.key], col.type)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center rounded-md border">
                      <p className="text-muted-foreground">No data found</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent className="mt-4" value="summary">
                  {reportResults?.summary && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(reportResults.summary).map(
                        ([key, value]) => (
                          <Card key={key}>
                            <CardContent className="pt-4">
                              <p className="text-muted-foreground text-sm capitalize">
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </p>
                              <p className="font-semibold text-2xl">
                                {typeof value === "number"
                                  ? value.toLocaleString()
                                  : typeof value === "object"
                                    ? JSON.stringify(value, null, 2)
                                    : String(value)}
                              </p>
                            </CardContent>
                          </Card>
                        )
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-4 flex-col gap-2 sm:flex-row sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={exportReportMutation.isPending}
                    onClick={() => handleExportReport("PDF")}
                    size="sm"
                    variant="outline"
                  >
                    {exportReportMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="mr-2 h-4 w-4" />
                    )}
                    Export PDF
                  </Button>
                  <Button
                    disabled={exportReportMutation.isPending}
                    onClick={() => handleExportReport("EXCEL")}
                    size="sm"
                    variant="outline"
                  >
                    Export Excel
                  </Button>
                  <Button
                    disabled={exportReportMutation.isPending}
                    onClick={() => handleExportReport("CSV")}
                    size="sm"
                    variant="outline"
                  >
                    Export CSV
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setShowResults(false);
                      setReportResults(null);
                    }}
                    variant="outline"
                  >
                    Back to Filters
                  </Button>
                  <Button onClick={() => setSelectedReport(null)}>Close</Button>
                </div>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Business</Label>
                    <Select
                      onValueChange={(value) =>
                        setFilters({
                          ...filters,
                          business:
                            value === "all"
                              ? undefined
                              : (value as "GCMC" | "KAJ"),
                        })
                      }
                      value={filters.business || "all"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Businesses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Businesses</SelectItem>
                        <SelectItem value="GCMC">GCMC</SelectItem>
                        <SelectItem value="KAJ">KAJ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Format</Label>
                    <Select
                      onValueChange={(value) =>
                        setFormat(value as "PDF" | "EXCEL" | "CSV")
                      }
                      value={format}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PDF">PDF</SelectItem>
                        <SelectItem value="EXCEL">Excel</SelectItem>
                        <SelectItem value="CSV">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>From Date</Label>
                    <Input
                      onChange={(e) =>
                        setFilters({ ...filters, fromDate: e.target.value })
                      }
                      type="date"
                      value={filters.fromDate || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>To Date</Label>
                    <Input
                      onChange={(e) =>
                        setFilters({ ...filters, toDate: e.target.value })
                      }
                      type="date"
                      value={filters.toDate || ""}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => setSelectedReport(null)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  disabled={executeReportMutation.isPending}
                  onClick={handleRunReport}
                >
                  {executeReportMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Run Report
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
