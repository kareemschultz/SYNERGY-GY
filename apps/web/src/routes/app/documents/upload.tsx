import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Search, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { client, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/app/documents/upload")({
  component: UploadDocumentPage,
});

const categoryOptions = [
  { value: "IDENTITY", label: "Identity (ID, Passport, etc.)" },
  { value: "TAX", label: "Tax Documents" },
  { value: "FINANCIAL", label: "Financial Statements" },
  { value: "LEGAL", label: "Legal Documents" },
  { value: "IMMIGRATION", label: "Immigration Papers" },
  { value: "BUSINESS", label: "Business Documents" },
  { value: "CORRESPONDENCE", label: "Correspondence" },
  { value: "TRAINING", label: "Training Materials" },
  { value: "OTHER", label: "Other" },
] as const;

type Category = (typeof categoryOptions)[number]["value"];

type FormValues = {
  category: Category;
  description: string;
  clientId: string;
  matterId: string;
  expirationDate: string;
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function UploadDocumentPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{
    id: string;
    displayName: string;
  } | null>(null);

  // Search clients
  const { data: clientResults } = useQuery({
    queryKey: ["clientSearch", clientSearch],
    queryFn: () => client.clients.search({ query: clientSearch, limit: 10 }),
    enabled: clientSearch.length >= 2,
  });

  // Get matters for selected client
  const { data: matters } = useQuery({
    queryKey: ["clientMatters", selectedClient?.id],
    queryFn: () =>
      client.matters.list({
        clientId: selectedClient?.id,
        page: 1,
        limit: 50,
      }),
    enabled: selectedClient !== null,
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
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
    maxSize: 50 * 1024 * 1024, // 50MB max
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // biome-ignore lint/suspicious/noEvolvingTypes: Auto-fix
      const results = [];

      for (const file of files) {
        // Step 1: Prepare upload - creates PENDING document record
        // biome-ignore lint/correctness/noUnusedVariables: Auto-fix
        const { documentId, uploadUrl } = await client.documents.prepareUpload({
          category: values.category,
          description: values.description || undefined,
          clientId: values.clientId || undefined,
          matterId: values.matterId || undefined,
          expirationDate: values.expirationDate || undefined,
        });

        // Step 2: Upload file to server
        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
          credentials: "include", // Include cookies for auth
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.error || "Failed to upload file");
        }

        const uploadResult = await uploadResponse.json();
        results.push(uploadResult.document);
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success(
        `${files.length} document${files.length > 1 ? "s" : ""} uploaded successfully`
      );
      navigate({ to: "/app/documents" });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload documents");
    },
  });

  const form = useForm({
    defaultValues: {
      category: "OTHER" as Category,
      description: "",
      clientId: "",
      matterId: "",
      expirationDate: "",
    } satisfies FormValues,
    // biome-ignore lint/suspicious/useAwait: Auto-fix
    onSubmit: async ({ value }) => {
      if (files.length === 0) {
        toast.error("Please select at least one file to upload");
        return;
      }
      uploadMutation.mutate(value);
    },
  });

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/app/documents">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancel
              </Link>
            </Button>
            <Button
              disabled={files.length === 0 || uploadMutation.isPending}
              onClick={() => form.handleSubmit()}
            >
              {uploadMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload {files.length > 0 && `(${files.length})`}
            </Button>
          </div>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Documents", href: "/app/documents" },
          { label: "Upload" },
        ]}
        description="Upload documents for clients and matters"
        title="Upload Documents"
      />

      <form
        className="p-6"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <div className="mx-auto max-w-4xl space-y-6">
          {/* File Upload Zone */}
          <Card>
            <CardHeader>
              <CardTitle>Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                {...getRootProps()}
                className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-primary">Drop files here...</p>
                ) : (
                  <>
                    <p className="mb-1 font-medium">
                      Drag & drop files here, or click to select
                    </p>
                    <p className="text-muted-foreground text-sm">
                      PDF, Word, Excel, Images (max 50MB each)
                    </p>
                  </>
                )}
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      className="flex items-center justify-between rounded-lg border bg-muted/50 p-3"
                      key={`${file.name}-${file.lastModified}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-background">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => removeFile(index)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Details */}
          <Card>
            <CardHeader>
              <CardTitle>Document Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <form.Field name="category">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Category *</Label>
                      <Select
                        onValueChange={(value) =>
                          field.handleChange(value as Category)
                        }
                        value={field.state.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>

                <form.Field name="expirationDate">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Expiration Date</Label>
                      <Input
                        id={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        type="date"
                        value={field.state.value}
                      />
                    </div>
                  )}
                </form.Field>
              </div>

              <form.Field name="description">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Description</Label>
                    <Textarea
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Optional description of the document..."
                      rows={2}
                      value={field.state.value}
                    />
                  </div>
                )}
              </form.Field>
            </CardContent>
          </Card>

          {/* Association */}
          <Card>
            <CardHeader>
              <CardTitle>Link to Client/Matter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Client Search */}
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Popover
                    onOpenChange={setClientPopoverOpen}
                    open={clientPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        className="w-full justify-start"
                        role="combobox"
                        variant="outline"
                      >
                        <Search className="mr-2 h-4 w-4" />
                        {selectedClient
                          ? selectedClient.displayName
                          : "Search for a client..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput
                          onValueChange={setClientSearch}
                          placeholder="Search clients..."
                          value={clientSearch}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {clientSearch.length < 2
                              ? "Type at least 2 characters..."
                              : "No clients found."}
                          </CommandEmpty>
                          <CommandGroup>
                            {clientResults?.map((c) => (
                              <CommandItem
                                key={c.id}
                                onSelect={() => {
                                  setSelectedClient({
                                    id: c.id,
                                    displayName: c.displayName,
                                  });
                                  form.setFieldValue("clientId", c.id);
                                  form.setFieldValue("matterId", "");
                                  setClientPopoverOpen(false);
                                }}
                                value={c.displayName}
                              >
                                {c.displayName}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {!!selectedClient && (
                    <Button
                      className="mt-1"
                      onClick={() => {
                        setSelectedClient(null);
                        form.setFieldValue("clientId", "");
                        form.setFieldValue("matterId", "");
                      }}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Clear
                    </Button>
                  )}
                </div>

                {/* Matter Selection */}
                <form.Field name="matterId">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Matter</Label>
                      <Select
                        disabled={!selectedClient}
                        onValueChange={field.handleChange}
                        value={field.state.value}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              selectedClient
                                ? "Select a matter..."
                                : "Select client first"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {matters?.matters.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.referenceNumber} - {m.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
