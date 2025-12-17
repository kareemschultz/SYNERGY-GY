import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Archive,
  Calendar,
  Download,
  Eye,
  File,
  FileText,
  Filter,
  FolderOpen,
  Image,
  Loader2,
  MoreHorizontal,
  Search,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BulkActionsToolbar } from "@/components/bulk-actions/bulk-actions-toolbar";
import { DocumentQuickView } from "@/components/documents/document-quick-view";
import { DocumentsGettingStarted } from "@/components/documents/documents-getting-started";
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

export const Route = createFileRoute("/app/documents/")({
  component: DocumentsPage,
});

const categoryLabels: Record<string, { label: string; className: string }> = {
  IDENTITY: {
    label: "Identity",
    className: "bg-purple-500/10 text-purple-600 border-purple-200",
  },
  TAX: {
    label: "Tax",
    className: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  FINANCIAL: {
    label: "Financial",
    className: "bg-green-500/10 text-green-600 border-green-200",
  },
  LEGAL: {
    label: "Legal",
    className: "bg-amber-500/10 text-amber-600 border-amber-200",
  },
  IMMIGRATION: {
    label: "Immigration",
    className: "bg-cyan-500/10 text-cyan-600 border-cyan-200",
  },
  BUSINESS: {
    label: "Business",
    className: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
  },
  CORRESPONDENCE: {
    label: "Correspondence",
    className: "bg-pink-500/10 text-pink-600 border-pink-200",
  },
  TRAINING: {
    label: "Training",
    className: "bg-orange-500/10 text-orange-600 border-orange-200",
  },
  OTHER: {
    label: "Other",
    className: "bg-gray-500/10 text-gray-600 border-gray-200",
  },
};

const categoryValues = [
  "IDENTITY",
  "TAX",
  "FINANCIAL",
  "LEGAL",
  "IMMIGRATION",
  "BUSINESS",
  "CORRESPONDENCE",
  "TRAINING",
  "OTHER",
] as const;

const fileTypeLabels: Record<string, { label: string; extensions: string[] }> =
  {
    all: { label: "All Types", extensions: [] },
    pdf: { label: "PDF Documents", extensions: ["application/pdf"] },
    image: {
      label: "Images",
      extensions: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    },
    document: {
      label: "Word Documents",
      extensions: [
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
    },
    spreadsheet: {
      label: "Spreadsheets",
      extensions: [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
    },
    other: { label: "Other", extensions: [] },
  };

const _statusValues = ["ACTIVE", "ARCHIVED", "ALL"] as const;

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return <Image className="h-4 w-4" />;
  }
  if (mimeType === "application/pdf") {
    return <FileText className="h-4 w-4 text-red-500" />;
  }
  return <File className="h-4 w-4" />;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

type DocumentType = {
  id: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  category: string;
  description?: string | null;
  tags?: string[] | null;
  status: string;
  createdAt: string;
  expirationDate?: string | null;
  client?: { id: string; displayName: string } | null;
  matter?: { id: string; title: string; referenceNumber: string } | null;
  uploadedBy?: { id: string; name: string } | null;
};

function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(
    null
  );
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const queryClient = useQueryClient();

  // Count active filters
  const activeFilterCount = [
    categoryFilter !== "all",
    fileTypeFilter !== "all",
    statusFilter !== "ACTIVE",
    dateFrom,
    dateTo,
  ].filter(Boolean).length;

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "documents",
      {
        search,
        category: categoryFilter,
        fileType: fileTypeFilter,
        status: statusFilter,
        dateFrom,
        dateTo,
        page,
      },
    ],
    queryFn: () =>
      client.documents.list({
        page,
        limit: 20,
        search: search || undefined,
        category:
          categoryFilter === "all"
            ? undefined
            : (categoryFilter as (typeof categoryValues)[number]),
        status:
          statusFilter === "ALL"
            ? undefined
            : (statusFilter as "ACTIVE" | "ARCHIVED"),
      }),
  });

  // Filter by file type client-side (since backend may not support it)
  const filteredByFileType = data?.documents?.filter((doc) => {
    if (fileTypeFilter === "all") {
      return true;
    }
    const fileType = fileTypeLabels[fileTypeFilter];
    if (!fileType) {
      return true;
    }
    if (fileTypeFilter === "other") {
      // Check if not in any defined type
      const allExtensions = Object.values(fileTypeLabels)
        .flatMap((t) => t.extensions)
        .filter(Boolean);
      return !allExtensions.includes(doc.mimeType);
    }
    return fileType.extensions.includes(doc.mimeType);
  });

  // Filter by date range client-side
  const filteredDocuments = filteredByFileType?.filter((doc) => {
    if (dateFrom) {
      const docDate = new Date(doc.createdAt);
      const fromDate = new Date(dateFrom);
      if (docDate < fromDate) {
        return false;
      }
    }
    if (dateTo) {
      const docDate = new Date(doc.createdAt);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (docDate > toDate) {
        return false;
      }
    }
    return true;
  });

  const clearAllFilters = () => {
    setCategoryFilter("all");
    setFileTypeFilter("all");
    setStatusFilter("ACTIVE");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const { data: stats } = useQuery({
    queryKey: ["documentStats"],
    queryFn: () => client.documents.getStats(),
  });

  const documents = filteredDocuments || [];
  const {
    selectedIdsArray,
    selectedCount,
    isAllSelected,
    isPartiallySelected,
    isSelected,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
  } = useSelection(documents);

  // Clear selection when filters/search/page changes
  useEffect(() => {
    clearSelection();
  }, [clearSelection]);

  const handleDownload = async (docId: string) => {
    try {
      const { downloadUrl } = await client.documents.getDownloadUrl({
        id: docId,
      });

      // Open download URL in new window
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (_error) {
      toast.error("Failed to download document");
    }
  };

  const archiveMutation = useMutation({
    mutationFn: (docId: string) => client.documents.archive({ id: docId }),
    onSuccess: () => {
      toast.success("Document archived successfully");
      // biome-ignore lint/complexity/noVoid: Auto-fix
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
      // biome-ignore lint/complexity/noVoid: Auto-fix
      void queryClient.invalidateQueries({ queryKey: ["documentStats"] });
    },
    onError: () => {
      toast.error("Failed to archive document");
    },
  });

  // Bulk archive mutation
  const bulkArchiveMutation = useMutation({
    mutationFn: (ids: string[]) => client.documents.bulk.archive({ ids }),
    onSuccess: (result) => {
      toast.success(`Archived ${result.count} document(s)`);
      // biome-ignore lint/complexity/noVoid: Auto-fix
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
      // biome-ignore lint/complexity/noVoid: Auto-fix
      void queryClient.invalidateQueries({ queryKey: ["documentStats"] });
      clearSelection();
    },
    onError: () => {
      toast.error("Failed to archive documents");
    },
  });

  // Bulk update category mutation
  const bulkUpdateCategoryMutation = useMutation({
    mutationFn: ({
      ids,
      category,
    }: {
      ids: string[];
      category: (typeof categoryValues)[number];
    }) => client.documents.bulk.updateCategory({ ids, category }),
    onSuccess: (result) => {
      toast.success(`Updated category for ${result.count} document(s)`);
      // biome-ignore lint/complexity/noVoid: Auto-fix
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
      // biome-ignore lint/complexity/noVoid: Auto-fix
      void queryClient.invalidateQueries({ queryKey: ["documentStats"] });
      clearSelection();
    },
    onError: () => {
      toast.error("Failed to update category");
    },
  });

  const handleBulkArchive = () => {
    if (selectedIdsArray.length > 0) {
      bulkArchiveMutation.mutate(selectedIdsArray);
    }
  };

  const handleBulkUpdateCategory = (
    category: (typeof categoryValues)[number]
  ) => {
    if (selectedIdsArray.length > 0) {
      bulkUpdateCategoryMutation.mutate({ ids: selectedIdsArray, category });
    }
  };

  const openQuickView = (doc: DocumentType) => {
    setSelectedDocument(doc);
    setQuickViewOpen(true);
  };

  // Show getting started guide if no documents exist at all
  const isFirstTimeUser =
    !isLoading &&
    data?.total === 0 &&
    !search &&
    categoryFilter === "all" &&
    statusFilter === "ACTIVE";

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <Button asChild>
            <Link to="/app/documents/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Link>
          </Button>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Documents" },
        ]}
        description="Manage documents and files for clients and matters"
        title="Documents"
      />

      <div className="p-6">
        {/* Getting Started Guide for First Time Users */}
        {isFirstTimeUser ? (
          <DocumentsGettingStarted />
        ) : (
          <>
            {/* Stats Cards */}
            {!!stats && (
              <div className="mb-6 grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <FolderOpen className="h-4 w-4" />
                    Total Documents
                  </div>
                  <p className="mt-1 font-semibold text-2xl">
                    {stats.totalDocuments}
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Archive className="h-4 w-4" />
                    Storage Used
                  </div>
                  <p className="mt-1 font-semibold text-2xl">
                    {formatFileSize(stats.totalSize)}
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <FileText className="h-4 w-4" />
                    Tax Documents
                  </div>
                  <p className="mt-1 font-semibold text-2xl">
                    {stats.byCategory.TAX || 0}
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <File className="h-4 w-4" />
                    Identity Documents
                  </div>
                  <p className="mt-1 font-semibold text-2xl">
                    {stats.byCategory.IDENTITY || 0}
                  </p>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative min-w-64 flex-1">
                  <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search documents by name..."
                    value={search}
                  />
                </div>

                <Select
                  onValueChange={(value) => {
                    setCategoryFilter(value);
                    setPage(1);
                  }}
                  value={categoryFilter}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="IDENTITY">Identity</SelectItem>
                    <SelectItem value="TAX">Tax</SelectItem>
                    <SelectItem value="FINANCIAL">Financial</SelectItem>
                    <SelectItem value="LEGAL">Legal</SelectItem>
                    <SelectItem value="IMMIGRATION">Immigration</SelectItem>
                    <SelectItem value="BUSINESS">Business</SelectItem>
                    <SelectItem value="CORRESPONDENCE">
                      Correspondence
                    </SelectItem>
                    <SelectItem value="TRAINING">Training</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  size="sm"
                  variant={
                    showFilters || activeFilterCount > 0
                      ? "secondary"
                      : "outline"
                  }
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge className="ml-2" variant="secondary">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>

                {activeFilterCount > 0 && (
                  <Button onClick={clearAllFilters} size="sm" variant="ghost">
                    <X className="mr-2 h-4 w-4" />
                    Clear all
                  </Button>
                )}
              </div>

              {/* Extended Filters */}
              {showFilters && (
                <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-muted/30 p-4">
                  {/* File Type Filter */}
                  <div className="space-y-2">
                    <label className="text-muted-foreground text-sm">
                      File Type
                    </label>
                    <Select
                      onValueChange={(value) => {
                        setFileTypeFilter(value);
                        setPage(1);
                      }}
                      value={fileTypeFilter}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="File type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(fileTypeLabels).map(
                          ([key, { label }]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <label className="text-muted-foreground text-sm">
                      Status
                    </label>
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
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                        <SelectItem value="ALL">All</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date From */}
                  <div className="space-y-2">
                    <label className="text-muted-foreground text-sm">
                      From Date
                    </label>
                    <div className="relative">
                      <Calendar className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="w-40 pl-10"
                        onChange={(e) => {
                          setDateFrom(e.target.value);
                          setPage(1);
                        }}
                        type="date"
                        value={dateFrom}
                      />
                    </div>
                  </div>

                  {/* Date To */}
                  <div className="space-y-2">
                    <label className="text-muted-foreground text-sm">
                      To Date
                    </label>
                    <div className="relative">
                      <Calendar className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="w-40 pl-10"
                        onChange={(e) => {
                          setDateTo(e.target.value);
                          setPage(1);
                        }}
                        type="date"
                        value={dateTo}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error state */}
            {!!error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
                Failed to load documents. Please try again.
              </div>
            )}

            {/* Documents Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        aria-label="Select all documents"
                        checked={
                          isAllSelected ||
                          (isPartiallySelected && "indeterminate")
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Matter</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell className="h-32 text-center" colSpan={9}>
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading documents...
                        </div>
                      </TableCell>
                    </TableRow>
                    // biome-ignore lint/nursery/noLeakedRender: Auto-fix
                    // biome-ignore lint/style/noNestedTernary: Auto-fix
                  ) : documents.length > 0 ? (
                    documents.map((doc) => (
                      <TableRow
                        className={`cursor-pointer transition-colors hover:bg-muted/80 ${isSelected(doc.id) ? "bg-muted/50" : ""}`}
                        key={doc.id}
                        onClick={() => openQuickView(doc as DocumentType)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            aria-label={`Select ${doc.originalName}`}
                            checked={isSelected(doc.id)}
                            onCheckedChange={() => toggleSelection(doc.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getFileIcon(doc.mimeType)}
                            <span className="font-medium">
                              {doc.originalName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <CategoryBadge category={doc.category} />
                        </TableCell>
                        <TableCell>
                          {doc.tags && doc.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {doc.tags.slice(0, 3).map((tag) => (
                                <Badge
                                  className="bg-slate-100 text-slate-700 text-xs dark:bg-slate-800 dark:text-slate-300"
                                  key={tag}
                                  variant="secondary"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {doc.tags.length > 3 && (
                                <Badge
                                  className="bg-slate-100 text-slate-500 text-xs"
                                  variant="secondary"
                                >
                                  +{doc.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {doc.client ? (
                            <Link
                              className="hover:underline"
                              params={{ clientId: doc.client.id }}
                              to="/app/clients/$clientId"
                            >
                              {doc.client.displayName}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {doc.matter ? (
                            <Link
                              className="hover:underline"
                              params={{ matterId: doc.matter.id }}
                              to="/app/matters/$matterId"
                            >
                              {doc.matter.referenceNumber}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatFileSize(doc.fileSize)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  openQuickView(doc as DocumentType)
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Quick View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDownload(doc.id)}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => archiveMutation.mutate(doc.id)}
                              >
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell className="h-32 text-center" colSpan={9}>
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <FolderOpen className="h-8 w-8" />
                          <p>No documents found</p>
                          <Button asChild size="sm" variant="outline">
                            <Link to="/app/documents/upload">
                              <Upload className="mr-2 h-4 w-4" />
                              Upload your first document
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
            {!!data && data.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  Showing {(page - 1) * 20 + 1} to{" "}
                  {Math.min(page * 20, data.total)} of {data.total} documents
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
              entityName="documents"
              onClearSelection={clearSelection}
              selectedCount={selectedCount}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    disabled={bulkUpdateCategoryMutation.isPending}
                    size="sm"
                    variant="outline"
                  >
                    {bulkUpdateCategoryMutation.isPending
                      ? "Updating..."
                      : "Change Category"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {categoryValues.map((category) => (
                    <DropdownMenuItem
                      key={category}
                      onClick={() => handleBulkUpdateCategory(category)}
                    >
                      <CategoryBadge category={category} />
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                disabled={bulkArchiveMutation.isPending}
                onClick={handleBulkArchive}
                size="sm"
                variant="destructive"
              >
                <Archive className="mr-2 h-4 w-4" />
                {bulkArchiveMutation.isPending ? "Archiving..." : "Archive"}
              </Button>
            </BulkActionsToolbar>
          </>
        )}

        {/* Document Quick View Dialog */}
        <DocumentQuickView
          document={selectedDocument}
          onOpenChange={setQuickViewOpen}
          open={quickViewOpen}
        />
      </div>
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const variant = categoryLabels[category] || categoryLabels.OTHER;
  return (
    <Badge className={variant.className} variant="outline">
      {variant.label}
    </Badge>
  );
}
