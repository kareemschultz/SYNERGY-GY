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

interface PaymentModalProps {
  invoiceId: string;
  invoiceNumber: string;
  amountDue: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PaymentFormValues {
  amount: string;
  paymentDate: string;
  paymentMethod:
    | "CASH"
    | "CHEQUE"
    | "BANK_TRANSFER"
    | "CREDIT_CARD"
    | "DEBIT_CARD"
    | "MOBILE_MONEY"
    | "OTHER";
  referenceNumber: string;
  notes: string;
}

const paymentMethods = [
  { value: "CASH", label: "Cash" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "DEBIT_CARD", label: "Debit Card" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
  { value: "OTHER", label: "Other" },
] as const;

export function PaymentModal({
  invoiceId,
  invoiceNumber,
  amountDue,
  open,
  onOpenChange,
}: PaymentModalProps) {
  const recordPaymentMutation = useMutation({
    mutationFn: async (values: PaymentFormValues) =>
      client.invoices.recordPayment({
        invoiceId,
        ...values,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Payment recorded successfully");
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to record payment");
    },
  });

  const form = useForm({
    defaultValues: {
      amount: amountDue,
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "CASH" as PaymentFormValues["paymentMethod"],
      referenceNumber: "",
      notes: "",
    } satisfies PaymentFormValues,
    onSubmit: async ({ value }) => {
      // Validate amount
      const paymentAmount = Number.parseFloat(value.amount);
      const remainingAmount = Number.parseFloat(amountDue);

      if (Number.isNaN(paymentAmount) || paymentAmount <= 0) {
        toast.error("Please enter a valid payment amount");
        return;
      }

      if (paymentAmount > remainingAmount) {
        toast.error(
          `Payment amount cannot exceed remaining balance of GYD ${remainingAmount}`
        );
        return;
      }

      if (!value.paymentMethod) {
        toast.error("Please select a payment method");
        return;
      }

      recordPaymentMutation.mutate(value);
    },
  });

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for invoice {invoiceNumber}. Outstanding balance:
            GYD {Number.parseFloat(amountDue).toFixed(2)}
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
            {/* Payment Amount */}
            <form.Field name="amount">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Payment Amount (GYD) *</Label>
                  <Input
                    id={field.name}
                    max={amountDue}
                    min="0.01"
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    type="number"
                    value={field.state.value}
                  />
                  <p className="text-muted-foreground text-xs">
                    Maximum: GYD {Number.parseFloat(amountDue).toFixed(2)}
                  </p>
                </div>
              )}
            </form.Field>

            {/* Payment Date */}
            <form.Field name="paymentDate">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Payment Date *</Label>
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

            {/* Payment Method */}
            <form.Field name="paymentMethod">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Payment Method *</Label>
                  <Select
                    onValueChange={(value) =>
                      field.handleChange(
                        value as PaymentFormValues["paymentMethod"]
                      )
                    }
                    value={field.state.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>

            {/* Reference Number */}
            <form.Field name="referenceNumber">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Reference Number</Label>
                  <Input
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Cheque number, transaction ID, etc."
                    value={field.state.value}
                  />
                  <p className="text-muted-foreground text-xs">
                    Optional: Cheque number, bank transaction ID, etc.
                  </p>
                </div>
              )}
            </form.Field>

            {/* Notes */}
            <form.Field name="notes">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Notes</Label>
                  <Textarea
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Additional notes about this payment..."
                    rows={3}
                    value={field.state.value}
                  />
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
            <Button disabled={recordPaymentMutation.isPending} type="submit">
              {recordPaymentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                "Record Payment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
