/**
 * Stripe Payment Integration
 *
 * Handles online payment processing via Stripe:
 * - Checkout session creation for invoice payments
 * - Webhook event processing for payment confirmations
 * - Recurring subscription management
 */

import Stripe from "stripe";

// Environment configuration
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_CURRENCY = process.env.STRIPE_CURRENCY || "gyd";
const PORTAL_URL = process.env.BETTER_AUTH_URL || "http://localhost:5173";

// Stripe client (initialized lazily)
let stripeClient: Stripe | null = null;

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return Boolean(STRIPE_SECRET_KEY);
}

/**
 * Get or create Stripe client instance
 */
export function getStripeClient(): Stripe {
  if (!STRIPE_SECRET_KEY) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY environment variable."
    );
  }

  if (!stripeClient) {
    stripeClient = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
      typescript: true,
    });
  }

  return stripeClient;
}

/**
 * Invoice payment checkout data
 */
export type InvoiceCheckoutData = {
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientEmail: string;
  clientName: string;
  amountDue: number; // Amount in smallest currency unit (cents/pence)
  description: string;
  successUrl?: string;
  cancelUrl?: string;
};

/**
 * Create a Stripe checkout session for invoice payment
 */
export async function createInvoiceCheckoutSession(
  data: InvoiceCheckoutData
): Promise<{ sessionId: string; url: string }> {
  const stripe = getStripeClient();

  // Default URLs for success/cancel
  const successUrl =
    data.successUrl ||
    `${PORTAL_URL}/pay/success?invoice=${data.invoiceId}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl =
    data.cancelUrl || `${PORTAL_URL}/pay/${data.invoiceId}?cancelled=true`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: data.clientEmail,
    client_reference_id: data.invoiceId,
    line_items: [
      {
        price_data: {
          currency: STRIPE_CURRENCY,
          product_data: {
            name: `Invoice ${data.invoiceNumber}`,
            description: data.description,
          },
          unit_amount: data.amountDue,
        },
        quantity: 1,
      },
    ],
    metadata: {
      invoiceId: data.invoiceId,
      invoiceNumber: data.invoiceNumber,
      clientId: data.clientId,
      type: "invoice_payment",
    },
    payment_intent_data: {
      metadata: {
        invoiceId: data.invoiceId,
        invoiceNumber: data.invoiceNumber,
        clientId: data.clientId,
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  if (!session.url) {
    throw new Error("Failed to create Stripe checkout session URL");
  }

  return {
    sessionId: session.id,
    url: session.url,
  };
}

/**
 * Recurring invoice subscription data
 */
export type RecurringInvoiceData = {
  invoiceId: string;
  clientId: string;
  clientEmail: string;
  clientName: string;
  amount: number; // Amount in smallest currency unit
  description: string;
  interval: "day" | "week" | "month" | "year";
  intervalCount?: number;
};

/**
 * Create a Stripe subscription for recurring invoices
 */
export async function createRecurringSubscription(
  data: RecurringInvoiceData
): Promise<{ subscriptionId: string; customerId: string }> {
  const stripe = getStripeClient();

  // Find or create customer
  const customers = await stripe.customers.list({
    email: data.clientEmail,
    limit: 1,
  });

  let customer: Stripe.Customer;
  if (customers.data.length > 0 && customers.data[0]) {
    customer = customers.data[0];
  } else {
    customer = await stripe.customers.create({
      email: data.clientEmail,
      name: data.clientName,
      metadata: {
        clientId: data.clientId,
      },
    });
  }

  // Create product and price for the recurring invoice
  const product = await stripe.products.create({
    name: data.description,
    metadata: {
      invoiceId: data.invoiceId,
      clientId: data.clientId,
    },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: data.amount,
    currency: STRIPE_CURRENCY,
    recurring: {
      interval: data.interval,
      interval_count: data.intervalCount || 1,
    },
  });

  // Create subscription
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: price.id }],
    metadata: {
      invoiceId: data.invoiceId,
      clientId: data.clientId,
      type: "recurring_invoice",
    },
  });

  return {
    subscriptionId: subscription.id,
    customerId: customer.id,
  };
}

/**
 * Cancel a Stripe subscription
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<void> {
  const stripe = getStripeClient();
  await stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Webhook event types we handle
 */
export type StripeWebhookEvent =
  | {
      type: "checkout.session.completed";
      data: {
        invoiceId: string;
        invoiceNumber: string;
        clientId: string;
        amountPaid: number;
        paymentIntentId: string;
      };
    }
  | {
      type: "invoice.payment_succeeded";
      data: {
        subscriptionId: string;
        invoiceId: string;
        clientId: string;
        amountPaid: number;
      };
    }
  | {
      type: "customer.subscription.deleted";
      data: {
        subscriptionId: string;
        invoiceId: string;
        clientId: string;
      };
    }
  | {
      type: "payment_intent.payment_failed";
      data: {
        invoiceId: string;
        clientId: string;
        errorMessage: string;
      };
    };

/**
 * Verify and parse Stripe webhook event
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  if (!STRIPE_WEBHOOK_SECRET) {
    throw new Error(
      "Stripe webhook secret not configured. Set STRIPE_WEBHOOK_SECRET."
    );
  }

  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    STRIPE_WEBHOOK_SECRET
  );
}

/**
 * Parse checkout.session.completed event
 */
function parseCheckoutCompleted(
  session: Stripe.Checkout.Session
): StripeWebhookEvent | null {
  const metadata = session.metadata || {};

  if (metadata.type !== "invoice_payment") {
    return null;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || "";

  return {
    type: "checkout.session.completed",
    data: {
      invoiceId: metadata.invoiceId || "",
      invoiceNumber: metadata.invoiceNumber || "",
      clientId: metadata.clientId || "",
      amountPaid: session.amount_total || 0,
      paymentIntentId,
    },
  };
}

/**
 * Parse invoice.payment_succeeded event
 */
function parseInvoicePaymentSucceeded(
  stripeInvoice: Stripe.Invoice
): StripeWebhookEvent | null {
  const metadata = stripeInvoice.metadata || {};

  if (metadata.type !== "recurring_invoice") {
    return null;
  }

  const subscriptionId =
    typeof stripeInvoice.parent?.subscription_details?.subscription === "string"
      ? stripeInvoice.parent.subscription_details.subscription
      : "";

  return {
    type: "invoice.payment_succeeded",
    data: {
      subscriptionId,
      invoiceId: metadata.invoiceId || "",
      clientId: metadata.clientId || "",
      amountPaid: stripeInvoice.amount_paid || 0,
    },
  };
}

/**
 * Parse customer.subscription.deleted event
 */
function parseSubscriptionDeleted(
  subscription: Stripe.Subscription
): StripeWebhookEvent {
  const metadata = subscription.metadata || {};

  return {
    type: "customer.subscription.deleted",
    data: {
      subscriptionId: subscription.id,
      invoiceId: metadata.invoiceId || "",
      clientId: metadata.clientId || "",
    },
  };
}

/**
 * Parse payment_intent.payment_failed event
 */
function parsePaymentFailed(
  paymentIntent: Stripe.PaymentIntent
): StripeWebhookEvent {
  const metadata = paymentIntent.metadata || {};

  return {
    type: "payment_intent.payment_failed",
    data: {
      invoiceId: metadata.invoiceId || "",
      clientId: metadata.clientId || "",
      errorMessage:
        paymentIntent.last_payment_error?.message || "Payment failed",
    },
  };
}

/**
 * Parse webhook event into our internal format
 */
export function parseWebhookEvent(
  event: Stripe.Event
): StripeWebhookEvent | null {
  switch (event.type) {
    case "checkout.session.completed":
      return parseCheckoutCompleted(
        event.data.object as Stripe.Checkout.Session
      );

    case "invoice.payment_succeeded":
      return parseInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);

    case "customer.subscription.deleted":
      return parseSubscriptionDeleted(event.data.object as Stripe.Subscription);

    case "payment_intent.payment_failed":
      return parsePaymentFailed(event.data.object as Stripe.PaymentIntent);

    default:
      return null;
  }
}

/**
 * Get Stripe checkout session by ID
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient();
  return await stripe.checkout.sessions.retrieve(sessionId);
}

/**
 * Get payment intent details
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripeClient();
  return await stripe.paymentIntents.retrieve(paymentIntentId);
}

/**
 * Create a payment link for an invoice (shareable URL)
 */
export async function createPaymentLink(data: {
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  amount: number;
  description: string;
}): Promise<{ paymentLinkId: string; url: string }> {
  const stripe = getStripeClient();

  // Create a product for this invoice
  const product = await stripe.products.create({
    name: `Invoice ${data.invoiceNumber}`,
    metadata: {
      invoiceId: data.invoiceId,
      clientId: data.clientId,
    },
  });

  // Create a price for the product
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: data.amount,
    currency: STRIPE_CURRENCY,
  });

  // Create payment link
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    metadata: {
      invoiceId: data.invoiceId,
      invoiceNumber: data.invoiceNumber,
      clientId: data.clientId,
      type: "invoice_payment",
    },
    after_completion: {
      type: "redirect",
      redirect: {
        url: `${PORTAL_URL}/pay/success?invoice=${data.invoiceId}`,
      },
    },
  });

  return {
    paymentLinkId: paymentLink.id,
    url: paymentLink.url,
  };
}

console.log(
  `[Stripe] ${isStripeConfigured() ? "Configured and ready" : "Not configured (STRIPE_SECRET_KEY not set)"}`
);
