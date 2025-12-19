import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Clock,
  Download,
  FileText,
  Loader2,
  Search,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { client, orpc, queryClient } from "@/utils/orpc";

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

const categoryOptions = [
  { value: "IDENTITY", label: "Identity Documents" },
  { value: "TAX", label: "Tax Documents" },
  { value: "FINANCIAL", label: "Financial" },
  { value: "LEGAL", label: "Legal" },
  { value: "IMMIGRATION", label: "Immigration" },
  { value: "BUSINESS", label: "Business" },
  { value: "CORRESPONDENCE", label: "Correspondence" },
  { value: "TRAINING", label: "Training" },
  { value: "OTHER", label: "Other" },
] as const;

type DocumentCategory = (typeof categoryOptions)[number]["value"];

const getUploadStatusColor = (status: string) => {
  switch (status) {
    case "APPROVED":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "REJECTED":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  }
};

function getDropzoneClassName(
  isDragActive: boolean,
  hasSelectedFile: boolean
): string {
  const baseClasses =
    "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all";

  if (isDragActive) {
    return `${baseClasses} scale-[1.02] border-primary bg-primary/5`;
  }
  if (hasSelectedFile) {
    return `${baseClasses} border-green-500 bg-green-50 dark:bg-green-900/10`;
  }
  return `${baseClasses} border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50`;
}

function DropzoneContent({
  selectedFile,
  isDragActive,
  onRemoveFile,
}: {
  selectedFile: File | null;
  isDragActive: boolean;
  onRemoveFile: () => void;
}) {
  if (selectedFile) {
    return (
      <div className="flex flex-col items-center gap-2">
        <FileText className="h-12 w-12 text-green-600" />
        <p className="font-medium">{selectedFile.name}</p>
        <p className="text-muted-foreground text-sm">
          {formatFileSize(selectedFile.size)}
        </p>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFile();
          }}
          size="sm"
          variant="ghost"
        >
          <X className="mr-1 h-4 w-4" />
          Remove
        </Button>
      </div>
    );
  }

  if (isDragActive) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Upload className="h-12 w-12 text-primary" />
        <p className="font-medium text-primary">Drop file here...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Upload className="h-12 w-12 text-muted-foreground" />
      <p className="font-medium">Drag & drop a file here</p>
      <p className="text-muted-foreground text-sm">or click to browse</p>
      <p className="mt-2 text-muted-foreground text-xs">
        PDF, Word, Excel, Images (max 50MB)
      </p>
    </div>
  );
}

type UploadItem = {
  id: string;
  originalName: string;
  status: string;
  category: string;
  reviewNotes: string | null;
  fileSize: number;
  createdAt: Date | string;
  reviewedAt: Date | string | null;
};

function UploadsContent({
  isLoading,
  uploads,
  onUploadClick,
}: {
  isLoading: boolean;
  uploads: UploadItem[];
  onUploadClick: () => void;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (uploads.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed bg-muted/10 py-12 text-center text-muted-foreground">
        <Upload className="mx-auto mb-4 h-16 w-16 opacity-50" />
        <p className="font-medium text-lg">No uploads yet</p>
        <p className="mt-2 text-sm">Upload a document to get started</p>
        <Button className="mt-4" onClick={onUploadClick} variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {uploads.map((upload) => (
        <div
          className="rounded-lg border bg-white p-4 dark:bg-transparent"
          key={upload.id}
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-1 items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <FileText className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-medium text-sm">
                    {upload.originalName}
                  </h3>
                  <Badge
                    className={getUploadStatusColor(upload.status)}
                    variant="outline"
                  >
                    {upload.status === "PENDING_REVIEW" ? (
                      <Clock className="mr-1 h-3 w-3" />
                    ) : null}
                    {upload.status === "APPROVED" ? (
                      <Check className="mr-1 h-3 w-3" />
                    ) : null}
                    {upload.status === "REJECTED" ? (
                      <X className="mr-1 h-3 w-3" />
                    ) : null}
                    {upload.status.replace("_", " ")}
                  </Badge>
                  <Badge
                    className={getCategoryColor(upload.category)}
                    variant="outline"
                  >
                    {upload.category}
                  </Badge>
                </div>
                {upload.reviewNotes ? (
                  <p className="mb-2 text-muted-foreground text-sm">
                    <strong>Review notes:</strong> {upload.reviewNotes}
                  </p>
                ) : null}
                <div className="flex items-center gap-4 text-muted-foreground text-xs">
                  <span>{formatFileSize(upload.fileSize)}</span>
                  <span>-</span>
                  <span>
                    Uploaded on{" "}
                    {new Date(upload.createdAt).toLocaleDateString()}
                  </span>
                  {upload.reviewedAt ? (
                    <>
                      <span>-</span>
                      <span>
                        Reviewed on{" "}
                        {new Date(upload.reviewedAt).toLocaleDateString()}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PortalDocuments() {
  const _navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("ALL");
  const [_status, _setStatus] = useState<string>("ALL");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] =
    useState<DocumentCategory>("OTHER");
  const [uploadDescription, setUploadDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("library");

  const { data, isLoading, error } = useQuery(
    orpc.portal.documents.list.queryOptions({
      input: { page: 1, limit: 50 },
    })
  );

  // Query matters for linking (currently not displayed but kept for future use)
  useQuery(
    orpc.portal.matters.list.queryOptions({
      input: { page: 1, limit: 100 },
    })
  );

  // Query for uploaded documents status
  const { data: uploadsData, isLoading: uploadsLoading } = useQuery({
    queryKey: ["portal", "documentUpload", "list"],
    queryFn: () => client.portal.documentUpload.list({ page: 1, limit: 50 }),
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "text/plain": [".txt"],
    },
    maxSize: 50 * 1024 * 1024,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    try {
      // Step 1: Prepare upload (create document record)
      const { uploadUrl } = await client.portal.documentUpload.prepareUpload({
        category: uploadCategory,
        description: uploadDescription || undefined,
      });

      // Step 2: Upload file
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!uploadResponse.ok) {
        const uploadError = await uploadResponse.json();
        throw new Error(uploadError.error || "Failed to upload file");
      }

      toast.success(
        "Document uploaded successfully. It will be reviewed by our team."
      );
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadDescription("");
      setUploadCategory("OTHER");

      // Refresh uploads list
      queryClient.invalidateQueries({ queryKey: ["portal", "documentUpload"] });
      queryClient.invalidateQueries({ queryKey: ["portal", "documents"] });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast.error(`Upload failed: ${message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (documentId: string) => {
    try {
      const result = await client.portal.documents.download({ documentId });
      toast.success(`Download started for ${result.fileName}`);
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
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-6xl px-4 py-8">
        <Tabs onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="library">Document Library</TabsTrigger>
            <TabsTrigger value="uploads">
              My Uploads
              {(uploadsData?.uploads.filter(
                (u) => u.status === "PENDING_REVIEW"
              ).length ?? 0) > 0 ? (
                <Badge className="ml-2" variant="secondary">
                  {
                    uploadsData?.uploads.filter(
                      (u) => u.status === "PENDING_REVIEW"
                    ).length
                  }
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library">
            <Card>
              <CardHeader>
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <CardTitle>Document Library</CardTitle>
                    <CardDescription>
                      All documents associated with your matters
                    </CardDescription>
                  </div>
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
                                {doc.matterId ? (
                                  <Badge
                                    className="text-xs"
                                    variant="secondary"
                                  >
                                    Matter Linked
                                  </Badge>
                                ) : null}
                              </div>
                              {doc.description ? (
                                <p className="mb-2 text-muted-foreground text-sm">
                                  {doc.description}
                                </p>
                              ) : null}
                              <div className="flex items-center gap-4 text-muted-foreground text-xs">
                                <span>{formatFileSize(doc.fileSize)}</span>
                                <span>-</span>
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
          </TabsContent>

          <TabsContent value="uploads">
            <Card>
              <CardHeader>
                <CardTitle>My Uploads</CardTitle>
                <CardDescription>
                  Track the status of documents you have uploaded
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UploadsContent
                  isLoading={uploadsLoading}
                  onUploadClick={() => setUploadDialogOpen(true)}
                  uploads={uploadsData?.uploads ?? []}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Upload Dialog */}
      <Dialog onOpenChange={setUploadDialogOpen} open={uploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document for review. Our team will process it within 1-2
              business days.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={getDropzoneClassName(isDragActive, !!selectedFile)}
            >
              <input {...getInputProps()} />
              <DropzoneContent
                isDragActive={isDragActive}
                onRemoveFile={() => setSelectedFile(null)}
                selectedFile={selectedFile}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Document Category</Label>
              <Select
                onValueChange={(v) => setUploadCategory(v as DocumentCategory)}
                value={uploadCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Add a brief description of this document..."
                rows={3}
                value={uploadDescription}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              disabled={isUploading}
              onClick={() => {
                setUploadDialogOpen(false);
                setSelectedFile(null);
                setUploadDescription("");
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={!selectedFile || isUploading}
              onClick={handleUpload}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
