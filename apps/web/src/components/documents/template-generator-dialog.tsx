import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Download,
  Eye,
  FileText,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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

type TemplateGeneratorDialogProps = {
  clientId?: string;
  matterId?: string;
  trigger?: React.ReactNode;
};

// API supports: INVOICE, LETTER, OTHER, AGREEMENT, CERTIFICATE, FORM, REPORT
const categoryLabels: Record<string, string> = {
  INVOICE: "Invoices",
  LETTER: "Letters",
  AGREEMENT: "Agreements",
  CERTIFICATE: "Certificates",
  FORM: "Forms",
  REPORT: "Reports",
  OTHER: "Other",
};

export function TemplateGeneratorDialog({
  clientId,
  matterId,
  trigger,
}: TemplateGeneratorDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("select");

  // Fetch available templates - API supports: INVOICE, LETTER, OTHER, AGREEMENT, CERTIFICATE, FORM, REPORT
  type ApiTemplateCategory =
    | "INVOICE"
    | "LETTER"
    | "OTHER"
    | "AGREEMENT"
    | "CERTIFICATE"
    | "FORM"
    | "REPORT";

  const templateInput: {
    includeInactive?: boolean;
    category?: ApiTemplateCategory;
  } = {
    includeInactive: false,
    category:
      categoryFilter === "all"
        ? undefined
        : (categoryFilter as ApiTemplateCategory),
  };

  const { data: templates, isLoading: loadingTemplates } = useQuery({
    queryKey: ["documents", "templates", "list", templateInput],
    queryFn: () => client.documents.templates.list(templateInput),
    enabled: open,
  });

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const result = await client.documents.templates.preview({
        id: templateId,
        clientId,
        matterId,
      });
      return result;
    },
    onSuccess: (data) => {
      setPreviewContent(data.renderedContent);
      setActiveTab("preview");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to preview template");
    },
  });

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate) {
        throw new Error("No template selected");
      }
      const result = await client.documents.templates.generate({
        templateId: selectedTemplate,
        clientId,
        matterId,
      });
      return result;
    },
    onSuccess: (data) => {
      toast.success("Document generated successfully!");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setOpen(false);
      resetState();
      // Optionally show file info
      if (data.fileName) {
        toast.info(`Document saved as: ${data.fileName}`);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate document");
    },
  });

  const resetState = () => {
    setSelectedTemplate(null);
    setSearchQuery("");
    setCategoryFilter("all");
    setPreviewContent(null);
    setActiveTab("select");
  };

  const filteredTemplates = templates?.filter((template) => {
    if (!searchQuery) {
      return true;
    }
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query)
    );
  });

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    previewMutation.mutate(templateId);
  };

  return (
    <Dialog
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          resetState();
        }
      }}
      open={open}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Document
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Generate Document from Template</DialogTitle>
          <DialogDescription>
            Select a template and preview it with your client data before
            generating.
          </DialogDescription>
        </DialogHeader>

        <Tabs className="mt-4" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select">Select Template</TabsTrigger>
            <TabsTrigger disabled={!selectedTemplate} value="preview">
              Preview & Generate
            </TabsTrigger>
          </TabsList>

          <TabsContent className="space-y-4" value="select">
            {/* Search and Filter */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  value={searchQuery}
                />
              </div>
              <Select onValueChange={setCategoryFilter} value={categoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Template List */}
            <ScrollArea className="h-[400px] rounded-md border">
              {Boolean(loadingTemplates) && (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {!loadingTemplates && filteredTemplates?.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <FileText className="h-10 w-10" />
                  <p>No templates found</p>
                </div>
              )}
              {!loadingTemplates && (filteredTemplates?.length ?? 0) > 0 && (
                <div className="grid gap-2 p-4">
                  {filteredTemplates?.map((template) => (
                    <button
                      className={`flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50 ${
                        selectedTemplate === template.id
                          ? "border-primary bg-primary/5"
                          : ""
                      }`}
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      type="button"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{template.name}</p>
                          <Badge variant="outline">
                            {categoryLabels[template.category] ||
                              template.category}
                          </Badge>
                        </div>
                        {Boolean(template.description) && (
                          <p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
                            {template.description}
                          </p>
                        )}
                        <p className="mt-2 text-muted-foreground text-xs">
                          {template.placeholders?.length ?? 0} placeholders
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent className="space-y-4" value="preview">
            {Boolean(previewMutation.isPending) && (
              <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">
                  Loading preview...
                </span>
              </div>
            )}
            {!previewMutation.isPending && Boolean(previewContent) && (
              <>
                <div className="rounded-lg border bg-muted/20 p-1">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="font-medium text-sm">Preview</span>
                    <Badge variant="secondary">DRAFT</Badge>
                  </div>
                  <ScrollArea className="h-[350px] rounded-md bg-white p-4 dark:bg-zinc-950">
                    <Textarea
                      className="min-h-[320px] resize-none border-0 bg-transparent font-mono text-sm focus-visible:ring-0"
                      readOnly
                      value={previewContent ?? ""}
                    />
                  </ScrollArea>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    onClick={() => setActiveTab("select")}
                    variant="outline"
                  >
                    Back to Templates
                  </Button>
                  <Button
                    disabled={generateMutation.isPending}
                    onClick={() => generateMutation.mutate()}
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Generate Document
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
            {!(previewMutation.isPending || previewContent) && (
              <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                <Eye className="mr-2 h-5 w-5" />
                Select a template to see preview
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
