/**
 * Stripe Webhook Handler
 *
 * Processes Stripe webhook events for payment confirmations.
 * This is a Hono route handler, not an oRPC procedure.
 */

import { db, invoice, invoicePayment } from "@SYNERGY-GY/db";
import { eq } from "drizzle-orm";
import type { Context } from "hono";
import type Stripe from "stripe";

/**
 * Handle checkout session completed - records payment for invoice
 */
async function handleCheckoutCompleted(data: {
  invoiceId: string;
  amountPaid: number;
  paymentIntentId: string;
}): Promise<void> {
  const { invoiceId, amountPaid, paymentIntentId } = data;

  if (!invoiceId) {
    console.warn("[StripeWebhook] No invoiceId in checkout session");
    return;
  }

  const inv = await db.query.invoice.findFirst({
    where: eq(invoice.id, invoiceId),
  });

  if (!inv) {
    console.warn(`[StripeWebhook] Invoice not found: ${invoiceId}`);
    return;
  }

  // Calculate payment amount (convert from smallest unit)
  const paymentAmount = (amountPaid / 100).toFixed(2);
  const newAmountPaid = (
    Number.parseFloat(inv.amountPaid) + Number.parseFloat(paymentAmount)
  ).toFixed(2);
  const newAmountDue = (
    Number.parseFloat(inv.totalAmount) - Number.parseFloat(newAmountPaid)
  ).toFixed(2);

  // Determine new status
  const isPaid = Number.parseFloat(newAmountDue) <= 0;
  const newStatus = isPaid ? "PAID" : inv.status;

  // Record payment
  await db.insert(invoicePayment).values({
    invoiceId,
    amount: paymentAmount,
    paymentDate: new Date().toISOString().split("T")[0] ?? "",
    paymentMethod: "STRIPE",
    referenceNumber: paymentIntentId,
    notes: "Online payment via Stripe",
  });

  // Update invoice
  await db
    .update(invoice)
    .set({
      amountPaid: newAmountPaid,
      amountDue: newAmountDue,
      status: newStatus,
      stripePaymentIntentId: paymentIntentId,
      paidDate: isPaid ? new Date().toISOString().split("T")[0] : inv.paidDate,
    })
    .where(eq(invoice.id, invoiceId));

  console.log(
    `[StripeWebhook] Payment recorded for invoice ${inv.invoiceNumber}: GYD ${paymentAmount}`
  );
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(c: Context): Promise<Response> {
  const { isStripeConfigured, verifyWebhookSignature, parseWebhookEvent } =
    await import("../utils/stripe");

  if (!isStripeConfigured()) {
    return c.json({ error: "Stripe not configured" }, 500);
  }

  // Get raw body and signature
  const signature = c.req.header("stripe-signature");
  if (!signature) {
    return c.json({ error: "Missing stripe-signature header" }, 400);
  }

  let rawBody: string;
  try {
    rawBody = await c.req.text();
  } catch {
    return c.json({ error: "Failed to read request body" }, 400);
  }

  // Verify signature and parse event
  let event: Stripe.Event;
  try {
    event = verifyWebhookSignature(rawBody, signature);
  } catch (err) {
    console.error("[StripeWebhook] Signature verification failed:", err);
    return c.json({ error: "Invalid signature" }, 400);
  }

  console.log(`[StripeWebhook] Received event: ${event.type}`);

  // Parse into our internal format
  const parsedEvent = parseWebhookEvent(event);
  if (!parsedEvent) {
    // Event type not handled, acknowledge receipt
    return c.json({ received: true, handled: false });
  }

  try {
    switch (parsedEvent.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(parsedEvent.data);
        break;
      }

      case "invoice.payment_succeeded": {
        const { subscriptionId } = parsedEvent.data;
        console.log(
          `[StripeWebhook] Recurring payment succeeded for subscription ${subscriptionId}`
        );
        // TODO: Handle recurring invoice generation
        break;
      }

      case "customer.subscription.deleted": {
        const { subscriptionId } = parsedEvent.data;
        console.log(
          `[StripeWebhook] Subscription cancelled: ${subscriptionId}`
        );
        // TODO: Update recurring invoice status to CANCELLED
        break;
      }

      case "payment_intent.payment_failed": {
        const { invoiceId, errorMessage } = parsedEvent.data;
        console.error(
          `[StripeWebhook] Payment failed for invoice ${invoiceId}: ${errorMessage}`
        );
        break;
      }

      default: {
        // Type guard: should never reach here as parseWebhookEvent filters event types
        const _exhaustive: never = parsedEvent;
        console.warn(`[StripeWebhook] Unhandled event type: ${_exhaustive}`);
      }
    }

    return c.json({ received: true, handled: true });
  } catch (err) {
    console.error("[StripeWebhook] Error processing event:", err);
    return c.json({ error: "Webhook processing failed" }, 500);
  }
}
