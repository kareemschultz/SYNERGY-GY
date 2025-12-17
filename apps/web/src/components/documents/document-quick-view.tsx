import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Archive,
  Calendar,
  Download,
  ExternalLink,
  File,
  FileText,
  FolderOpen,
  Image,
  Loader2,
  Tag,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { client } from "@/utils/orpc";

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

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return <Image className="h-6 w-6 text-blue-500" />;
  }
  if (mimeType === "application/pdf") {
    return <FileText className="h-6 w-6 text-red-500" />;
  }
  if (mimeType.includes("word") || mimeType.includes("document")) {
    return <FileText className="h-6 w-6 text-blue-600" />;
  }
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) {
    return <FileText className="h-6 w-6 text-green-600" />;
  }
  return <File className="h-6 w-6 text-muted-foreground" />;
}

type Document = {
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

type DocumentQuickViewProps = {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArchive?: () => void;
};

export function DocumentQuickView({
  document,
  open,
  onOpenChange,
  onArchive,
}: DocumentQuickViewProps) {
  const queryClient = useQueryClient();

  const archiveMutation = useMutation({
    mutationFn: (docId: string) => client.documents.archive({ id: docId }),
    onSuccess: () => {
      toast.success("Document archived");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      onOpenChange(false);
      onArchive?.();
    },
    onError: () => {
      toast.error("Failed to archive document");
    },
  });

  const handleDownload = async () => {
    if (!document) return;
    try {
      const { downloadUrl } = await client.documents.getDownloadUrl({
        id: document.id,
      });
      const link = window.document.createElement("a");
      link.href = downloadUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch {
      toast.error("Failed to download document");
    }
  };

  if (!document) return null;

  const categoryInfo =
    categoryLabels[document.category] || categoryLabels.OTHER;
  const isExpiringSoon =
    document.expirationDate &&
    new Date(document.expirationDate) <
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const isExpired =
    document.expirationDate && new Date(document.expirationDate) < new Date();

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              {getFileIcon(document.mimeType)}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-left">
                {document.originalName}
              </DialogTitle>
              <DialogDescription className="text-left">
                {formatFileSize(document.fileSize)} &bull;{" "}
                {document.mimeType.split("/")[1]?.toUpperCase() || "FILE"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <div className="space-y-4">
          {/* Category & Status */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={categoryInfo.className} variant="outline">
              {categoryInfo.label}
            </Badge>
            {document.status === "ARCHIVED" && (
              <Badge variant="secondary">Archived</Badge>
            )}
            {isExpired && <Badge variant="destructive">Expired</Badge>}
            {isExpiringSoon && !isExpired && (
              <Badge
                className="border-amber-200 bg-amber-500/10 text-amber-600"
                variant="outline"
              >
                Expiring Soon
              </Badge>
            )}
          </div>

          {/* Tags */}
          {document.tags && document.tags.length > 0 && (
            <div className="flex items-start gap-3">
              <Tag className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="mb-1 text-muted-foreground text-xs">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {document.tags.map((tag) => (
                    <Badge
                      className="bg-slate-100 text-slate-700 text-xs dark:bg-slate-800 dark:text-slate-300"
                      key={tag}
                      variant="secondary"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {document.description && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm">{document.description}</p>
            </div>
          )}

          {/* Details Grid */}
          <div className="space-y-3">
            {/* Client */}
            {document.client && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-muted-foreground text-xs">Client</p>
                  <Link
                    className="font-medium text-sm hover:underline"
                    params={{ clientId: document.client.id }}
                    to="/app/clients/$clientId"
                  >
                    {document.client.displayName}
                  </Link>
                </div>
              </div>
            )}

            {/* Matter */}
            {document.matter && (
              <div className="flex items-center gap-3">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-muted-foreground text-xs">Matter</p>
                  <Link
                    className="font-medium text-sm hover:underline"
                    params={{ matterId: document.matter.id }}
                    to="/app/matters/$matterId"
                  >
                    {document.matter.referenceNumber} - {document.matter.title}
                  </Link>
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-muted-foreground text-xs">Uploaded</p>
                <p className="text-sm">
                  {new Date(document.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {document.expirationDate && (
              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-muted-foreground text-xs">Expires</p>
                  <p
                    className={`text-sm ${isExpired ? "font-medium text-red-600" : isExpiringSoon ? "text-amber-600" : ""}`}
                  >
                    {new Date(document.expirationDate).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Uploaded By */}
            {document.uploadedBy && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-muted-foreground text-xs">Uploaded By</p>
                  <p className="text-sm">{document.uploadedBy.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          <Button className="flex-1" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button onClick={handleDownload} variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open
          </Button>
          {document.status !== "ARCHIVED" && (
            <Button
              disabled={archiveMutation.isPending}
              onClick={() => archiveMutation.mutate(document.id)}
              variant="outline"
            >
              {archiveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
