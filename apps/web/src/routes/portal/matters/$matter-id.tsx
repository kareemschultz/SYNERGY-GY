import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, Download, FileText } from "lucide-react";
import { useEffect, useState } from "react";
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
import { client as api } from "@/utils/orpc";

export const Route = createFileRoute("/portal/matters/$matter-id")({
  component: PortalMatterDetail,
});

type Matter = {
  id: string;
  referenceNumber: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
  serviceType?: string;
  notes?: string;
};

type Document = {
  id: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  category: string;
  description: string | null;
  createdAt: Date;
};

function PortalMatterDetail() {
  const navigate = useNavigate();
  const { "matter-id": matterId } = Route.useParams();

  const [matter, setMatter] = useState<Matter | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const sessionToken = localStorage.getItem("portal-session");

      if (!sessionToken) {
        await navigate({ to: "/portal/login" });
        return;
      }

      try {
        const [matterData, documentsData] = await Promise.all([
          api.portal.matters.get({ matterId }),
          api.portal.documents.list({ matterId, page: 1, limit: 50 }),
        ]);

        setMatter(matterData);
        setDocuments(documentsData.documents);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load matter details"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [matterId, navigate]);

  const handleDownload = async (documentId: string) => {
    try {
      await api.portal.documents.download.mutate({ documentId });
      toast.success("Download started");
    } catch (e: any) {
      toast.error("Download failed: " + e.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
      case "IN_PROGRESS":
        return "bg-blue-500 text-white";
      case "COMPLETED":
        return "bg-green-500 text-white";
      case "ON_HOLD":
        return "bg-yellow-500 text-white";
      case "CANCELLED":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case "URGENT":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "HIGH":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "NORMAL":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "LOW":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading matter details...</p>
      </div>
    );
  }

  if (error || !matter) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Alert className="max-w-md" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Matter not found"}</AlertDescription>
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
                Matter Details
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="mb-2 text-2xl">
                  {matter.referenceNumber}
                </CardTitle>
                <CardDescription className="text-base">
                  {matter.description}
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2">
                <Badge className={getStatusColor(matter.status)}>
                  {matter.status}
                </Badge>
                <Badge className={getPriorityColor(matter.priority)}>
                  {matter.priority}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Created
                </p>
                <p className="text-sm">
                  {new Date(matter.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Last Updated
                </p>
                <p className="text-sm">
                  {new Date(matter.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {matter.notes ? (
              <div>
                <p className="mb-2 font-medium text-muted-foreground text-sm">
                  Notes
                </p>
                <div className="rounded-md bg-slate-50 p-4 text-sm dark:bg-slate-800">
                  {matter.notes}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Documents Section */}
        <Card>
          <CardHeader>
            <CardTitle>Related Documents</CardTitle>
            <CardDescription>
              Documents associated with this matter
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>No documents found for this matter</p>
                <p className="mt-2 text-sm">
                  Documents will appear here once they are uploaded
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                    key={doc.id}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-500/50" />
                      <div>
                        <p className="font-medium">{doc.originalName}</p>
                        <p className="text-muted-foreground text-xs">
                          {doc.category} • {(doc.fileSize / 1024).toFixed(1)} KB
                          • {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDownload(doc.id)}
                      size="sm"
                      variant="ghost"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
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
