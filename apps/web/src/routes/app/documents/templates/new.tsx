import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { TemplateEditor } from "@/components/templates/template-editor";
import { TemplatePreview } from "@/components/templates/template-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ALL_PLACEHOLDERS } from "@/lib/template-placeholders";
import { client, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/app/documents/templates/new")({
  component: NewTemplatePage,
});

function NewTemplatePage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [business, setBusiness] = useState<string>("");
  const [content, setContent] = useState("");

  const createMutation = useMutation({
    // biome-ignore lint/suspicious/useAwait: Auto-fix
    mutationFn: async () => {
      if (!(name && category && content)) {
        throw new Error("Please fill in all required fields");
      }

      // Extract placeholders used in the content
      const placeholderRegex = /\{\{([^}]+)\}\}/g;
      const matches = [...content.matchAll(placeholderRegex)];
      const usedPlaceholderKeys = [...new Set(matches.map((m) => m[1]))];

      // Find placeholder definitions for used placeholders
      const placeholders = usedPlaceholderKeys
        .map((key) => ALL_PLACEHOLDERS.find((p) => p.key === key))
        .filter((p) => p !== undefined);

      return client.documents.templates.create({
        name,
        description: description || undefined,
        category: category as
          | "LETTER"
          | "AGREEMENT"
          | "CERTIFICATE"
          | "FORM"
          | "REPORT"
          | "INVOICE"
          | "OTHER",
        business:
          business === "both" || !business
            ? undefined
            : (business as "GCMC" | "KAJ"),
        content,
        placeholders: placeholders.map((p) => ({
          key: p.key,
          label: p.label,
          type: p.type,
          source: p.source,
          sourceField: p.key.split(".").pop(),
        })),
        sortOrder: 0,
      });
    },
    onSuccess: (template) => {
      toast.success("Template created successfully");
      // biome-ignore lint/complexity/noVoid: Auto-fix
      void queryClient.invalidateQueries({ queryKey: ["templates"] });
      // biome-ignore lint/complexity/noVoid: Auto-fix
      void navigate({
        to: "/app/documents/templates/$templateId",
        params: { templateId: template.id },
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create template"
      );
    },
  });

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <a href="/app/documents/templates">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Templates
              </a>
            </Button>
            <Button
              disabled={
                createMutation.isPending || !name || !category || !content
              }
              onClick={() => createMutation.mutate()}
              size="sm"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Template
                </>
              )}
            </Button>
          </div>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Documents", href: "/app/documents" },
          { label: "Templates", href: "/app/documents/templates" },
          { label: "New Template" },
        ]}
        description="Create a new document template for automated document generation"
        title="New Document Template"
      />

      <div className="p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Template Details */}
          <div className="space-y-4 rounded-lg border bg-card p-6">
            <h3 className="font-semibold text-lg">Template Details</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Template Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Client Welcome Letter"
                  value={name}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select onValueChange={setCategory} value={category}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LETTER">Letter</SelectItem>
                    <SelectItem value="AGREEMENT">Agreement</SelectItem>
                    <SelectItem value="CERTIFICATE">Certificate</SelectItem>
                    <SelectItem value="FORM">Form</SelectItem>
                    <SelectItem value="REPORT">Report</SelectItem>
                    <SelectItem value="INVOICE">Invoice</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="business">Business</Label>
                <Select onValueChange={setBusiness} value={business}>
                  <SelectTrigger id="business">
                    <SelectValue placeholder="Select business" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both Businesses</SelectItem>
                    <SelectItem value="GCMC">GCMC Only</SelectItem>
                    <SelectItem value="KAJ">KAJ Only</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  Choose which business can use this template
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this template is for..."
                rows={2}
                value={description}
              />
            </div>
          </div>

          {/* Template Editor */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 font-semibold text-lg">
              Template Content <span className="text-red-500">*</span>
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              <TemplateEditor onChange={setContent} value={content} />
              <TemplatePreview content={content} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
