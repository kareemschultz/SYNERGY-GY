import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Download,
  FileText,
  Search,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { client, orpc } from "@/utils/orpc";

export const Route = createFileRoute("/portal/documents")({
  component: PortalDocuments,
});

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) {
    return "0 Bytes";
  }
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round(bytes / k ** i)} ${sizes[i]}`;
};

const getCategoryColor = (category: string) => {
  switch (category.toUpperCase()) {
    case "IDENTITY":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    case "TAX":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "FINANCIAL":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "LEGAL":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "IMMIGRATION":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    case "BUSINESS":
      return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  }
};

function PortalDocuments() {
  const _navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("ALL");
  const [_status, _setStatus] = useState<string>("ALL");

  const { data, isLoading, error } = useQuery(
    orpc.portal.documents.list.queryOptions({
      input: { page: 1, limit: 50 },
    })
  );

  const { data: matters } = useQuery(
    orpc.portal.matters.list.queryOptions({
      input: { page: 1, limit: 100 },
    })
  );

  const handleDownload = async (documentId: string) => {
    try {
      const result = await client.portal.documents.download({ documentId });
      // In a real app, this would be a signed URL
      // For now, let's assume we can navigate to download endpoint or simulate it
      toast.success(`Download started for ${result.fileName}`);
      // window.open(result.downloadUrl, '_blank');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast.error(`Download failed: ${message}`);
    }
  };

  const filteredDocuments = data?.documents.filter((doc) => {
    if (category !== "ALL" && doc.category !== category) {
      return false;
    }
    if (
      search &&
      !doc.originalName.toLowerCase().includes(search.toLowerCase()) &&
      !doc.description?.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading documents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Alert className="max-w-md" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-slate-200 border-b bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/portal">
              <Button size="sm" variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="font-bold text-2xl text-slate-900 dark:text-white">
                Your Documents
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-6xl px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <CardTitle>Document Library</CardTitle>
                <CardDescription>
                  All documents associated with your matters
                </CardDescription>
              </div>
              {/* <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download All (ZIP)
                </Button> */}
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search documents..."
                  value={search}
                />
              </div>
              <Select onValueChange={setCategory} value={category}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  <SelectItem value="IDENTITY">Identity</SelectItem>
                  <SelectItem value="TAX">Tax</SelectItem>
                  <SelectItem value="FINANCIAL">Financial</SelectItem>
                  <SelectItem value="LEGAL">Legal</SelectItem>
                  <SelectItem value="IMMIGRATION">Immigration</SelectItem>
                  <SelectItem value="BUSINESS">Business</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!filteredDocuments || filteredDocuments.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed bg-muted/10 py-12 text-center text-muted-foreground">
                <FileText className="mx-auto mb-4 h-16 w-16 opacity-50" />
                <p className="font-medium text-lg">No documents found</p>
                <p className="mt-2 text-sm">
                  Try adjusting your filters or search terms
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDocuments.map((doc) => (
                  <div
                    className="rounded-lg border bg-white p-4 transition-colors hover:bg-slate-50 dark:bg-transparent dark:hover:bg-slate-800"
                    key={doc.id}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex flex-1 items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <h3 className="truncate font-medium text-sm">
                              {doc.originalName}
                            </h3>
                            <Badge
                              className={getCategoryColor(doc.category)}
                              variant="outline"
                            >
                              {doc.category}
                            </Badge>
                            {doc.matterId && (
                              <Badge className="text-xs" variant="secondary">
                                Matter Linked
                              </Badge>
                            )}
                          </div>
                          {doc.description ? (
                            <p className="mb-2 text-muted-foreground text-sm">
                              {doc.description}
                            </p>
                          ) : null}
                          <div className="flex items-center gap-4 text-muted-foreground text-xs">
                            <span>{formatFileSize(doc.fileSize)}</span>
                            <span>•</span>
                            <span>
                              Uploaded on{" "}
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleDownload(doc.id)}
                        size="sm"
                        variant="outline"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
