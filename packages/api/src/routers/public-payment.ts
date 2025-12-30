/**
 * Public Payment Router
 *
 * Handles public-facing payment endpoints that don't require authentication.
 * Clients can pay invoices using a secure payment token.
 */

import { db, invoice } from "@SYNERGY-GY/db";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { baseProcedure } from "../index";

/**
 * Get invoice details by payment token (public access)
 */
const getInvoiceByToken = baseProcedure
  .input(z.object({ token: z.string().min(1) }))
  .handler(async ({ input }) => {
    const inv = await db.query.invoice.findFirst({
      where: eq(invoice.paymentToken, input.token),
      with: {
        client: {
          columns: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        lineItems: {
          orderBy: (li, { asc }) => [asc(li.sortOrder)],
        },
      },
    });

    if (!inv) {
      throw new ORPCError("NOT_FOUND", {
        message: "Invoice not found or payment link has expired",
      });
    }

    // Only allow payment for SENT or OVERDUE invoices
    if (!["SENT", "OVERDUE"].includes(inv.status)) {
      throw new ORPCError("BAD_REQUEST", {
        message:
          inv.status === "PAID"
            ? "This invoice has already been paid"
            : "This invoice is not available for payment",
      });
    }

    const clientData = inv.client as {
      id: string;
      displayName: string;
      email: string | null;
    } | null;

    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      business: inv.business,
      status: inv.status,
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      clientName: clientData?.displayName ?? "Client",
      clientEmail: clientData?.email ?? null,
      lineItems: inv.lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
      })),
      subtotal: inv.subtotal,
      taxAmount: inv.taxAmount,
      discountAmount: inv.discountAmount,
      totalAmount: inv.totalAmount,
      amountPaid: inv.amountPaid,
      amountDue: inv.amountDue,
      notes: inv.notes,
      terms: inv.terms,
      stripePaymentLinkUrl: inv.stripePaymentLinkUrl,
    };
  });

/**
 * Create checkout session for public payment
 */
const createPublicCheckoutSession = baseProcedure
  .input(z.object({ token: z.string().min(1) }))
  .handler(async ({ input }) => {
    const { isStripeConfigured, createInvoiceCheckoutSession } = await import(
      "../utils/stripe"
    );

    if (!isStripeConfigured()) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Online payments are not currently available",
      });
    }

    const inv = await db.query.invoice.findFirst({
      where: eq(invoice.paymentToken, input.token),
      with: {
        client: true,
      },
    });

    if (!inv) {
      throw new ORPCError("NOT_FOUND", {
        message: "Invoice not found or payment link has expired",
      });
    }

    if (!["SENT", "OVERDUE"].includes(inv.status)) {
      throw new ORPCError("BAD_REQUEST", {
        message:
          inv.status === "PAID"
            ? "This invoice has already been paid"
            : "This invoice is not available for payment",
      });
    }

    const clientData = inv.client as {
      id: string;
      displayName: string;
      email: string | null;
    };

    if (!clientData?.email) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Client email is required for online payment",
      });
    }

    const amountDue = Number.parseFloat(inv.amountDue);
    if (amountDue <= 0) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Invoice has no outstanding balance",
      });
    }

    const result = await createInvoiceCheckoutSession({
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      clientId: inv.clientId,
      clientEmail: clientData.email,
      clientName: clientData.displayName,
      amountDue: Math.round(amountDue * 100),
      description: `Invoice ${inv.invoiceNumber} - ${inv.business}`,
    });

    return {
      checkoutUrl: result.url,
    };
  });

/**
 * Verify payment success (after Stripe redirect)
 */
const verifyPaymentSuccess = baseProcedure
  .input(
    z.object({
      invoiceId: z.string(),
      sessionId: z.string().optional(),
    })
  )
  .handler(async ({ input }) => {
    const { isStripeConfigured, getCheckoutSession } = await import(
      "../utils/stripe"
    );

    const inv = await db.query.invoice.findFirst({
      where: eq(invoice.id, input.invoiceId),
    });

    if (!inv) {
      throw new ORPCError("NOT_FOUND", { message: "Invoice not found" });
    }

    // If we have a session ID, verify it with Stripe
    if (input.sessionId && isStripeConfigured()) {
      try {
        const session = await getCheckoutSession(input.sessionId);

        if (session.payment_status === "paid") {
          // Payment confirmed by Stripe
          return {
            success: true,
            invoiceNumber: inv.invoiceNumber,
            status: "PAID",
            message: "Payment successful! Thank you for your payment.",
          };
        }
      } catch {
        // Session verification failed, check invoice status instead
      }
    }

    // Fall back to checking invoice status
    return {
      success: inv.status === "PAID",
      invoiceNumber: inv.invoiceNumber,
      status: inv.status,
      message:
        inv.status === "PAID"
          ? "Payment successful! Thank you for your payment."
          : "Payment is being processed. You will receive a confirmation shortly.",
    };
  });

/**
 * Check Stripe availability (public)
 */
const checkStripeAvailability = baseProcedure.handler(async () => {
  const { isStripeConfigured } = await import("../utils/stripe");
  return {
    available: isStripeConfigured(),
    currency: process.env.STRIPE_CURRENCY || "gyd",
  };
});

// Public payment router
export const publicPaymentRouter = {
  getInvoiceByToken,
  createCheckoutSession: createPublicCheckoutSession,
  verifyPaymentSuccess,
  checkStripeAvailability,
};
