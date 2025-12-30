/**
 * Payment Success Page
 *
 * Displayed after a successful Stripe checkout payment.
 */

import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Home, Loader2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { client as orpcClient } from "@/utils/orpc";
import { unwrapOrpc } from "@/utils/orpc-response";

export const Route = createFileRoute("/pay/success")({
  component: PaymentSuccessPage,
});

function PaymentSuccessPage() {
  const searchParams = Route.useSearch() as {
    invoice?: string;
    session_id?: string;
  };

  const invoiceId = searchParams.invoice;
  const sessionId = searchParams.session_id;

  // Verify payment success
  const { data: resultRaw, isLoading } = useQuery({
    queryKey: ["publicPayment", "verifySuccess", invoiceId, sessionId],
    queryFn: () =>
      orpcClient.publicPayment.verifyPaymentSuccess({
        invoiceId: invoiceId || "",
        sessionId,
      }),
    enabled: Boolean(invoiceId),
  });

  const result = unwrapOrpc<{
    success: boolean;
    invoiceNumber: string;
    status: string;
    message: string;
  }>(resultRaw);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-700">
            Payment Successful!
          </CardTitle>
          <CardDescription className="text-base">
            {result?.message || "Thank you for your payment!"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {result?.invoiceNumber ? (
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Receipt className="h-4 w-4" />
                <span>Invoice #{result.invoiceNumber}</span>
              </div>
              <p className="mt-2 font-medium text-green-600">{result.status}</p>
            </div>
          ) : null}

          <p className="text-muted-foreground text-sm">
            A confirmation receipt will be sent to your email address. If you
            have any questions, please contact the business.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full" variant="outline">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
