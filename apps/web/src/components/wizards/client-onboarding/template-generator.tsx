import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, Search, X } from "lucide-react";
import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { client } from "@/utils/orpc";
import type { ClientOnboardingData } from "./types";

type TemplateGeneratorProps = {
  data: ClientOnboardingData;
  onTemplateGenerated?: (fileName: string, content: string) => void;
};

const TEMPLATE_CATEGORIES = [
  { value: "ALL", label: "All Categories" },
  { value: "LETTER", label: "Letters" },
  { value: "AGREEMENT", label: "Agreements" },
  { value: "CERTIFICATE", label: "Certificates" },
  { value: "FORM", label: "Forms" },
  { value: "REPORT", label: "Reports" },
  { value: "INVOICE", label: "Invoices" },
  { value: "OTHER", label: "Other" },
] as const;

type TemplateCategory =
  | "LETTER"
  | "AGREEMENT"
  | "CERTIFICATE"
  | "FORM"
  | "REPORT"
  | "INVOICE"
  | "OTHER";

type TemplateCustomData = Record<string, string>;

export function TemplateGenerator({
  data,
  onTemplateGenerated,
}: TemplateGeneratorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Fetch templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ["templates", "wizard", data.businesses, selectedCategory],
    queryFn: async () => {
      const allTemplates = await Promise.all(
        data.businesses.map((business) =>
          client.documents.templates.list({
            business,
            category:
              selectedCategory === "ALL"
                ? undefined
                : (selectedCategory as TemplateCategory),
          })
        )
      );
      return allTemplates.flat();
    },
    enabled: data.businesses.length > 0,
  });

  // Preview template
  const { data: preview, isLoading: isLoadingPreview } = useQuery({
    queryKey: ["template-preview", selectedTemplate, data],
    queryFn: async () => {
      if (!selectedTemplate) {
        return null;
      }

      // Build client data from wizard
      const clientData = {
        displayName:
          `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Client",
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        city: data.city || "",
      };

      return await client.documents.templates.preview({
        id: selectedTemplate,
        customData: clientData as TemplateCustomData,
      });
    },
    enabled: !!selectedTemplate,
  });

  // Filter templates by search
  const filteredTemplates = templates?.filter((template) => {
    const matchesSearch =
      searchQuery === "" ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    setPreviewOpen(true);
  };

  const handleGenerate = async () => {
    if (!(selectedTemplate && preview)) {
      return;
    }

    // Build client data from wizard
    const clientData = {
      displayName:
        `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Client",
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      email: data.email || "",
      phone: data.phone || "",
      address: data.address || "",
      city: data.city || "",
    };

    try {
      const generated = await client.documents.templates.generate({
        templateId: selectedTemplate,
        customData: clientData as TemplateCustomData,
      });

      onTemplateGenerated?.(generated.fileName, generated.content);
      setPreviewOpen(false);
      setSelectedTemplate(null);
    } catch (error) {
      console.error("Failed to generate template:", error);
    }
  };

  // Render template list content based on loading/data state
  const renderTemplateList = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (filteredTemplates && filteredTemplates.length > 0) {
      return (
        <div className="space-y-2">
          {filteredTemplates.map((template) => (
            <button
              className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent/50"
              key={template.id}
              onClick={() => handleSelectTemplate(template.id)}
              type="button"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-sm">
                    {template.name}
                  </p>
                  <Badge className="text-xs" variant="outline">
                    {template.category}
                  </Badge>
                  {template.business ? (
                    <Badge
                      className="text-xs"
                      variant={
                        template.business === "GCMC" ? "default" : "secondary"
                      }
                    >
                      {template.business}
                    </Badge>
                  ) : null}
                </div>
                {template.description ? (
                  <p className="truncate text-muted-foreground text-xs">
                    {template.description}
                  </p>
                ) : null}
              </div>
              <Button size="sm" type="button" variant="outline">
                Preview & Generate
              </Button>
            </button>
          ))}
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-dashed bg-muted/20 py-8 text-center text-muted-foreground">
        <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
        <p>No templates found</p>
        <p className="text-sm">
          {searchQuery
            ? "Try adjusting your search"
            : "No templates available for the selected businesses"}
        </p>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generate Document from Template
              </CardTitle>
              <CardDescription>
                Select a template and preview it with your client data before
                generating
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                type="text"
                value={searchQuery}
              />
              {searchQuery ? (
                <Button
                  className="-translate-y-1/2 absolute top-1/2 right-1 h-7 w-7"
                  onClick={() => setSearchQuery("")}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
            <Select
              onValueChange={setSelectedCategory}
              value={selectedCategory}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template List */}
          {renderTemplateList()}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog onOpenChange={setPreviewOpen} open={previewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Review the generated document before saving
            </DialogDescription>
          </DialogHeader>

          {(() => {
            if (isLoadingPreview) {
              return (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              );
            }
            if (preview) {
              return (
                <div className="space-y-4">
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <h3 className="mb-2 font-semibold">
                      {preview.template.name}
                    </h3>
                    <pre className="max-h-96 overflow-auto whitespace-pre-wrap font-mono text-sm">
                      {preview.renderedContent}
                    </pre>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          <DialogFooter>
            <Button
              onClick={() => {
                setPreviewOpen(false);
                setSelectedTemplate(null);
              }}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={handleGenerate} type="button">
              Generate Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
