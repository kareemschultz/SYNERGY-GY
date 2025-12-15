import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
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
import { client, queryClient } from "@/utils/orpc";

const statusOptions = [
  { value: "NEW", label: "New" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "PENDING_CLIENT", label: "Pending Client" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "COMPLETE", label: "Complete" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

const priorityOptions = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
] as const;

type MatterStatus =
  | "NEW"
  | "IN_PROGRESS"
  | "PENDING_CLIENT"
  | "SUBMITTED"
  | "COMPLETE"
  | "CANCELLED";

type MatterPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

type MatterData = {
  id: string;
  title: string;
  description: string | null;
  status: MatterStatus;
  priority: MatterPriority;
  dueDate: string | null;
  estimatedFee: string | null;
  actualFee: string | null;
  isPaid: boolean;
  taxYear: number | null;
};

type EditMatterDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matter: MatterData;
};

export function EditMatterDialog({
  open,
  onOpenChange,
  matter,
}: EditMatterDialogProps) {
  const updateMutation = useMutation({
    mutationFn: async (values: Parameters<typeof client.matters.update>[0]) =>
      client.matters.update(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matter", matter.id] });
      queryClient.invalidateQueries({ queryKey: ["matters"] });
      toast.success("Matter updated successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update matter");
    },
  });

  const form = useForm({
    defaultValues: {
      title: matter.title,
      description: matter.description || "",
      status: matter.status,
      priority: matter.priority,
      dueDate: matter.dueDate || "",
      estimatedFee: matter.estimatedFee || "",
      actualFee: matter.actualFee || "",
      isPaid: matter.isPaid,
      taxYear: matter.taxYear ?? undefined,
    },
    onSubmit: ({ value }) => {
      if (!value.title.trim()) {
        toast.error("Title is required");
        return;
      }

      const normalize = (input: string | null | undefined) => {
        const trimmed = input?.trim();
        return trimmed ? trimmed : undefined;
      };

      const payload = {
        id: matter.id,
        ...value,
        status: value.status as MatterStatus,
        priority: value.priority as MatterPriority,
        taxYear: value.taxYear ?? undefined,
        dueDate: normalize(value.dueDate),
        estimatedFee: normalize(value.estimatedFee),
        actualFee: normalize(value.actualFee),
        description: normalize(value.description),
      } satisfies Parameters<typeof client.matters.update>[0];

      updateMutation.mutate(payload);
    },
  });

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form.reset]); // Added form.reset to dependencies

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Matter</DialogTitle>
          <DialogDescription>
            Update matter details. Changes are saved immediately.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-6 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className="space-y-4">
            <form.Field name="title">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Title *</Label>
                  <Input
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    value={field.state.value}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="description">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Description</Label>
                  <Textarea
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    rows={3}
                    value={field.state.value}
                  />
                </div>
              )}
            </form.Field>

            <div className="grid gap-4 md:grid-cols-2">
              <form.Field name="status">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Status</Label>
                    <Select
                      onValueChange={(value) =>
                        field.handleChange(value as MatterStatus)
                      }
                      value={field.state.value}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              <form.Field name="priority">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Priority</Label>
                    <Select
                      onValueChange={(value) =>
                        field.handleChange(value as MatterPriority)
                      }
                      value={field.state.value}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <form.Field name="dueDate">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Due Date</Label>
                    <Input
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      type="date"
                      value={field.state.value}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="taxYear">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Tax Year</Label>
                    <Input
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value // Fixed noLeakedRender
                            ? Number.parseInt(e.target.value, 10)
                            : undefined
                        )
                      }
                      type="number"
                      value={field.state.value ?? ""}
                    />
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <form.Field name="estimatedFee">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Estimated Fee</Label>
                    <Input
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="0.00"
                      value={field.state.value}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="actualFee">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Actual Fee</Label>
                    <Input
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="0.00"
                      value={field.state.value}
                    />
                  </div>
                )}
              </form.Field>
            </div>

            <form.Field name="isPaid">
              {(field) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={field.state.value}
                    id={field.name}
                    onCheckedChange={(checked) =>
                      field.handleChange(checked === true)
                    }
                  />
                  <Label htmlFor={field.name}>Payment Received</Label>
                </div>
              )}
            </form.Field>
          </div>
        </form>

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            disabled={updateMutation.isPending}
            onClick={() => form.handleSubmit()}
            type="submit"
          >
            {Boolean(updateMutation.isPending) && ( // Fixed noLeakedRender
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
