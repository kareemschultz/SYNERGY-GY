/**
 * Stripe Webhook Handler
 *
 * Processes Stripe webhook events for payment confirmations.
 * This is a Hono route handler, not an oRPC procedure.
 */

import {
  db,
  invoice,
  invoiceLineItem,
  invoicePayment,
  recurringInvoice,
  recurringInvoiceLineItem,
} from "@SYNERGY-GY/db";
import { eq } from "drizzle-orm";
import type { Context } from "hono";
import type Stripe from "stripe";

/**
 * Generate next invoice number
 */
async function generateInvoiceNumber(
  business: "GCMC" | "KAJ"
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = business === "GCMC" ? "GC" : "KJ";

  // Get the latest invoice number for this year and business
  const latestInvoice = await db.query.invoice.findFirst({
    where: eq(invoice.business, business),
    orderBy: (inv, { desc }) => [desc(inv.createdAt)],
  });

  let sequence = 1;
  if (latestInvoice?.invoiceNumber) {
    const match = latestInvoice.invoiceNumber.match(
      new RegExp(`${prefix}-${year}-(\\d+)`)
    );
    if (match?.[1]) {
      sequence = Number.parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}-${year}-${sequence.toString().padStart(4, "0")}`;
}

/**
 * Calculate next invoice date based on interval
 */
function calculateNextInvoiceDate(
  currentDate: Date,
  interval: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY"
): Date {
  const nextDate = new Date(currentDate);

  switch (interval) {
    case "WEEKLY":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "BIWEEKLY":
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case "MONTHLY":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case "QUARTERLY":
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case "YEARLY":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default: {
      // Exhaustive check - should never reach here
      const _exhaustive: never = interval;
      throw new Error(`Unknown interval: ${_exhaustive}`);
    }
  }

  return nextDate;
}

/**
 * Handle recurring payment - generates invoice from recurring template
 */
async function handleRecurringPayment(subscriptionId: string): Promise<void> {
  // Find the recurring invoice template by Stripe subscription ID
  const recurringInv = await db.query.recurringInvoice.findFirst({
    where: eq(recurringInvoice.stripeSubscriptionId, subscriptionId),
  });

  if (!recurringInv) {
    console.warn(
      `[StripeWebhook] No recurring invoice found for subscription: ${subscriptionId}`
    );
    return;
  }

  if (recurringInv.status !== "ACTIVE") {
    console.log(
      `[StripeWebhook] Recurring invoice is not active: ${recurringInv.id}`
    );
    return;
  }

  // Get the recurring invoice line items
  const lineItems = await db.query.recurringInvoiceLineItem.findMany({
    where: eq(recurringInvoiceLineItem.recurringInvoiceId, recurringInv.id),
    orderBy: (item, { asc }) => [asc(item.sortOrder)],
  });

  // Generate new invoice number
  const invoiceNumber = await generateInvoiceNumber(recurringInv.business);

  // Calculate totals
  const subtotal = lineItems.reduce(
    (sum, item) => sum + Number.parseFloat(item.amount),
    0
  );
  const taxAmount = Number.parseFloat(recurringInv.taxAmount);
  const totalAmount = subtotal + taxAmount;
  const today = new Date().toISOString().split("T")[0] ?? "";
  const dueDate =
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0] ?? "";

  // Create new invoice
  const [newInvoice] = await db
    .insert(invoice)
    .values({
      invoiceNumber,
      business: recurringInv.business,
      clientId: recurringInv.clientId,
      matterId: recurringInv.matterId,
      status: "SENT",
      invoiceDate: today,
      dueDate,
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      amountPaid: "0",
      amountDue: totalAmount.toFixed(2),
      notes: recurringInv.notes,
      terms: recurringInv.terms,
      createdById: recurringInv.createdById,
    })
    .returning();

  if (!newInvoice) {
    console.error(
      `[StripeWebhook] Failed to create invoice for recurring: ${recurringInv.id}`
    );
    return;
  }

  // Create line items
  if (lineItems.length > 0) {
    await db.insert(invoiceLineItem).values(
      lineItems.map((item, idx) => ({
        invoiceId: newInvoice.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
        serviceTypeId: item.serviceTypeId,
        sortOrder: idx,
      }))
    );
  }

  // Calculate next invoice date
  const nextDate = calculateNextInvoiceDate(new Date(), recurringInv.interval);

  // Check if we've reached the end date
  const shouldComplete =
    recurringInv.endDate && new Date(nextDate) > new Date(recurringInv.endDate);

  // Update recurring invoice
  await db
    .update(recurringInvoice)
    .set({
      invoicesGenerated: recurringInv.invoicesGenerated + 1,
      lastInvoiceId: newInvoice.id,
      lastGeneratedAt: new Date(),
      nextInvoiceDate: nextDate.toISOString().split("T")[0],
      status: shouldComplete ? "COMPLETED" : "ACTIVE",
    })
    .where(eq(recurringInvoice.id, recurringInv.id));

  console.log(
    `[StripeWebhook] Generated invoice ${invoiceNumber} from recurring template ${recurringInv.id}`
  );
}

/**
 * Handle subscription cancellation - marks recurring invoice as cancelled
 */
async function handleSubscriptionCancelled(
  subscriptionId: string
): Promise<void> {
  // Find and update the recurring invoice
  const recurringInv = await db.query.recurringInvoice.findFirst({
    where: eq(recurringInvoice.stripeSubscriptionId, subscriptionId),
  });

  if (!recurringInv) {
    console.warn(
      `[StripeWebhook] No recurring invoice found for cancelled subscription: ${subscriptionId}`
    );
    return;
  }

  await db
    .update(recurringInvoice)
    .set({
      status: "CANCELLED",
    })
    .where(eq(recurringInvoice.id, recurringInv.id));

  console.log(
    `[StripeWebhook] Marked recurring invoice ${recurringInv.id} as CANCELLED`
  );
}

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
        if (subscriptionId) {
          await handleRecurringPayment(subscriptionId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const { subscriptionId } = parsedEvent.data;
        console.log(
          `[StripeWebhook] Subscription cancelled: ${subscriptionId}`
        );
        if (subscriptionId) {
          await handleSubscriptionCancelled(subscriptionId);
        }
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
