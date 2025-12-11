import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Archive,
  Download,
  Eye,
  File,
  FileText,
  FolderOpen,
  Image,
  Loader2,
  MoreHorizontal,
  Search,
  Upload,
} from "lucide-react";
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
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["documents", { search, category: categoryFilter, page }],
    queryFn: () =>
      client.documents.list({
        page,
        limit: 20,
        search: search || undefined,
        category:
          categoryFilter === "all"
            ? undefined
            : (categoryFilter as
                | "IDENTITY"
                | "TAX"
                | "FINANCIAL"
                | "LEGAL"
                | "IMMIGRATION"
                | "BUSINESS"
                | "CORRESPONDENCE"
                | "TRAINING"
                | "OTHER"),
        status: "ACTIVE",
      }),
  });

  const { data: stats } = useQuery({
    queryKey: ["documentStats"],
    queryFn: () => client.documents.getStats(),
  });

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
        {/* Stats Cards */}
        {stats && (
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
        <div className="mb-6 flex flex-wrap items-center gap-4">
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
              <SelectItem value="CORRESPONDENCE">Correspondence</SelectItem>
              <SelectItem value="TRAINING">Training</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
            Failed to load documents. Please try again.
          </div>
        )}

        {/* Documents Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
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
                  <TableCell className="h-32 text-center" colSpan={7}>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading documents...
                    </div>
                  </TableCell>
                </TableRow>
              ) : data?.documents && data.documents.length > 0 ? (
                data.documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getFileIcon(doc.mimeType)}
                        <span className="font-medium">{doc.originalName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <CategoryBadge category={doc.category} />
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
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
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
                  <TableCell className="h-32 text-center" colSpan={7}>
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
        {data && data.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)}{" "}
              of {data.total} documents
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

function CategoryBadge({ category }: { category: string }) {
  const variant = categoryLabels[category] || categoryLabels.OTHER;
  return (
    <Badge className={variant.className} variant="outline">
      {variant.label}
    </Badge>
  );
}
