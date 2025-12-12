import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { client, queryClient } from "@/utils/orpc";

type ServiceFormDialogProps = {
  business: "GCMC" | "KAJ";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

const pricingTypes = [
  { value: "FIXED", label: "Fixed Price" },
  { value: "RANGE", label: "Price Range" },
  { value: "TIERED", label: "Tiered Pricing" },
  { value: "CUSTOM", label: "Custom Quote" },
] as const;

export function ServiceFormDialog({
  business,
  open,
  onOpenChange,
  onSuccess,
}: ServiceFormDialogProps) {
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [pricingType, setPricingType] = useState<
    "FIXED" | "RANGE" | "TIERED" | "CUSTOM"
  >("FIXED");
  const [basePrice, setBasePrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [typicalDuration, setTypicalDuration] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Fetch categories for this business
  const { data: categoriesData } = useQuery({
    queryKey: ["admin-service-categories", business],
    queryFn: () =>
      client.serviceCatalog.categories.list({
        business,
        isActive: true,
      }),
    enabled: open,
  });

  const categories = categoriesData?.categories || [];

  const createMutation = useMutation({
    mutationFn: () =>
      client.serviceCatalog.services.create({
        categoryId,
        business,
        name: name.toUpperCase().replace(/\s+/g, "_"),
        displayName,
        description: description || undefined,
        shortDescription: shortDescription || undefined,
        pricingType,
        basePrice: basePrice || undefined,
        maxPrice: maxPrice || undefined,
        typicalDuration: typicalDuration || undefined,
        sortOrder,
        isActive,
        isFeatured,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["admin-service-categories"] });
      toast.success("Service created successfully");
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create service");
    },
  });

  const resetForm = () => {
    setCategoryId("");
    setName("");
    setDisplayName("");
    setDescription("");
    setShortDescription("");
    setPricingType("FIXED");
    setBasePrice("");
    setMaxPrice("");
    setTypicalDuration("");
    setSortOrder(0);
    setIsActive(true);
    setIsFeatured(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }
    if (!displayName.trim()) {
      toast.error("Display name is required");
      return;
    }
    createMutation.mutate();
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Service</DialogTitle>
          <DialogDescription>
            Add a new service to the {business} catalog
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label>Category *</Label>
              {categories.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No categories available. Create a category first.
                </p>
              ) : (
                <Select onValueChange={setCategoryId} value={categoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="serviceDisplayName">Display Name *</Label>
              <Input
                id="serviceDisplayName"
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (!name) {
                    setName(e.target.value.toUpperCase().replace(/\s+/g, "_"));
                  }
                }}
                placeholder="e.g., Human Resource Management Training"
                value={displayName}
              />
            </div>

            {/* System Name */}
            <div className="space-y-2">
              <Label htmlFor="serviceName">System Name</Label>
              <Input
                id="serviceName"
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., HR_MANAGEMENT_TRAINING"
                value={name}
              />
              <p className="text-muted-foreground text-xs">
                Auto-generated. Used internally.
              </p>
            </div>

            {/* Short Description */}
            <div className="space-y-2">
              <Label htmlFor="serviceShortDesc">Short Description</Label>
              <Input
                id="serviceShortDesc"
                maxLength={150}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Brief one-liner description"
                value={shortDescription}
              />
            </div>

            {/* Full Description */}
            <div className="space-y-2">
              <Label htmlFor="serviceDesc">Full Description</Label>
              <Textarea
                id="serviceDesc"
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of the service..."
                rows={3}
                value={description}
              />
            </div>

            {/* Pricing Section */}
            <div className="space-y-4 rounded-lg border p-4">
              <h4 className="font-medium text-sm">Pricing</h4>

              <div className="space-y-2">
                <Label>Pricing Type</Label>
                <Select
                  onValueChange={(v) =>
                    setPricingType(v as "FIXED" | "RANGE" | "TIERED" | "CUSTOM")
                  }
                  value={pricingType}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pricingTypes.map((pt) => (
                      <SelectItem key={pt.value} value={pt.value}>
                        {pt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">
                    {pricingType === "RANGE"
                      ? "Min Price (GYD)"
                      : "Base Price (GYD)"}
                  </Label>
                  <Input
                    id="basePrice"
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="e.g., 25000"
                    value={basePrice}
                  />
                </div>

                {pricingType === "RANGE" ? (
                  <div className="space-y-2">
                    <Label htmlFor="maxPrice">Max Price (GYD)</Label>
                    <Input
                      id="maxPrice"
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="e.g., 50000"
                      value={maxPrice}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            {/* Duration & Sort Order */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Typical Duration</Label>
                <Input
                  id="duration"
                  onChange={(e) => setTypicalDuration(e.target.value)}
                  placeholder="e.g., 2-5 days"
                  value={typicalDuration}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceSortOrder">Sort Order</Label>
                <Input
                  id="serviceSortOrder"
                  onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                  type="number"
                  value={sortOrder}
                />
              </div>
            </div>

            {/* Status Toggles */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={isActive}
                  id="serviceIsActive"
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="serviceIsActive">Active</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={isFeatured}
                  id="serviceIsFeatured"
                  onCheckedChange={setIsFeatured}
                />
                <Label htmlFor="serviceIsFeatured">Featured</Label>
              </div>
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
            <Button
              disabled={createMutation.isPending || categories.length === 0}
              type="submit"
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create Service
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
