import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { TemplateEditor } from "@/components/templates/template-editor";
import { TemplatePreview } from "@/components/templates/template-preview";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

export const Route = createFileRoute("/app/documents/templates/$templateId")({
  component: TemplateDetailPage,
});

function TemplateDetailPage() {
  const { templateId } = Route.useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [business, setBusiness] = useState<string>("");
  const [content, setContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const {
    data: template,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["template", templateId],
    queryFn: () => client.documents.templates.getById({ id: templateId }),
  });

  // Populate form when template loads
  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || "");
      setCategory(template.category);
      setBusiness(template.business ? template.business : "both");
      setContent(template.content);
    }
  }, [template]);

  const updateMutation = useMutation({
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

      return client.documents.templates.update({
        id: templateId,
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
      });
    },
    onSuccess: () => {
      toast.success("Template updated successfully");
      void queryClient.invalidateQueries({
        queryKey: ["template", templateId],
      });
      void queryClient.invalidateQueries({ queryKey: ["templates"] });
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update template"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => client.documents.templates.delete({ id: templateId }),
    onSuccess: () => {
      toast.success("Template deleted successfully");
      void queryClient.invalidateQueries({ queryKey: ["templates"] });
      void navigate({ to: "/app/documents/templates" });
    },
    onError: () => {
      toast.error("Failed to delete template");
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading template...</span>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-red-600">Failed to load template</p>
          <Button asChild size="sm" variant="outline">
            <a href="/app/documents/templates">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Templates
            </a>
          </Button>
        </div>
      </div>
    );
  }

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
            {isEditing ? (
              <>
                <Button
                  onClick={() => {
                    // Reset form
                    setName(template.name);
                    setDescription(template.description || "");
                    setCategory(template.category);
                    setBusiness(template.business || "both");
                    setContent(template.content);
                    setIsEditing(false);
                  }}
                  size="sm"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  disabled={
                    updateMutation.isPending || !name || !category || !content
                  }
                  onClick={() => updateMutation.mutate()}
                  size="sm"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Template?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this template? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => deleteMutation.mutate()}
                      >
                        Delete Template
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button onClick={() => setIsEditing(true)} size="sm">
                  Edit Template
                </Button>
              </>
            )}
          </div>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Documents", href: "/app/documents" },
          { label: "Templates", href: "/app/documents/templates" },
          { label: template.name },
        ]}
        description={template.description || "View and edit template details"}
        title={template.name}
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
                  disabled={!isEditing}
                  id="name"
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  disabled={!isEditing}
                  onValueChange={setCategory}
                  value={category}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
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
                <Select
                  disabled={!isEditing}
                  onValueChange={setBusiness}
                  value={business}
                >
                  <SelectTrigger id="business">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both Businesses</SelectItem>
                    <SelectItem value="GCMC">GCMC Only</SelectItem>
                    <SelectItem value="KAJ">KAJ Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                disabled={!isEditing}
                id="description"
                onChange={(e) => setDescription(e.target.value)}
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
              <TemplateEditor
                disabled={!isEditing}
                onChange={setContent}
                value={content}
              />
              <TemplatePreview content={content} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
