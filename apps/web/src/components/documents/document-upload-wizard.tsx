import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Loader2,
  Search,
  Upload,
  User,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { client, queryClient } from "@/utils/orpc";

const WIZARD_STEPS = [
  { id: 1, title: "Select Files", icon: Upload },
  { id: 2, title: "Categorize", icon: FileText },
  { id: 3, title: "Link to Client", icon: User },
  { id: 4, title: "Review & Upload", icon: Check },
] as const;

const categoryOptions = [
  {
    value: "IDENTITY",
    label: "Identity Documents",
    description: "ID, Passport, Driver's License",
    color: "bg-purple-500/10 text-purple-600",
  },
  {
    value: "TAX",
    label: "Tax Documents",
    description: "Tax returns, assessments, receipts",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    value: "FINANCIAL",
    label: "Financial Statements",
    description: "Bank statements, audits, reports",
    color: "bg-green-500/10 text-green-600",
  },
  {
    value: "LEGAL",
    label: "Legal Documents",
    description: "Contracts, agreements, court docs",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    value: "IMMIGRATION",
    label: "Immigration Papers",
    description: "Visas, work permits, applications",
    color: "bg-cyan-500/10 text-cyan-600",
  },
  {
    value: "BUSINESS",
    label: "Business Documents",
    description: "Registration, licenses, certificates",
    color: "bg-indigo-500/10 text-indigo-600",
  },
  {
    value: "CORRESPONDENCE",
    label: "Correspondence",
    description: "Letters, emails, notifications",
    color: "bg-pink-500/10 text-pink-600",
  },
  {
    value: "TRAINING",
    label: "Training Materials",
    description: "Certificates, course materials",
    color: "bg-orange-500/10 text-orange-600",
  },
  {
    value: "OTHER",
    label: "Other",
    description: "Miscellaneous documents",
    color: "bg-gray-500/10 text-gray-600",
  },
] as const;

type Category = (typeof categoryOptions)[number]["value"];

type FormValues = {
  category: Category;
  description: string;
  clientId: string;
  matterId: string;
  expirationDate: string;
  tags: string[];
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

type DocumentUploadWizardProps = {
  onComplete?: () => void;
  onCancel?: () => void;
};

export function DocumentUploadWizard({
  onComplete,
  onCancel,
}: DocumentUploadWizardProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{
    id: string;
    displayName: string;
  } | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

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
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const form = useForm({
    defaultValues: {
      category: "OTHER" as Category,
      description: "",
      clientId: "",
      matterId: "",
      expirationDate: "",
      tags: [] as string[],
    } satisfies FormValues,
  });

  const uploadMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const results = [];
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(Math.round(((i + 0.5) / totalFiles) * 100));

        const { uploadUrl } = await client.documents.prepareUpload({
          category: values.category,
          description: values.description || undefined,
          clientId: values.clientId || undefined,
          matterId: values.matterId || undefined,
          expirationDate: values.expirationDate || undefined,
        });

        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.error || `Failed to upload ${file.name}`);
        }

        const uploadResult = await uploadResponse.json();
        results.push(uploadResult.document);
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success(
        `${files.length} document${files.length > 1 ? "s" : ""} uploaded successfully!`
      );
      if (onComplete) {
        onComplete();
      } else {
        navigate({ to: "/app/documents" });
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload documents");
      setUploadProgress(0);
    },
  });

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleUpload = () => {
    if (files.length === 0) {
      toast.error("Please select at least one file");
      return;
    }
    uploadMutation.mutate(form.state.values);
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.state.values.tags.includes(tag)) {
      form.setFieldValue("tags", [...form.state.values.tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    form.setFieldValue(
      "tags",
      form.state.values.tags.filter((t) => t !== tag)
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return files.length > 0;
      case 2:
        return form.state.values.category !== "";
      case 3:
        return true; // Client is optional
      case 4:
        return files.length > 0;
      default:
        return false;
    }
  };

  const getCategoryInfo = (cat: string) =>
    categoryOptions.find((c) => c.value === cat);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Progress Steps */}
      <div className="relative">
        <Progress
          className="h-2"
          value={(currentStep / WIZARD_STEPS.length) * 100}
        />
        <div className="mt-4 flex justify-between">
          {WIZARD_STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div className="flex flex-col items-center gap-2" key={step.id}>
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                    isActive &&
                      "border-primary bg-primary text-primary-foreground",
                    isCompleted && "border-primary bg-primary/10 text-primary",
                    !(isActive || isCompleted) &&
                      "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    "font-medium text-xs",
                    isActive && "text-primary",
                    !isActive && "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 1 && "Select Files to Upload"}
            {currentStep === 2 && "Categorize Your Documents"}
            {currentStep === 3 && "Link to Client or Matter"}
            {currentStep === 4 && "Review & Upload"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: File Selection */}
          {currentStep === 1 && (
            <>
              <div
                {...getRootProps()}
                className={cn(
                  "cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-all",
                  isDragActive
                    ? "scale-[1.02] border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                {isDragActive ? (
                  <p className="font-medium text-lg text-primary">
                    Drop files here...
                  </p>
                ) : (
                  <>
                    <p className="mb-2 font-medium text-lg">
                      Drag & drop files here
                    </p>
                    <p className="text-muted-foreground">
                      or click to browse your computer
                    </p>
                    <p className="mt-2 text-muted-foreground text-sm">
                      Supported: PDF, Word, Excel, Images (max 50MB each)
                    </p>
                  </>
                )}
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium text-sm">
                    Selected Files ({files.length})
                  </p>
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {files.map((file, index) => (
                      <div
                        className="flex items-center justify-between rounded-lg border bg-muted/30 p-3"
                        key={`${file.name}-${file.lastModified}`}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
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
                </div>
              )}
            </>
          )}

          {/* Step 2: Categorization */}
          {currentStep === 2 && (
            <>
              <div className="space-y-4">
                <div>
                  <Label className="mb-3 block">Select Category</Label>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryOptions.map((cat) => (
                      <button
                        className={cn(
                          "flex flex-col items-start rounded-lg border p-4 text-left transition-all hover:border-primary/50",
                          form.state.values.category === cat.value &&
                            "border-primary bg-primary/5 ring-1 ring-primary"
                        )}
                        key={cat.value}
                        onClick={() =>
                          form.setFieldValue("category", cat.value)
                        }
                        type="button"
                      >
                        <Badge className={cat.color} variant="secondary">
                          {cat.label}
                        </Badge>
                        <p className="mt-2 text-muted-foreground text-xs">
                          {cat.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <form.Field name="description">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Description (Optional)</Label>
                      <Textarea
                        id={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Add a brief description of these documents..."
                        rows={3}
                        value={field.state.value}
                      />
                    </div>
                  )}
                </form.Field>

                <div className="space-y-2">
                  <Label>Tags (Optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="Add tags..."
                      value={tagInput}
                    />
                    <Button onClick={addTag} type="button" variant="outline">
                      Add
                    </Button>
                  </div>
                  {form.state.values.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {form.state.values.tags.map((tag) => (
                        <Badge
                          className="cursor-pointer"
                          key={tag}
                          onClick={() => removeTag(tag)}
                          variant="secondary"
                        >
                          {tag}
                          <X className="ml-1 h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <form.Field name="expirationDate">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>
                        Expiration Date (Optional)
                      </Label>
                      <Input
                        className="w-48"
                        id={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        type="date"
                        value={field.state.value}
                      />
                      <p className="text-muted-foreground text-xs">
                        Set if this document expires (e.g., passport, license)
                      </p>
                    </div>
                  )}
                </form.Field>
              </div>
            </>
          )}

          {/* Step 3: Link to Client */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-muted-foreground text-sm">
                  Linking documents to a client or matter helps organize your
                  files and makes them easy to find later. This step is
                  optional.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Search for Client</Label>
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
                          placeholder="Type client name..."
                          value={clientSearch}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {clientSearch.length < 2
                              ? "Type at least 2 characters to search..."
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
                                <User className="mr-2 h-4 w-4" />
                                {c.displayName}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedClient && (
                    <Button
                      className="mt-2"
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
                      Clear client selection
                    </Button>
                  )}
                </div>

                {selectedClient && (
                  <form.Field name="matterId">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>
                          Link to Matter (Optional)
                        </Label>
                        <Select
                          onValueChange={field.handleChange}
                          value={field.state.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a matter..." />
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
                )}
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {uploadMutation.isPending ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <div className="text-center">
                    <p className="font-medium">Uploading documents...</p>
                    <p className="text-muted-foreground text-sm">
                      {uploadProgress}% complete
                    </p>
                  </div>
                  <Progress className="w-64" value={uploadProgress} />
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <h4 className="mb-3 font-medium">Upload Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Files:</span>
                          <span className="font-medium">
                            {files.length} file{files.length !== 1 && "s"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Total Size:
                          </span>
                          <span className="font-medium">
                            {formatFileSize(
                              files.reduce((acc, f) => acc + f.size, 0)
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Category:
                          </span>
                          <Badge
                            className={
                              getCategoryInfo(form.state.values.category)?.color
                            }
                            variant="secondary"
                          >
                            {getCategoryInfo(form.state.values.category)?.label}
                          </Badge>
                        </div>
                        {selectedClient && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Client:
                            </span>
                            <span className="font-medium">
                              {selectedClient.displayName}
                            </span>
                          </div>
                        )}
                        {form.state.values.tags.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tags:</span>
                            <div className="flex flex-wrap gap-1">
                              {form.state.values.tags.map((tag) => (
                                <Badge key={tag} variant="outline">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 font-medium text-sm">
                        Files to Upload
                      </h4>
                      <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border p-2">
                        {files.map((file) => (
                          <div
                            className="flex items-center gap-2 text-sm"
                            key={`${file.name}-${file.lastModified}`}
                          >
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="flex-1 truncate">{file.name}</span>
                            <span className="text-muted-foreground">
                              {formatFileSize(file.size)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          disabled={uploadMutation.isPending}
          onClick={currentStep === 1 ? onCancel : handleBack}
          variant="outline"
        >
          {currentStep === 1 ? (
            "Cancel"
          ) : (
            <>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </>
          )}
        </Button>

        {currentStep < 4 ? (
          <Button disabled={!canProceed()} onClick={handleNext}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            disabled={uploadMutation.isPending || files.length === 0}
            onClick={handleUpload}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Documents
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
