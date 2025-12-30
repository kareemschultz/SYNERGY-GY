/**
 * Public Invoice Payment Page
 *
 * Allows clients to view and pay invoices using a secure payment token.
 * No authentication required - uses token-based access.
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle,
  CreditCard,
  FileText,
  Loader2,
  Receipt,
} from "lucide-react";
import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { client as orpcClient } from "@/utils/orpc";
import { unwrapOrpc } from "@/utils/orpc-response";

export const Route = createFileRoute("/pay/$token")({
  component: PublicPaymentPage,
});

// Types
type LineItem = {
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
};

type InvoiceData = {
  id: string;
  invoiceNumber: string;
  business: string;
  status: string;
  invoiceDate: string;
  dueDate: string;
  clientName: string;
  clientEmail: string | null;
  lineItems: LineItem[];
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  amountPaid: string;
  amountDue: string;
  notes: string | null;
  terms: string | null;
  stripePaymentLinkUrl: string | null;
};

// Subcomponents
function LoadingView(): ReactNode {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading invoice...</p>
      </div>
    </div>
  );
}

function ErrorView(): ReactNode {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <CardTitle>Invoice Not Found</CardTitle>
          </div>
          <CardDescription>
            This payment link may have expired or is invalid.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Please contact the business that sent you this invoice for
            assistance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function LineItemRow({ item }: { item: LineItem }): ReactNode {
  return (
    <div className="flex items-start justify-between text-sm">
      <div className="flex-1">
        <p>{item.description}</p>
        <p className="text-muted-foreground text-xs">
          {item.quantity} × GYD {Number.parseFloat(item.unitPrice).toFixed(2)}
        </p>
      </div>
      <span className="font-medium">
        GYD {Number.parseFloat(item.amount).toFixed(2)}
      </span>
    </div>
  );
}

function InvoiceTotals({ invoice }: { invoice: InvoiceData }): ReactNode {
  const discountAmount = Number.parseFloat(invoice.discountAmount);
  const taxAmount = Number.parseFloat(invoice.taxAmount);
  const amountPaid = Number.parseFloat(invoice.amountPaid);
  const amountDue = Number.parseFloat(invoice.amountDue);
  const isOverdue = invoice.status === "OVERDUE";

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span>GYD {Number.parseFloat(invoice.subtotal).toFixed(2)}</span>
      </div>
      {discountAmount > 0 ? (
        <div className="flex justify-between text-green-600 text-sm">
          <span>Discount</span>
          <span>-GYD {discountAmount.toFixed(2)}</span>
        </div>
      ) : null}
      {taxAmount > 0 ? (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax</span>
          <span>GYD {taxAmount.toFixed(2)}</span>
        </div>
      ) : null}
      <Separator />
      <div className="flex justify-between font-medium">
        <span>Total</span>
        <span>GYD {Number.parseFloat(invoice.totalAmount).toFixed(2)}</span>
      </div>
      {amountPaid > 0 ? (
        <div className="flex justify-between text-green-600 text-sm">
          <span>Amount Paid</span>
          <span>-GYD {amountPaid.toFixed(2)}</span>
        </div>
      ) : null}
      <div className="flex justify-between font-bold text-lg">
        <span>Amount Due</span>
        <span className={isOverdue ? "text-destructive" : ""}>
          GYD {amountDue.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

function PaymentSection({
  invoice,
  stripeAvailable,
  onPay,
  isPending,
  error,
}: {
  invoice: InvoiceData;
  stripeAvailable: boolean;
  onPay: () => void;
  isPending: boolean;
  error: Error | null;
}): ReactNode {
  const amountDue = Number.parseFloat(invoice.amountDue);

  if (!stripeAvailable) {
    return (
      <Alert>
        <Receipt className="h-4 w-4" />
        <AlertTitle>Online Payment Not Available</AlertTitle>
        <AlertDescription>
          Please contact {invoice.business} for payment instructions.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Button className="w-full" disabled={isPending} onClick={onPay} size="lg">
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Redirecting to Payment...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay GYD {amountDue.toFixed(2)} Now
          </>
        )}
      </Button>
      {error ? (
        <p className="text-destructive text-sm">
          {error.message || "Failed to create checkout session"}
        </p>
      ) : null}
      <p className="text-center text-muted-foreground text-xs">
        Secure payment powered by Stripe
      </p>
    </>
  );
}

// Main component
function PublicPaymentPage(): ReactNode {
  const { token } = Route.useParams();
  const searchParams = Route.useSearch() as { cancelled?: string };

  // Fetch invoice details using payment token
  const {
    data: invoiceRaw,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["publicPayment", "invoice", token],
    queryFn: () => orpcClient.publicPayment.getInvoiceByToken({ token }),
  });

  const invoice = unwrapOrpc<InvoiceData>(invoiceRaw);

  // Check Stripe availability
  const { data: stripeStatusRaw } = useQuery({
    queryKey: ["publicPayment", "stripeAvailability"],
    queryFn: () => orpcClient.publicPayment.checkStripeAvailability(),
  });

  const stripeStatus = unwrapOrpc<{ available: boolean; currency: string }>(
    stripeStatusRaw
  );

  // Create checkout session mutation
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const response = await orpcClient.publicPayment.createCheckoutSession({
        token,
      });
      return unwrapOrpc<{ checkoutUrl: string }>(response);
    },
    onSuccess: (data) => {
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
  });

  if (isLoading) {
    return <LoadingView />;
  }

  if (error || !invoice) {
    return <ErrorView />;
  }

  const amountDue = Number.parseFloat(invoice.amountDue);
  const isPaid = amountDue <= 0;
  const isOverdue = invoice.status === "OVERDUE";
  const wasCancelled = searchParams.cancelled === "true";

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto max-w-3xl px-4">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">{invoice.business}</span>
          </div>
          <h1 className="font-bold text-2xl">Invoice Payment</h1>
          <p className="mt-2 text-muted-foreground">
            Invoice #{invoice.invoiceNumber}
          </p>
        </div>

        {/* Cancelled Alert */}
        {wasCancelled ? (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Payment Cancelled</AlertTitle>
            <AlertDescription>
              Your payment was cancelled. You can try again when you're ready.
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Already Paid Alert */}
        {isPaid ? (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">
              Invoice Already Paid
            </AlertTitle>
            <AlertDescription className="text-green-700">
              This invoice has been fully paid. Thank you for your payment!
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Invoice Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Invoice Details
                </CardTitle>
                <CardDescription>
                  For {invoice.clientName}
                  {invoice.clientEmail ? ` (${invoice.clientEmail})` : ""}
                </CardDescription>
              </div>
              <Badge variant={isOverdue ? "destructive" : "secondary"}>
                {invoice.status}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Dates */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Invoice Date:</span>
                <span>
                  {new Date(invoice.invoiceDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Due Date:</span>
                <span
                  className={isOverdue ? "font-medium text-destructive" : ""}
                >
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <Separator />

            {/* Line Items */}
            <div>
              <h3 className="mb-3 font-medium">Items</h3>
              <div className="space-y-2">
                {invoice.lineItems.map((item) => (
                  <LineItemRow
                    item={item}
                    key={`${item.description}-${item.amount}`}
                  />
                ))}
              </div>
            </div>

            <Separator />

            {/* Totals */}
            <InvoiceTotals invoice={invoice} />

            {/* Notes/Terms */}
            {invoice.notes ? (
              <>
                <Separator />
                <div>
                  <h3 className="mb-2 font-medium text-sm">Notes</h3>
                  <p className="whitespace-pre-line text-muted-foreground text-sm">
                    {invoice.notes}
                  </p>
                </div>
              </>
            ) : null}

            {invoice.terms ? (
              <div>
                <h3 className="mb-2 font-medium text-sm">Payment Terms</h3>
                <p className="whitespace-pre-line text-muted-foreground text-sm">
                  {invoice.terms}
                </p>
              </div>
            ) : null}
          </CardContent>

          {/* Payment Action */}
          {isPaid ? null : (
            <CardFooter className="flex flex-col gap-4 border-t bg-muted/30 pt-6">
              <PaymentSection
                error={checkoutMutation.error}
                invoice={invoice}
                isPending={checkoutMutation.isPending}
                onPay={() => checkoutMutation.mutate()}
                stripeAvailable={stripeStatus?.available ?? false}
              />
            </CardFooter>
          )}
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-muted-foreground text-sm">
          <p>Questions about this invoice?</p>
          <p>Contact {invoice.business} for assistance.</p>
        </div>
      </div>
    </div>
  );
}
