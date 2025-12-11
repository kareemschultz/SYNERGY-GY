import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, Download, FileText } from "lucide-react";
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
import { client as api } from "@/utils/orpc";

export const Route = createFileRoute("/portal/documents")({
  component: PortalDocuments,
});

type Document = {
  id: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  category: string;
  description: string | null;
  matterId: string | null;
  createdAt: Date;
};

function PortalDocuments() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDocuments() {
      const sessionToken = localStorage.getItem("portal-session");

      if (!sessionToken) {
        await navigate({ to: "/portal/login" });
        return;
      }

      try {
        const result = await api.portal.documents.list({
          page: 1,
          limit: 50,
        });
        setDocuments(result.documents);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load documents"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadDocuments();
  }, [navigate]);

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

  const handleDownload = (_documentId: string, _fileName: string) => {
    // TODO: Implement actual download
    // const result = await api.portal.documents.download({ documentId });
    // For now, do nothing - download functionality to be implemented
  };

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
            <CardTitle>Document Library</CardTitle>
            <CardDescription>
              All documents associated with your matters
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <FileText className="mx-auto mb-4 h-16 w-16 opacity-50" />
                <p className="font-medium text-lg">No documents found</p>
                <p className="mt-2 text-sm">
                  Documents will appear here once they are uploaded to your
                  matters
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    className="rounded-lg border p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                    key={doc.id}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex flex-1 items-start gap-3">
                        <FileText className="mt-0.5 h-5 w-5 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h3 className="truncate font-medium text-sm">
                              {doc.originalName}
                            </h3>
                            <Badge className={getCategoryColor(doc.category)}>
                              {doc.category}
                            </Badge>
                          </div>
                          {doc.description ? (
                            <p className="mb-2 text-muted-foreground text-sm">
                              {doc.description}
                            </p>
                          ) : null}
                          <div className="flex items-center gap-4 text-muted-foreground text-xs">
                            <span>{formatFileSize(doc.fileSize)}</span>
                            <span>
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleDownload(doc.id, doc.originalName)}
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
