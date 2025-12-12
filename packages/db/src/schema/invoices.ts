import { relations } from "drizzle-orm";
import {
  date,
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { client } from "./clients";
import { businessEnum } from "./core";
import { matter } from "./services";

/**
 * Invoice status enum
 * DRAFT - Invoice being created/edited
 * SENT - Invoice sent to client
 * PAID - Fully paid
 * OVERDUE - Past due date and unpaid
 * CANCELLED - Invoice cancelled
 */
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "DRAFT",
  "SENT",
  "PAID",
  "OVERDUE",
  "CANCELLED",
]);

/**
 * Discount type enum for invoices
 */
export const discountTypeEnum = pgEnum("discount_type", [
  "NONE",
  "PERCENTAGE",
  "FIXED_AMOUNT",
]);

/**
 * Payment method enum
 */
export const paymentMethodEnum = pgEnum("payment_method", [
  "CASH",
  "CHEQUE",
  "BANK_TRANSFER",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "MOBILE_MONEY",
  "OTHER",
]);

/**
 * Main invoice table
 * Stores invoice header information
 */
export const invoice = pgTable(
  "invoice",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // Invoice number (auto-generated: GK-2024-0001)
    invoiceNumber: text("invoice_number").notNull().unique(),

    // Business that issued the invoice
    business: businessEnum("business").notNull(),

    // Client and matter references
    clientId: text("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "restrict" }),
    matterId: text("matter_id").references(() => matter.id, {
      onDelete: "set null",
    }), // Optional: invoice may not be tied to specific matter

    // Status and dates
    status: invoiceStatusEnum("status").default("DRAFT").notNull(),
    invoiceDate: date("invoice_date").notNull(),
    dueDate: date("due_date").notNull(),
    paidDate: date("paid_date"), // When fully paid

    // Financial totals (GYD - Guyanese Dollar)
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    taxAmount: decimal("tax_amount", { precision: 10, scale: 2 })
      .default("0")
      .notNull(),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
    amountPaid: decimal("amount_paid", { precision: 10, scale: 2 })
      .default("0")
      .notNull(),
    amountDue: decimal("amount_due", { precision: 10, scale: 2 }).notNull(),

    // Discount (December 2024 enhancement)
    discountType: discountTypeEnum("discount_type").default("NONE").notNull(),
    discountValue: decimal("discount_value", { precision: 10, scale: 2 })
      .default("0")
      .notNull(), // Percentage or fixed amount
    discountAmount: decimal("discount_amount", { precision: 10, scale: 2 })
      .default("0")
      .notNull(), // Calculated discount in GYD
    discountReason: text("discount_reason"), // Optional note for discount

    // Additional information
    notes: text("notes"), // Internal notes
    terms: text("terms"), // Payment terms/conditions for client
    referenceNumber: text("reference_number"), // Client's PO or reference

    // PDF generation
    pdfUrl: text("pdf_url"), // URL to generated PDF in storage

    // Tracking
    sentAt: timestamp("sent_at"), // When invoice was sent to client
    sentById: text("sent_by_id").references(() => user.id, {
      onDelete: "set null",
    }),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("invoice_invoice_number_idx").on(table.invoiceNumber),
    index("invoice_business_idx").on(table.business),
    index("invoice_client_id_idx").on(table.clientId),
    index("invoice_matter_id_idx").on(table.matterId),
    index("invoice_status_idx").on(table.status),
    index("invoice_invoice_date_idx").on(table.invoiceDate),
    index("invoice_due_date_idx").on(table.dueDate),
    index("invoice_created_by_idx").on(table.createdById),
  ]
);

/**
 * Invoice line items
 * Individual services/products on an invoice
 */
export const invoiceLineItem = pgTable(
  "invoice_line_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoice.id, { onDelete: "cascade" }),

    // Line item details
    description: text("description").notNull(),
    quantity: decimal("quantity", { precision: 10, scale: 2 })
      .default("1")
      .notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // quantity * unitPrice

    // Optional: link to service type for reporting
    serviceTypeId: text("service_type_id"), // Not a foreign key to allow custom items

    // Sort order for display
    sortOrder: integer("sort_order").default(0).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("invoice_line_item_invoice_id_idx").on(table.invoiceId),
    index("invoice_line_item_sort_order_idx").on(table.sortOrder),
  ]
);

/**
 * Invoice payments
 * Track partial and full payments against invoices
 */
export const invoicePayment = pgTable(
  "invoice_payment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoice.id, { onDelete: "cascade" }),

    // Payment details
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    paymentDate: date("payment_date").notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),

    // Reference information
    referenceNumber: text("reference_number"), // Cheque number, transaction ID, etc.
    notes: text("notes"),

    // Tracking
    recordedById: text("recorded_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("invoice_payment_invoice_id_idx").on(table.invoiceId),
    index("invoice_payment_payment_date_idx").on(table.paymentDate),
    index("invoice_payment_recorded_by_idx").on(table.recordedById),
  ]
);

// Relations
export const invoiceRelations = relations(invoice, ({ one, many }) => ({
  client: one(client, {
    fields: [invoice.clientId],
    references: [client.id],
  }),
  matter: one(matter, {
    fields: [invoice.matterId],
    references: [matter.id],
  }),
  createdBy: one(user, {
    fields: [invoice.createdById],
    references: [user.id],
    relationName: "invoiceCreator",
  }),
  sentBy: one(user, {
    fields: [invoice.sentById],
    references: [user.id],
    relationName: "invoiceSender",
  }),
  lineItems: many(invoiceLineItem),
  payments: many(invoicePayment),
}));

export const invoiceLineItemRelations = relations(
  invoiceLineItem,
  ({ one }) => ({
    invoice: one(invoice, {
      fields: [invoiceLineItem.invoiceId],
      references: [invoice.id],
    }),
  })
);

export const invoicePaymentRelations = relations(invoicePayment, ({ one }) => ({
  invoice: one(invoice, {
    fields: [invoicePayment.invoiceId],
    references: [invoice.id],
  }),
  recordedBy: one(user, {
    fields: [invoicePayment.recordedById],
    references: [user.id],
  }),
}));
