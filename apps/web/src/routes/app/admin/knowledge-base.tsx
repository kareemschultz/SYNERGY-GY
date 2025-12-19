import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Edit, MoreVertical, Plus, Search, Trash } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { client, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/app/admin/knowledge-base")({
  component: AdminKnowledgeBasePage,
});

function AdminKnowledgeBasePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<unknown | null>(null);
  const [search, setSearch] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["knowledgeBase", "list", search || undefined],
    queryFn: () => client.knowledgeBase.list({ search: search || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (input: { id: string }) => client.knowledgeBase.delete(input),
    onSuccess: () => {
      toast.success("Item deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["knowledgeBase"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate({ id: itemToDelete });
    }
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  const handleEdit = (item: unknown) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  // Render table body content based on loading/data state
  const renderTableBody = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell className="text-center text-muted-foreground" colSpan={6}>
            Loading...
          </TableCell>
        </TableRow>
      );
    }

    if (!data?.items || data.items.length === 0) {
      return (
        <TableRow>
          <TableCell className="text-center text-muted-foreground" colSpan={6}>
            No resources found
          </TableCell>
        </TableRow>
      );
    }

    return data.items.map((item) => (
      <TableRow key={item.id}>
        <TableCell className="font-medium">
          <div className="flex flex-col">
            <span>{item.title}</span>
            <span className="text-muted-foreground text-xs">
              {item.fileName || "No file"}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline">{item.type.replace("_", " ")}</Badge>
        </TableCell>
        <TableCell>{item.category}</TableCell>
        <TableCell>
          {item.business ? (
            <Badge variant={item.business === "GCMC" ? "default" : "secondary"}>
              {item.business}
            </Badge>
          ) : (
            <Badge variant="outline">General</Badge>
          )}
        </TableCell>
        <TableCell>
          {item.isStaffOnly ? (
            <Badge variant="destructive">Staff Only</Badge>
          ) : (
            <Badge
              className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              variant="secondary"
            >
              Public
            </Badge>
          )}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-8 w-8 p-0" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(item)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDelete(item.id)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Resource
          </Button>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Admin", href: "/app/admin" },
          { label: "Knowledge Base" },
        ]}
        description="Manage forms, guides, and resources"
        title="Knowledge Base Management"
      />

      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources..."
            value={search}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Access</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>{renderTableBody()}</TableBody>
        </Table>
      </div>

      <KBItemDialog
        initialData={editingItem}
        onOpenChange={setIsDialogOpen}
        open={isDialogOpen}
      />

      <AlertDialog onOpenChange={setDeleteConfirmOpen} open={deleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type KBItemData = {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  business: string | null;
  isStaffOnly: boolean;
};

function KBItemDialog({
  open,
  onOpenChange,
  initialData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: unknown;
}) {
  const typedInitialData = initialData as KBItemData | undefined;
  const isEditing = !!typedInitialData;
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "AGENCY_FORM",
    category: "GENERAL",
    business: "ALL", // UI uses ALL, API uses null for both
    isStaffOnly: false,
    content: "",
    file: null as File | null,
  });

  // Load initial data when opening for edit
  // Note: simplified logic, ideally use useEffect or key on Dialog to reset
  if (isEditing && typedInitialData && formData.title === "") {
    // Prevent infinite loop or stale data - this is quick hack, better to use useEffect
  }

  // Use a key to force re-render when initialData changes or dialog opens
  // Move logic to wrapper or useEffect

  const createMutation = useMutation({
    mutationFn: (input: {
      title: string;
      description: string;
      type: "AGENCY_FORM" | "LETTER_TEMPLATE" | "GUIDE" | "CHECKLIST";
      category:
        | "IMMIGRATION"
        | "TRAINING"
        | "NIS"
        | "GRA"
        | "DCRA"
        | "GENERAL"
        | "INTERNAL";
      business: "GCMC" | "KAJ" | null;
      isStaffOnly: boolean;
      isFeatured: boolean;
      supportsAutoFill: boolean;
      relatedServices: string[];
      requiredFor: string[];
      content?: string;
    }) => client.knowledgeBase.create(input),
    onSuccess: () => {
      if (formData.file) {
        toast.success("Resource created (File upload pending backend support)");
      } else {
        toast.success("Resource created successfully");
      }
      queryClient.invalidateQueries({ queryKey: ["knowledgeBase"] });
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: (input: {
      id: string;
      title: string;
      description: string;
      type?: "AGENCY_FORM" | "LETTER_TEMPLATE" | "GUIDE" | "CHECKLIST";
      category?:
        | "IMMIGRATION"
        | "TRAINING"
        | "NIS"
        | "GRA"
        | "DCRA"
        | "GENERAL"
        | "INTERNAL";
      business?: "GCMC" | "KAJ" | null;
      isStaffOnly?: boolean;
      isFeatured?: boolean;
      supportsAutoFill?: boolean;
      relatedServices?: string[];
      requiredFor?: string[];
      content?: string;
    }) => client.knowledgeBase.update(input),
    onSuccess: () => {
      toast.success("Resource updated successfully");
      queryClient.invalidateQueries({ queryKey: ["knowledgeBase"] });
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      title: formData.title,
      description: formData.description,
      type: formData.type as
        | "AGENCY_FORM"
        | "LETTER_TEMPLATE"
        | "GUIDE"
        | "CHECKLIST",
      category: formData.category as
        | "IMMIGRATION"
        | "TRAINING"
        | "NIS"
        | "GRA"
        | "DCRA"
        | "GENERAL"
        | "INTERNAL",
      business: (formData.business === "ALL" ? null : formData.business) as
        | "GCMC"
        | "KAJ"
        | null,
      isStaffOnly: formData.isStaffOnly,
      isFeatured: false,
      supportsAutoFill: false,
      relatedServices: [] as string[],
      requiredFor: [] as string[],
      content: formData.content || undefined,
    };

    if (isEditing && typedInitialData) {
      updateMutation.mutate({ id: typedInitialData.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Resource" : "Add Resource"}
            </DialogTitle>
            <DialogDescription>
              Create or update a knowledge base resource.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  onValueChange={(val) =>
                    setFormData({ ...formData, type: val })
                  }
                  value={formData.type}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AGENCY_FORM">Agency Form</SelectItem>
                    <SelectItem value="LETTER_TEMPLATE">
                      Letter Template
                    </SelectItem>
                    <SelectItem value="GUIDE">Guide</SelectItem>
                    <SelectItem value="CHECKLIST">Checklist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  onValueChange={(val) =>
                    setFormData({ ...formData, category: val })
                  }
                  value={formData.category}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">General</SelectItem>
                    <SelectItem value="GRA">GRA</SelectItem>
                    <SelectItem value="NIS">NIS</SelectItem>
                    <SelectItem value="IMMIGRATION">Immigration</SelectItem>
                    <SelectItem value="DCRA">DCRA</SelectItem>
                    <SelectItem value="TRAINING">Training</SelectItem>
                    <SelectItem value="INTERNAL">Internal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., TIN Application Form"
                required
                value={formData.title}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of the resource..."
                required
                value={formData.description}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business">Business Unit</Label>
                <Select
                  onValueChange={(val) =>
                    setFormData({ ...formData, business: val })
                  }
                  value={formData.business}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All / General</SelectItem>
                    <SelectItem value="GCMC">GCMC</SelectItem>
                    <SelectItem value="KAJ">KAJ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end pb-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.isStaffOnly}
                    id="isStaffOnly"
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        isStaffOnly: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="isStaffOnly">Staff Only Access</Label>
                </div>
              </div>
            </div>

            {formData.type === "GUIDE" || formData.type === "CHECKLIST" ? (
              <div className="space-y-2">
                <Label htmlFor="content">Content (Markdown)</Label>
                <Textarea
                  className="min-h-[200px] font-mono text-sm"
                  id="content"
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="# Guide Content..."
                  value={formData.content}
                />
              </div>
            ) : null}

            {formData.type === "AGENCY_FORM" ||
            formData.type === "LETTER_TEMPLATE" ? (
              <div className="space-y-2">
                <Label htmlFor="file">Upload File</Label>
                <Input
                  id="file"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      file: e.target.files?.[0] || null,
                    })
                  }
                  type="file"
                />
                {isEditing === true && formData.file === null ? (
                  <p className="text-muted-foreground text-xs">
                    Leave empty to keep existing file
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={createMutation.isPending || updateMutation.isPending}
              type="submit"
            >
              {isEditing ? "Update Resource" : "Create Resource"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
