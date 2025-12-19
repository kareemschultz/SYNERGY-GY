import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Download,
  Loader2,
  Percent,
  Send,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DiscountModal } from "@/components/invoices/discount-modal";
import { PaymentModal } from "@/components/invoices/payment-modal";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { client, queryClient } from "@/utils/orpc";
import { unwrapOrpc } from "@/utils/orpc-response";

export const Route = createFileRoute("/app/invoices/$invoice-id")({
  component: InvoiceDetailPage,
});

// Line item type
type InvoiceLineItem = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
};

// Payment type
type InvoicePayment = {
  id: string;
  paymentDate: string;
  paymentMethod: string;
  amount: string;
  referenceNumber: string | null;
  recordedBy: { name: string } | null;
};

// Invoice type for unwrapping
type InvoiceData = {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  amountPaid: string;
  amountDue: string;
  notes: string | null;
  terms: string | null;
  discountType: string | null;
  discountValue: string | null;
  discountReason: string | null;
  referenceNumber: string | null;
  business: string;
  clientId: string;
  client: { id: string; displayName: string; email: string | null } | null;
  matter: { id: string; title: string; referenceNumber: string } | null;
  items: InvoiceLineItem[];
  lineItems: InvoiceLineItem[];
  payments: InvoicePayment[];
  createdBy: { name: string } | null;
  sentBy: { name: string } | null;
  sentAt: string | null;
  paidDate: string | null;
  createdAt: string;
  updatedAt: string;
};

const statusLabels: Record<string, { label: string; className: string }> = {
  DRAFT: {
    label: "Draft",
    className: "bg-gray-500/10 text-gray-600 border-gray-200",
  },
  SENT: {
    label: "Sent",
    className: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  PAID: {
    label: "Paid",
    className: "bg-green-500/10 text-green-600 border-green-200",
  },
  OVERDUE: {
    label: "Overdue",
    className: "bg-red-500/10 text-red-600 border-red-200",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-gray-500/10 text-gray-600 border-gray-200",
  },
};

const statusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

const paymentMethodLabels: Record<string, string> = {
  CASH: "Cash",
  CHEQUE: "Cheque",
  BANK_TRANSFER: "Bank Transfer",
  CREDIT_CARD: "Credit Card",
  DEBIT_CARD: "Debit Card",
  MOBILE_MONEY: "Mobile Money",
  OTHER: "Other",
};

function formatCurrency(amount: string): string {
  return Number.parseFloat(amount).toFixed(2);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Auto-fix
function InvoiceDetailPage() {
  const { "invoice-id": invoiceId } = Route.useParams();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [status, setStatus] = useState<string>("");

  const {
    data: invoiceRaw,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => client.invoices.getById({ id: invoiceId }),
  });

  // Unwrap oRPC response envelope (v1.12+ wraps in { json: T })
  const invoice = unwrapOrpc<InvoiceData>(invoiceRaw);

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: string) =>
      client.invoices.update({
        id: invoiceId,
        status: newStatus as
          | "DRAFT"
          | "SENT"
          | "PAID"
          | "OVERDUE"
          | "CANCELLED",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Status updated successfully");
    },
    onError: (mutationError) => {
      toast.error(mutationError.message || "Failed to update status");
      if (invoice) {
        setStatus(invoice.status);
      }
    },
  });

  const downloadPdfMutation = useMutation({
    mutationFn: () => client.invoices.generatePdf({ id: invoiceId }),
    onSuccess: (data) => {
      // Convert base64 to blob and download
      const binaryString = atob(data.pdf);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i += 1) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate PDF");
    },
  });

  // Set initial status when invoice loads
  if (invoice && !status) {
    setStatus(invoice.status);
  }

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    updateStatusMutation.mutate(newStatus);
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (queryError || !invoice) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Invoice not found</p>
        <Button asChild variant="outline">
          <Link to="/app/invoices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Link>
        </Button>
      </div>
    );
  }

  const statusConfig = statusLabels[invoice.status];
  const canRecordPayment =
    Number.parseFloat(invoice.amountDue) > 0 &&
    invoice.status !== "CANCELLED" &&
    invoice.status !== "PAID";

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/app/invoices">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            {canRecordPayment ? (
              <Button onClick={() => setPaymentModalOpen(true)}>
                <CreditCard className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            ) : null}
          </div>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Invoices", href: "/app/invoices" },
          { label: invoice.invoiceNumber },
        ]}
        description={`Invoice for ${invoice.client?.displayName ?? "Unknown Client"}`}
        title={invoice.invoiceNumber}
      />

      <div className="p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Header Info */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Badge className={statusConfig.className} variant="outline">
                {statusConfig.label}
              </Badge>
              <Badge variant="outline">{invoice.business}</Badge>
            </div>

            {/* Status Change */}
            {invoice.status !== "PAID" ? (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">Status:</span>
                <Select onValueChange={handleStatusChange} value={status}>
                  <SelectTrigger className="w-40">
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
            ) : null}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="space-y-6 lg:col-span-2">
              {/* Client & Matter Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-muted-foreground text-sm">Client</p>
                      <Link
                        className="font-medium hover:underline"
                        params={{ clientId: invoice.clientId }}
                        to="/app/clients/$clientId"
                      >
                        {invoice.client?.displayName ?? "Unknown Client"}
                      </Link>
                      {!!invoice.client?.email && (
                        <p className="text-muted-foreground text-xs">
                          {invoice.client.email}
                        </p>
                      )}
                    </div>

                    {!!invoice.matter && (
                      <div>
                        <p className="text-muted-foreground text-sm">
                          Related Matter
                        </p>
                        <Link
                          className="font-medium hover:underline"
                          params={{ matterId: invoice.matter.id }}
                          to="/app/matters/$matterId"
                        >
                          {invoice.matter.referenceNumber}
                        </Link>
                        <p className="text-muted-foreground text-xs">
                          {invoice.matter.title}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-muted-foreground text-sm">
                        Invoice Date
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="font-medium">
                          {formatDate(invoice.invoiceDate)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-muted-foreground text-sm">Due Date</p>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="font-medium">
                          {formatDate(invoice.dueDate)}
                        </p>
                      </div>
                    </div>

                    {!!invoice.referenceNumber && (
                      <div>
                        <p className="text-muted-foreground text-sm">
                          Client Reference
                        </p>
                        <p className="font-medium">{invoice.referenceNumber}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Line Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Line Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.lineItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.quantity)}
                          </TableCell>
                          <TableCell className="text-right">
                            GYD {formatCurrency(item.unitPrice)}
                          </TableCell>
                          <TableCell className="text-right">
                            GYD {formatCurrency(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <Separator className="my-4" />

                  {/* Totals */}
                  <div className="flex justify-end">
                    <div className="w-72 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span>GYD {formatCurrency(invoice.subtotal)}</span>
                      </div>
                      {invoice.discountType !== "NONE" &&
                        Number.parseFloat(invoice.discountAmount || "0") >
                          0 && (
                          <div className="flex justify-between text-orange-600 text-sm">
                            <span className="flex items-center gap-1">
                              Discount
                              {invoice.discountType === "PERCENTAGE" && (
                                <span className="text-muted-foreground">
                                  ({invoice.discountValue}%)
                                </span>
                              )}
                              :
                            </span>
                            <span>
                              -GYD{" "}
                              {formatCurrency(invoice.discountAmount || "0")}
                            </span>
                          </div>
                        )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax:</span>
                        <span>GYD {formatCurrency(invoice.taxAmount)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total:</span>
                        <span>GYD {formatCurrency(invoice.totalAmount)}</span>
                      </div>
                      {Number.parseFloat(invoice.amountPaid) > 0 && (
                        <>
                          <div className="flex justify-between text-green-600 text-sm">
                            <span>Amount Paid:</span>
                            <span>
                              GYD {formatCurrency(invoice.amountPaid)}
                            </span>
                          </div>
                          <div className="flex justify-between font-semibold text-red-600">
                            <span>Amount Due:</span>
                            <span>GYD {formatCurrency(invoice.amountDue)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment History */}
              {!!invoice.payments && invoice.payments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead>Recorded By</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoice.payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              {formatDate(payment.paymentDate)}
                            </TableCell>
                            <TableCell>
                              {paymentMethodLabels[payment.paymentMethod]}
                            </TableCell>
                            <TableCell>
                              {payment.referenceNumber || (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {payment.recordedBy?.name || (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              GYD {formatCurrency(payment.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Additional Info */}
              {/* biome-ignore lint/nursery/noLeakedRender: Auto-fix */}
              {(invoice.terms || invoice.notes) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!!invoice.terms && (
                      <div>
                        <p className="mb-2 font-medium text-sm">
                          Payment Terms
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {invoice.terms}
                        </p>
                      </div>
                    )}
                    {!!invoice.notes && (
                      <div>
                        <p className="mb-2 font-medium text-sm">
                          Internal Notes
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {invoice.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {!!canRecordPayment && (
                    <Button
                      className="w-full justify-start"
                      onClick={() => setPaymentModalOpen(true)}
                      variant="outline"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Record Payment
                    </Button>
                  )}
                  <Button
                    className="w-full justify-start"
                    disabled={downloadPdfMutation.isPending}
                    onClick={() => downloadPdfMutation.mutate()}
                    variant="outline"
                  >
                    {downloadPdfMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    {downloadPdfMutation.isPending
                      ? "Generating..."
                      : "Download PDF"}
                  </Button>
                  {invoice.status === "DRAFT" && (
                    <>
                      <Button
                        className="w-full justify-start"
                        onClick={() => setDiscountModalOpen(true)}
                        variant="outline"
                      >
                        <Percent className="mr-2 h-4 w-4" />
                        {invoice.discountType !== "NONE"
                          ? "Edit Discount"
                          : "Apply Discount"}
                      </Button>
                      <Button
                        className="w-full justify-start"
                        onClick={() => handleStatusChange("SENT")}
                        variant="outline"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Mark as Sent
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Meta Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {!!invoice.createdBy && (
                    <div>
                      <p className="text-muted-foreground">Created By</p>
                      <p className="font-medium">{invoice.createdBy.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {formatDateTime(invoice.createdAt)}
                      </p>
                    </div>
                  )}
                  {!!invoice.sentAt && invoice.sentBy && (
                    <div>
                      <p className="text-muted-foreground">Sent By</p>
                      <p className="font-medium">{invoice.sentBy.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {formatDateTime(invoice.sentAt)}
                      </p>
                    </div>
                  )}
                  {!!invoice.paidDate && (
                    <div>
                      <p className="text-muted-foreground">Paid On</p>
                      <p className="font-medium">
                        {formatDate(invoice.paidDate)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        amountDue={invoice.amountDue}
        invoiceId={invoice.id}
        invoiceNumber={invoice.invoiceNumber}
        onOpenChange={setPaymentModalOpen}
        open={paymentModalOpen}
      />

      {/* Discount Modal */}
      {invoice.status === "DRAFT" && (
        <DiscountModal
          currentDiscountReason={invoice.discountReason || null}
          currentDiscountType={
            (invoice.discountType as "NONE" | "PERCENTAGE" | "FIXED_AMOUNT") ||
            "NONE"
          }
          currentDiscountValue={invoice.discountValue || "0"}
          invoiceId={invoice.id}
          invoiceNumber={invoice.invoiceNumber}
          onOpenChange={setDiscountModalOpen}
          open={discountModalOpen}
          subtotal={invoice.subtotal}
        />
      )}
    </div>
  );
}
