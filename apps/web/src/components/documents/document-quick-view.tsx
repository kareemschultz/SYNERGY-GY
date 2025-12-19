import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
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
import type { ReactNode } from "react";
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
import { categoryConfig, formatFileSize } from "@/lib/document-utils";
import { client } from "@/utils/orpc";

// Use shared category config
const categoryLabels = categoryConfig;

// MIME type to icon lookup
function getFileIcon(mimeType: string): ReactNode {
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

// Detail row component for consistent formatting
function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1">
        <p className="text-muted-foreground text-xs">{label}</p>
        {children}
      </div>
    </div>
  );
}

// Format date consistently
function formatDisplayDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Check expiration status
function getExpirationInfo(expirationDate: string | null | undefined): {
  isExpired: boolean;
  isExpiringSoon: boolean;
} {
  if (!expirationDate) {
    return { isExpired: false, isExpiringSoon: false };
  }
  const expDate = new Date(expirationDate);
  const now = new Date();
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return {
    isExpired: expDate < now,
    isExpiringSoon: expDate < thirtyDaysFromNow && expDate >= now,
  };
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
  createdAt: Date;
  expirationDate?: string | null;
  client?: { id: string; displayName: string } | null;
  matter?: { id: string; title: string; referenceNumber: string } | null;
  uploadedBy?: { id: string; name: string | null } | null;
};

type DocumentQuickViewProps = {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArchive?: () => void;
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Quick view displays multiple conditional document properties (tags, description, client, matter, expiration) with different rendering paths
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
    if (!document) {
      return;
    }
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

  if (!document) {
    return null;
  }

  const categoryInfo =
    categoryLabels[document.category] || categoryLabels.OTHER;
  const { isExpired, isExpiringSoon } = getExpirationInfo(
    document.expirationDate
  );

  // Helper to get expiration text color class
  const getExpirationClassName = () => {
    if (isExpired) {
      return "font-medium text-red-600";
    }
    if (isExpiringSoon) {
      return "text-amber-600";
    }
    return "";
  };
  const expirationClassName = getExpirationClassName();

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
            {document.status === "ARCHIVED" ? (
              <Badge variant="secondary">Archived</Badge>
            ) : null}
            {isExpired ? <Badge variant="destructive">Expired</Badge> : null}
            {isExpiringSoon === true && isExpired === false ? (
              <Badge
                className="border-amber-200 bg-amber-500/10 text-amber-600"
                variant="outline"
              >
                Expiring Soon
              </Badge>
            ) : null}
          </div>

          {/* Tags */}
          {Array.isArray(document.tags) && document.tags.length > 0 ? (
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
          ) : null}

          {/* Description */}
          {document.description ? (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm">{document.description}</p>
            </div>
          ) : null}

          {/* Details Grid */}
          <div className="space-y-3">
            {/* Client */}
            {document.client ? (
              <DetailRow icon={User} label="Client">
                <Link
                  className="font-medium text-sm hover:underline"
                  params={{ clientId: document.client.id }}
                  to="/app/clients/$clientId"
                >
                  {document.client.displayName}
                </Link>
              </DetailRow>
            ) : null}

            {/* Matter */}
            {document.matter ? (
              <DetailRow icon={FolderOpen} label="Matter">
                <Link
                  className="font-medium text-sm hover:underline"
                  params={{ matterId: document.matter.id }}
                  to="/app/matters/$matterId"
                >
                  {document.matter.referenceNumber} - {document.matter.title}
                </Link>
              </DetailRow>
            ) : null}

            {/* Dates */}
            <DetailRow icon={Calendar} label="Uploaded">
              <p className="text-sm">{formatDisplayDate(document.createdAt)}</p>
            </DetailRow>

            {document.expirationDate ? (
              <DetailRow icon={Tag} label="Expires">
                <p className={`text-sm ${expirationClassName}`}>
                  {formatDisplayDate(document.expirationDate)}
                </p>
              </DetailRow>
            ) : null}

            {/* Uploaded By */}
            {document.uploadedBy ? (
              <DetailRow icon={User} label="Uploaded By">
                <p className="text-sm">{document.uploadedBy.name}</p>
              </DetailRow>
            ) : null}
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
          {document.status !== "ARCHIVED" ? (
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
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
