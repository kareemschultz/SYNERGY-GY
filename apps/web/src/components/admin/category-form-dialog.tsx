import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { client, queryClient } from "@/utils/orpc";

type CategoryData = {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
};

type CategoryFormDialogProps = {
  business: "GCMC" | "KAJ";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  category?: CategoryData | null;
};

export function CategoryFormDialog({
  business,
  open,
  onOpenChange,
  onSuccess,
  category,
}: CategoryFormDialogProps) {
  const isEditMode = !!category;
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // Populate form when editing
  useEffect(() => {
    if (category && open) {
      setName(category.name);
      setDisplayName(category.displayName);
      setDescription(category.description || "");
      setIcon(category.icon || "");
      setSortOrder(category.sortOrder);
      setIsActive(category.isActive);
    } else if (!open) {
      resetForm();
    }
  }, [category, open]);

  const createMutation = useMutation({
    mutationFn: () =>
      client.serviceCatalog.categories.create({
        business,
        name: name.toUpperCase().replace(/\s+/g, "_"),
        displayName,
        description: description || undefined,
        icon: icon || undefined,
        sortOrder,
        isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-service-categories"] });
      queryClient.invalidateQueries({ queryKey: ["service-categories"] });
      toast.success("Category created successfully");
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create category");
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      client.serviceCatalog.categories.update({
        id: category?.id || "",
        name: name.toUpperCase().replace(/\s+/g, "_"),
        displayName,
        description: description || undefined,
        icon: icon || undefined,
        sortOrder,
        isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-service-categories"] });
      queryClient.invalidateQueries({ queryKey: ["service-categories"] });
      toast.success("Category updated successfully");
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update category");
    },
  });

  const resetForm = () => {
    setName("");
    setDisplayName("");
    setDescription("");
    setIcon("");
    setSortOrder(0);
    setIsActive(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Display name is required");
      return;
    }
    if (isEditMode) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Service Category" : "Create Service Category"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `Update the ${category?.displayName} category`
              : `Add a new service category for ${business}`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (!name) {
                    setName(e.target.value.toUpperCase().replace(/\s+/g, "_"));
                  }
                }}
                placeholder="e.g., Training Services"
                value={displayName}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">System Name</Label>
              <Input
                id="name"
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., TRAINING_SERVICES"
                value={name}
              />
              <p className="text-muted-foreground text-xs">
                Auto-generated from display name. Used internally.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this category..."
                rows={2}
                value={description}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Icon (optional)</Label>
                <Input
                  id="icon"
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="e.g., graduation-cap"
                  value={icon}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                  type="number"
                  value={sortOrder}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={isActive}
                id="isActive"
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isEditMode ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
