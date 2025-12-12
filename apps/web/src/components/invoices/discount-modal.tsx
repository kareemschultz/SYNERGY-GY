import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { client, queryClient } from "@/utils/orpc";

type DiscountModalProps = {
  invoiceId: string;
  invoiceNumber: string;
  subtotal: string;
  currentDiscountType: "NONE" | "PERCENTAGE" | "FIXED_AMOUNT";
  currentDiscountValue: string;
  currentDiscountReason: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type DiscountFormValues = {
  discountType: "NONE" | "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: string;
  discountReason: string;
};

const discountTypes = [
  { value: "NONE", label: "No Discount" },
  { value: "PERCENTAGE", label: "Percentage (%)" },
  { value: "FIXED_AMOUNT", label: "Fixed Amount (GYD)" },
] as const;

export function DiscountModal({
  invoiceId,
  invoiceNumber,
  subtotal,
  currentDiscountType,
  currentDiscountValue,
  currentDiscountReason,
  open,
  onOpenChange,
}: DiscountModalProps) {
  const applyDiscountMutation = useMutation({
    mutationFn: async (values: DiscountFormValues) =>
      client.invoices.applyDiscount({
        invoiceId,
        discountType: values.discountType,
        discountValue:
          values.discountType === "NONE" ? "0" : values.discountValue,
        discountReason: values.discountReason || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Discount applied successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to apply discount");
    },
  });

  const form = useForm({
    defaultValues: {
      discountType: currentDiscountType,
      discountValue: currentDiscountValue,
      discountReason: currentDiscountReason || "",
    } satisfies DiscountFormValues,
    // biome-ignore lint/suspicious/useAwait: TanStack Form requires async submit handler
    onSubmit: async ({ value }) => {
      if (value.discountType !== "NONE") {
        const discountVal = Number.parseFloat(value.discountValue);
        if (Number.isNaN(discountVal) || discountVal < 0) {
          toast.error("Please enter a valid discount value");
          return;
        }
        if (value.discountType === "PERCENTAGE" && discountVal > 100) {
          toast.error("Percentage discount cannot exceed 100%");
          return;
        }
        if (
          value.discountType === "FIXED_AMOUNT" &&
          discountVal > Number.parseFloat(subtotal)
        ) {
          toast.error("Fixed discount cannot exceed subtotal");
          return;
        }
      }
      applyDiscountMutation.mutate(value);
    },
  });

  // Calculate preview for a given discount type and value
  const calculatePreview = (
    discType: DiscountFormValues["discountType"],
    discValue: string
  ) => {
    if (discType === "NONE") {
      return "0.00";
    }
    const value = Number.parseFloat(discValue) || 0;
    const sub = Number.parseFloat(subtotal);
    if (discType === "PERCENTAGE") {
      return ((sub * Math.min(value, 100)) / 100).toFixed(2);
    }
    return Math.min(value, sub).toFixed(2);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Apply Discount</DialogTitle>
          <DialogDescription>
            Apply a discount to invoice {invoiceNumber}. Subtotal: GYD{" "}
            {Number.parseFloat(subtotal).toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className="grid gap-4">
            {/* Discount Type */}
            <form.Field name="discountType">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Discount Type</Label>
                  <Select
                    onValueChange={(value) =>
                      field.handleChange(
                        value as DiscountFormValues["discountType"]
                      )
                    }
                    value={field.state.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select discount type" />
                    </SelectTrigger>
                    <SelectContent>
                      {discountTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>

            {/* Discount Value - rendered conditionally based on discount type */}
            <form.Subscribe selector={(state) => state.values.discountType}>
              {(discountType) =>
                discountType !== "NONE" && (
                  <form.Field name="discountValue">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>
                          {discountType === "PERCENTAGE"
                            ? "Discount Percentage"
                            : "Discount Amount (GYD)"}
                        </Label>
                        <Input
                          id={field.name}
                          max={
                            discountType === "PERCENTAGE"
                              ? "100"
                              : String(subtotal)
                          }
                          min="0"
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder={
                            discountType === "PERCENTAGE" ? "10" : "500.00"
                          }
                          step={discountType === "PERCENTAGE" ? "1" : "0.01"}
                          type="number"
                          value={field.state.value}
                        />
                        <p className="text-muted-foreground text-xs">
                          Discount amount: GYD{" "}
                          {calculatePreview(discountType, field.state.value)}
                        </p>
                      </div>
                    )}
                  </form.Field>
                )
              }
            </form.Subscribe>

            {/* Discount Reason */}
            <form.Field name="discountReason">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Reason for Discount</Label>
                  <Textarea
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Early payment, loyal customer, promotional discount..."
                    rows={3}
                    value={field.state.value}
                  />
                  <p className="text-muted-foreground text-xs">
                    Optional: Document the reason for this discount
                  </p>
                </div>
              )}
            </form.Field>
          </div>

          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={applyDiscountMutation.isPending} type="submit">
              {applyDiscountMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                "Apply Discount"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
