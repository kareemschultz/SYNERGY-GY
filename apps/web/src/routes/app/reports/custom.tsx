import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/app/reports/custom")({
  component: CustomReportsPage,
});

const REPORT_CATEGORIES = [
  { value: "CLIENT", label: "Client Reports" },
  { value: "MATTER", label: "Matter Reports" },
  { value: "FINANCIAL", label: "Financial Reports" },
  { value: "DEADLINE", label: "Deadline Reports" },
  { value: "DOCUMENT", label: "Document Reports" },
  { value: "STAFF", label: "Staff Reports" },
];

type CustomReport = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  queryTemplate: string | null;
  columns: unknown;
  parameters: unknown;
  isActive: boolean;
  createdAt: Date;
  createdBy: { name: string | null; email: string } | null;
};

function CustomReportsPage() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingReport, setEditingReport] = useState<CustomReport | null>(null);
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "CLIENT" as const,
    queryTemplate: "",
  });

  const { data: reports, isLoading } = useQuery({
    queryKey: ["customReports"],
    queryFn: () => client.reports.listCustomReports(),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      client.reports.createCustomReport({
        name: data.name,
        description: data.description || undefined,
        category: data.category,
        queryTemplate: data.queryTemplate,
        columns: [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customReports"] });
      toast.success("Custom report created");
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create report"
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string } & typeof formData) =>
      client.reports.updateCustomReport({
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        category: data.category,
        queryTemplate: data.queryTemplate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customReports"] });
      toast.success("Custom report updated");
      setEditingReport(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update report"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => client.reports.deleteCustomReport({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customReports"] });
      toast.success("Custom report deleted");
      setDeleteReportId(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete report"
      );
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "CLIENT",
      queryTemplate: "",
    });
  };

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error("Report name is required");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!(editingReport && formData.name.trim())) {
      toast.error("Report name is required");
      return;
    }
    updateMutation.mutate({ id: editingReport.id, ...formData });
  };

  const openEditDialog = (report: CustomReport) => {
    setEditingReport(report);
    setFormData({
      name: report.name,
      description: report.description || "",
      category: report.category as typeof formData.category,
      queryTemplate: report.queryTemplate || "",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/app/reports">
          <Button size="icon" variant="ghost">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          description="Create and manage your own custom reports"
          title="Custom Reports"
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Custom Report
        </Button>
      </div>

      {reports && reports.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{report.name}</CardTitle>
                  <Badge variant="outline">{report.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 line-clamp-2 text-muted-foreground text-sm">
                  {report.description || "No description"}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">
                    Created by {report.createdBy?.name || "Unknown"}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => openEditDialog(report as CustomReport)}
                      size="icon"
                      variant="ghost"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => setDeleteReportId(report.id)}
                      size="icon"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-muted-foreground">
              No custom reports yet. Create your first custom report to get
              started.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Custom Report
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog onOpenChange={setShowCreateDialog} open={showCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Custom Report</DialogTitle>
            <DialogDescription>
              Define a new custom report with your own query and columns.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Report Name</Label>
              <Input
                id="name"
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Monthly Client Summary"
                value={formData.name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe what this report shows..."
                value={formData.description}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    category: value as typeof formData.category,
                  })
                }
                value={formData.category}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="queryTemplate">Query Template (Advanced)</Label>
              <Textarea
                className="font-mono text-sm"
                id="queryTemplate"
                onChange={(e) =>
                  setFormData({ ...formData, queryTemplate: e.target.value })
                }
                placeholder="SELECT * FROM clients WHERE ..."
                rows={5}
                value={formData.queryTemplate}
              />
              <p className="text-muted-foreground text-xs">
                Advanced: Define a custom SQL query template for this report.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowCreateDialog(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={createMutation.isPending} onClick={handleCreate}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        onOpenChange={(open) => !open && setEditingReport(null)}
        open={editingReport !== null}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Custom Report</DialogTitle>
            <DialogDescription>
              Update your custom report settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Report Name</Label>
              <Input
                id="edit-name"
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                value={formData.name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                value={formData.description}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    category: value as typeof formData.category,
                  })
                }
                value={formData.category}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-queryTemplate">Query Template</Label>
              <Textarea
                className="font-mono text-sm"
                id="edit-queryTemplate"
                onChange={(e) =>
                  setFormData({ ...formData, queryTemplate: e.target.value })
                }
                rows={5}
                value={formData.queryTemplate}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setEditingReport(null)} variant="outline">
              Cancel
            </Button>
            <Button disabled={updateMutation.isPending} onClick={handleUpdate}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        onOpenChange={(open) => !open && setDeleteReportId(null)}
        open={deleteReportId !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom Report?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The custom report will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleteReportId && deleteMutation.mutate(deleteReportId)
              }
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
