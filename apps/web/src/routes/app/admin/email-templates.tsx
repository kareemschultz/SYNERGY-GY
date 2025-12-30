import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Edit,
  Eye,
  FileText,
  Loader2,
  Mail,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { client } from "@/utils/orpc";
import { unwrapOrpc } from "@/utils/orpc-response";

export const Route = createFileRoute("/app/admin/email-templates")({
  component: EmailTemplatesPage,
});

type EmailTemplate = {
  id: string;
  type: string;
  name: string;
  description: string | null;
  subject: string;
  htmlContent: string;
  textContent: string | null;
  isActive: boolean;
  isDefault: boolean;
  business: string | null;
  availableVariables: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { id: string; name: string } | null;
  updatedBy: { id: string; name: string } | null;
};

type TemplateType = {
  value: string;
  label: string;
  variables: string[];
};

type TemplateFormData = {
  type: string;
  name: string;
  description: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  business: string | null;
  isActive: boolean;
};

const defaultFormData: TemplateFormData = {
  type: "CUSTOM",
  name: "",
  description: "",
  subject: "",
  htmlContent: "",
  textContent: "",
  business: null,
  isActive: true,
};

function EmailTemplatesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [editTemplate, setEditTemplate] = useState<EmailTemplate | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<{
    subject: string;
    html: string;
  } | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<EmailTemplate | null>(
    null
  );
  const [formData, setFormData] = useState<TemplateFormData>(defaultFormData);

  // Fetch templates
  const { data: templatesRaw, isLoading } = useQuery({
    queryKey: ["emailTemplates", search, typeFilter],
    queryFn: () =>
      client.emailTemplates.list({
        search: search || undefined,
        type: (typeFilter as never) || undefined,
        limit: 100,
      }),
  });

  const templates = unwrapOrpc<{
    templates: EmailTemplate[];
    total: number;
    page: number;
    limit: number;
  }>(templatesRaw);

  // Fetch template types
  const { data: typesRaw } = useQuery({
    queryKey: ["emailTemplateTypes"],
    queryFn: () => client.emailTemplates.getTypes({}),
  });

  const templateTypes = unwrapOrpc<TemplateType[]>(typesRaw) || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const response = await client.emailTemplates.create({
        type: data.type as never,
        name: data.name,
        description: data.description || undefined,
        subject: data.subject,
        htmlContent: data.htmlContent,
        textContent: data.textContent || undefined,
        business: (data.business as "GCMC" | "KAJ") || undefined,
        isActive: data.isActive,
      });
      return unwrapOrpc<EmailTemplate>(response);
    },
    onSuccess: () => {
      toast.success("Template created successfully");
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      setCreateOpen(false);
      setFormData(defaultFormData);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create template");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string } & TemplateFormData) => {
      const response = await client.emailTemplates.update({
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        subject: data.subject,
        htmlContent: data.htmlContent,
        textContent: data.textContent || undefined,
        business: (data.business as "GCMC" | "KAJ" | null) || null,
        isActive: data.isActive,
      });
      return unwrapOrpc<EmailTemplate>(response);
    },
    onSuccess: () => {
      toast.success("Template updated successfully");
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      setEditTemplate(null);
      setFormData(defaultFormData);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update template");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await client.emailTemplates.delete({ id });
      return unwrapOrpc<{ success: boolean }>(response);
    },
    onSuccess: () => {
      toast.success("Template deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      setDeleteTemplate(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete template");
    },
  });

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await client.emailTemplates.preview({ id });
      return unwrapOrpc<{ subject: string; html: string }>(response);
    },
    onSuccess: (data) => {
      if (data) {
        setPreviewContent({ subject: data.subject, html: data.html });
        setPreviewOpen(true);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to preview template");
    },
  });

  const handleEdit = (template: EmailTemplate) => {
    setFormData({
      type: template.type,
      name: template.name,
      description: template.description || "",
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent || "",
      business: template.business,
      isActive: template.isActive,
    });
    setEditTemplate(template);
  };

  const handleCreate = () => {
    setFormData(defaultFormData);
    setCreateOpen(true);
  };

  const formatType = (type: string) =>
    type
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Admin", href: "/app/admin" },
          { label: "Email Templates" },
        ]}
        description="Manage customizable email templates for notifications"
        title="Email Templates"
      />

      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-4">
              <div className="relative min-w-[200px] flex-1">
                <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search templates..."
                  value={search}
                />
              </div>
              <Select onValueChange={setTypeFilter} value={typeFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  {templateTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates?.templates?.length === 0 ? (
                    <TableRow>
                      <TableCell
                        className="text-center text-muted-foreground"
                        colSpan={6}
                      >
                        No templates found. Create your first template to get
                        started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Template rows with multiple conditional renders
                    templates?.templates?.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <div className="font-medium">{template.name}</div>
                          {template.description ? (
                            <div className="text-muted-foreground text-sm">
                              {template.description}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatType(template.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {template.business || (
                            <span className="text-muted-foreground">All</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              template.isActive ? "default" : "secondary"
                            }
                          >
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(template.updatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              onClick={() =>
                                previewMutation.mutate(template.id)
                              }
                              size="icon"
                              title="Preview"
                              variant="ghost"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleEdit(template)}
                              size="icon"
                              title="Edit"
                              variant="ghost"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {template.isDefault ? null : (
                              <Button
                                onClick={() => setDeleteTemplate(template)}
                                size="icon"
                                title="Delete"
                                variant="ghost"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <TemplateFormDialog
        formData={formData}
        onClose={() => setCreateOpen(false)}
        onSave={() => createMutation.mutate(formData)}
        open={createOpen}
        saving={createMutation.isPending}
        setFormData={setFormData}
        templateTypes={templateTypes}
        title="Create Email Template"
      />

      {/* Edit Dialog */}
      <TemplateFormDialog
        formData={formData}
        onClose={() => setEditTemplate(null)}
        onSave={() => {
          if (editTemplate) {
            updateMutation.mutate({ id: editTemplate.id, ...formData });
          }
        }}
        open={!!editTemplate}
        saving={updateMutation.isPending}
        setFormData={setFormData}
        templateTypes={templateTypes}
        title="Edit Email Template"
      />

      {/* Preview Dialog */}
      <Dialog onOpenChange={setPreviewOpen} open={previewOpen}>
        <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Template Preview
            </DialogTitle>
            <DialogDescription>
              Subject: {previewContent?.subject}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto rounded-md border">
            {previewContent ? (
              <iframe
                className="h-[500px] w-full"
                srcDoc={previewContent.html}
                title="Email Preview"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        onOpenChange={() => setDeleteTemplate(null)}
        open={!!deleteTemplate}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTemplate?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDeleteTemplate(null)} variant="outline">
              Cancel
            </Button>
            <Button
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteTemplate) {
                  deleteMutation.mutate(deleteTemplate.id);
                }
              }}
              variant="destructive"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type TemplateFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  title: string;
  formData: TemplateFormData;
  setFormData: React.Dispatch<React.SetStateAction<TemplateFormData>>;
  templateTypes: TemplateType[];
  saving: boolean;
};

function TemplateFormDialog({
  open,
  onClose,
  onSave,
  title,
  formData,
  setFormData,
  templateTypes,
  saving,
}: TemplateFormDialogProps) {
  const selectedType = templateTypes.find((t) => t.value === formData.type);

  return (
    <Dialog onOpenChange={onClose} open={open}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Configure email template settings and content
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Template Type</Label>
              <Select
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
                value={formData.type}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {templateTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business">Business</Label>
              <Select
                onValueChange={(value) => {
                  if (value === "ALL") {
                    setFormData((prev) => ({ ...prev, business: null }));
                  } else {
                    setFormData((prev) => ({ ...prev, business: value }));
                  }
                }}
                value={formData.business || "ALL"}
              >
                <SelectTrigger id="business">
                  <SelectValue placeholder="Select business" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Businesses</SelectItem>
                  <SelectItem value="GCMC">GCMC</SelectItem>
                  <SelectItem value="KAJ">KAJ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g., Welcome Email - Custom"
              value={formData.name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Brief description of this template"
              value={formData.description}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, subject: e.target.value }))
              }
              placeholder="e.g., Welcome to GK-Nexus, {{clientName}}!"
              value={formData.subject}
            />
          </div>

          {selectedType?.variables?.length ? (
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="mb-2 font-medium text-sm">Available Variables:</p>
              <div className="flex flex-wrap gap-2">
                {selectedType.variables.map((v) => (
                  <Badge key={v} variant="secondary">
                    {`{{${v}}}`}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="htmlContent">HTML Content</Label>
            <Textarea
              className="min-h-[200px] font-mono text-sm"
              id="htmlContent"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  htmlContent: e.target.value,
                }))
              }
              placeholder="Enter HTML email content..."
              value={formData.htmlContent}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="textContent">Plain Text Content (Optional)</Label>
            <Textarea
              className="min-h-[100px] font-mono text-sm"
              id="textContent"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  textContent: e.target.value,
                }))
              }
              placeholder="Enter plain text fallback..."
              value={formData.textContent}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              checked={formData.isActive}
              id="isActive"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  isActive: e.target.checked,
                }))
              }
              type="checkbox"
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button
            disabled={saving || !formData.name || !formData.subject}
            onClick={onSave}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Template"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
