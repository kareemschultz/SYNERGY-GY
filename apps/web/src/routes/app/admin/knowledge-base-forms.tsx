import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  Loader2,
  RefreshCw,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { client, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/app/admin/knowledge-base-forms")({
  component: KnowledgeBaseFormsPage,
});

type DownloadStatus = "downloaded" | "pending" | "failed";

type FormItem = {
  id: string;
  title: string;
  category: string;
  directPdfUrl: string | null;
  storagePath: string | null;
  fileName: string | null;
  lastDownloadError: string | null;
  agencyUrl: string | null;
};

type StatsData = {
  total: number;
  withDirectUrl: number;
  downloaded: number;
  pending: number;
  failed: number;
};

// Extracted stats dashboard component to reduce complexity
function StatsDashboard({
  stats,
  isLoading,
}: {
  stats: StatsData | undefined;
  isLoading: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Total Forms</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">
            {isLoading ? "..." : (stats?.total ?? 0)}
          </div>
          <p className="text-muted-foreground text-xs">
            {stats?.withDirectUrl ?? 0} with direct PDF URL
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Downloaded</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl text-green-600">
            {isLoading ? "..." : (stats?.downloaded ?? 0)}
          </div>
          <p className="text-muted-foreground text-xs">Ready for auto-fill</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Pending</CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl text-yellow-600">
            {isLoading ? "..." : (stats?.pending ?? 0)}
          </div>
          <p className="text-muted-foreground text-xs">
            Awaiting download or URL
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Failed</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl text-red-600">
            {isLoading ? "..." : (stats?.failed ?? 0)}
          </div>
          <p className="text-muted-foreground text-xs">
            Need manual intervention
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function KnowledgeBaseFormsPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FormItem | null>(null);
  const [newPdfUrl, setNewPdfUrl] = useState("");

  // Fetch download status statistics
  const { data: statusData, isLoading: isLoadingStatus } = useQuery({
    queryKey: ["knowledgeBase", "formDownloadStatus"],
    queryFn: () => client.knowledgeBase.getFormDownloadStatus(),
  });

  // Fetch all forms for the table
  const { data: formsData, isLoading: isLoadingForms } = useQuery({
    queryKey: ["knowledgeBase", "list", "AGENCY_FORM", categoryFilter],
    queryFn: () =>
      client.knowledgeBase.list({
        type: "AGENCY_FORM",
        category:
          categoryFilter === "all"
            ? undefined
            : (categoryFilter as
                | "GRA"
                | "NIS"
                | "IMMIGRATION"
                | "DCRA"
                | "GENERAL"),
        limit: 200,
      }),
  });

  // Download single form mutation
  const downloadSingleMutation = useMutation({
    mutationFn: (input: { id: string; forceRedownload?: boolean }) =>
      client.knowledgeBase.downloadFormFromAgency(input),
    onSuccess: (data) => {
      const result = data as {
        success: boolean;
        message?: string;
        error?: string;
      };
      if (result.success) {
        toast.success(result.message || "Form downloaded successfully");
      } else {
        toast.error(result.error || "Download failed");
      }
      queryClient.invalidateQueries({ queryKey: ["knowledgeBase"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Download all forms mutation
  const downloadAllMutation = useMutation({
    mutationFn: (input: {
      category?: string;
      skipExisting?: boolean;
      dryRun?: boolean;
    }) => {
      const categoryValue =
        input.category === "all" ? undefined : input.category;
      return client.knowledgeBase.downloadAllFormsFromAgencies({
        category: categoryValue as
          | "GRA"
          | "NIS"
          | "IMMIGRATION"
          | "DCRA"
          | "GENERAL"
          | undefined,
        skipExisting: input.skipExisting,
        dryRun: input.dryRun,
      });
    },
    onSuccess: (data) => {
      const result = data as {
        success: boolean;
        message?: string;
        downloaded?: number;
        failed?: number;
      };
      toast.success(result.message || "Download completed");
      queryClient.invalidateQueries({ queryKey: ["knowledgeBase"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Update direct PDF URL mutation
  const updateUrlMutation = useMutation({
    mutationFn: (input: { id: string; directPdfUrl: string | null }) =>
      client.knowledgeBase.updateDirectPdfUrl(input),
    onSuccess: () => {
      toast.success("PDF URL updated successfully");
      queryClient.invalidateQueries({ queryKey: ["knowledgeBase"] });
      setUrlDialogOpen(false);
      setSelectedItem(null);
      setNewPdfUrl("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const getItemStatus = (item: FormItem): DownloadStatus => {
    if (item.storagePath && item.fileName) {
      return "downloaded";
    }
    if (item.lastDownloadError) {
      return "failed";
    }
    return "pending";
  };

  const handleSetUrl = (item: FormItem) => {
    setSelectedItem(item);
    setNewPdfUrl(item.directPdfUrl || "");
    setUrlDialogOpen(true);
  };

  const handleSaveUrl = () => {
    if (!selectedItem) {
      return;
    }
    updateUrlMutation.mutate({
      id: selectedItem.id,
      directPdfUrl: newPdfUrl || null,
    });
  };

  const handleDownload = (item: FormItem) => {
    downloadSingleMutation.mutate({ id: item.id });
  };

  const handleRetry = (item: FormItem) => {
    downloadSingleMutation.mutate({ id: item.id, forceRedownload: true });
  };

  const handleDownloadAll = () => {
    downloadAllMutation.mutate({
      category: categoryFilter === "all" ? undefined : categoryFilter,
      skipExisting: true,
    });
  };

  // Filter items by status
  const filteredItems = formsData?.items?.filter((item) => {
    if (statusFilter === "all") {
      return true;
    }
    const status = getItemStatus(item as unknown as FormItem);
    return status === statusFilter;
  });

  const stats = statusData as StatsData | undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <Button
            disabled={downloadAllMutation.isPending}
            onClick={handleDownloadAll}
          >
            {downloadAllMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download All Forms
              </>
            )}
          </Button>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Admin", href: "/app/admin" },
          { label: "Knowledge Base", href: "/app/admin/knowledge-base" },
          { label: "Form Downloads" },
        ]}
        description="Download and manage government form PDFs"
        title="Form Downloads Management"
      />

      {/* Status Dashboard */}
      <StatsDashboard isLoading={isLoadingStatus} stats={stats} />

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label>Category:</Label>
          <Select onValueChange={setCategoryFilter} value={categoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="GRA">GRA</SelectItem>
              <SelectItem value="NIS">NIS</SelectItem>
              <SelectItem value="IMMIGRATION">Immigration</SelectItem>
              <SelectItem value="DCRA">DCRA</SelectItem>
              <SelectItem value="GENERAL">General</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label>Status:</Label>
          <Select onValueChange={setStatusFilter} value={statusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="downloaded">Downloaded</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Forms Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Direct PDF URL</TableHead>
              <TableHead className="w-[200px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingForms ? (
              <TableRow>
                <TableCell
                  className="text-center text-muted-foreground"
                  colSpan={5}
                >
                  Loading forms...
                </TableCell>
              </TableRow>
            ) : null}
            {!isLoadingForms &&
            (!filteredItems || filteredItems.length === 0) ? (
              <TableRow>
                <TableCell
                  className="text-center text-muted-foreground"
                  colSpan={5}
                >
                  No forms found
                </TableCell>
              </TableRow>
            ) : null}
            {!isLoadingForms && filteredItems && filteredItems.length > 0
              ? filteredItems.map((item) => {
                  const formItem = item as unknown as FormItem;
                  const status = getItemStatus(formItem);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{item.title}</span>
                          {formItem.fileName ? (
                            <span className="text-muted-foreground text-xs">
                              {formItem.fileName}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {status === "downloaded" && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Downloaded
                          </Badge>
                        )}
                        {status === "pending" && (
                          <Badge variant="secondary">
                            <Clock className="mr-1 h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                        {status === "failed" && (
                          <Badge variant="destructive">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {formItem.directPdfUrl ? (
                          <a
                            className="flex items-center gap-1 text-blue-600 text-sm hover:underline"
                            href={formItem.directPdfUrl}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View URL
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Not set
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => handleSetUrl(formItem)}
                            size="sm"
                            title="Set PDF URL"
                            variant="outline"
                          >
                            <LinkIcon className="h-4 w-4" />
                          </Button>

                          {status === "pending" && formItem.directPdfUrl && (
                            <Button
                              disabled={downloadSingleMutation.isPending}
                              onClick={() => handleDownload(formItem)}
                              size="sm"
                              title="Download"
                              variant="outline"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}

                          {status === "failed" && (
                            <Button
                              disabled={downloadSingleMutation.isPending}
                              onClick={() => handleRetry(formItem)}
                              size="sm"
                              title="Retry Download"
                              variant="outline"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}

                          {status === "pending" && !formItem.directPdfUrl && (
                            <Button
                              disabled
                              size="sm"
                              title="Upload (coming soon)"
                              variant="outline"
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              : null}
          </TableBody>
        </Table>
      </div>

      {/* Set URL Dialog */}
      <Dialog onOpenChange={setUrlDialogOpen} open={urlDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Direct PDF URL</DialogTitle>
            <DialogDescription>
              {selectedItem?.title}
              <br />
              Enter the direct URL to the PDF file for this form.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="pdfUrl">PDF URL</Label>
              <Input
                id="pdfUrl"
                onChange={(e) => setNewPdfUrl(e.target.value)}
                placeholder="https://example.gov.gy/forms/document.pdf"
                type="url"
                value={newPdfUrl}
              />
              {selectedItem?.agencyUrl ? (
                <p className="text-muted-foreground text-xs">
                  Agency website:{" "}
                  <a
                    className="text-blue-600 hover:underline"
                    href={selectedItem.agencyUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {selectedItem.agencyUrl}
                  </a>
                </p>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setUrlDialogOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button
              disabled={updateUrlMutation.isPending}
              onClick={handleSaveUrl}
            >
              {updateUrlMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save URL"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
