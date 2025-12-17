import {
  client,
  db,
  invoice,
  invoiceLineItem,
  invoicePayment,
  matter,
} from "@SYNERGY-GY/db";
import { ORPCError } from "@orpc/server";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import {
  canAccessBusiness,
  getAccessibleBusinesses,
  staffProcedure,
} from "../index";

// Input schemas
const invoiceStatusValues = [
  "DRAFT",
  "SENT",
  "PAID",
  "OVERDUE",
  "CANCELLED",
] as const;

const businessValues = ["GCMC", "KAJ"] as const;

const paymentMethodValues = [
  "CASH",
  "CHEQUE",
  "BANK_TRANSFER",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "MOBILE_MONEY",
  "OTHER",
] as const;

const listInvoicesSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(invoiceStatusValues).optional(),
  business: z.enum(businessValues).optional(),
  clientId: z.string().optional(),
  matterId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  sortBy: z
    .enum(["invoiceNumber", "invoiceDate", "dueDate", "totalAmount", "status"])
    .default("invoiceDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.string().default("1"),
  unitPrice: z.string().min(1, "Unit price is required"),
  amount: z.string().min(1, "Amount is required"),
  serviceTypeId: z.string().optional(),
  sortOrder: z.number().default(0),
});

const discountTypeValues = ["NONE", "PERCENTAGE", "FIXED_AMOUNT"] as const;

const createInvoiceSchema = z.object({
  business: z.enum(businessValues),
  clientId: z.string().min(1, "Client is required"),
  matterId: z.string().optional(),
  invoiceDate: z.string(),
  dueDate: z.string(),
  lineItems: z
    .array(lineItemSchema)
    .min(1, "At least one line item is required"),
  notes: z.string().optional(),
  terms: z.string().optional(),
  referenceNumber: z.string().optional(),
  taxAmount: z.string().default("0"),
  // Discount fields
  discountType: z.enum(discountTypeValues).default("NONE"),
  discountValue: z.string().default("0"),
  discountReason: z.string().optional(),
});

const updateInvoiceSchema = z.object({
  id: z.string(),
  status: z.enum(invoiceStatusValues).optional(),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional(),
  lineItems: z.array(lineItemSchema).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  referenceNumber: z.string().optional(),
  taxAmount: z.string().optional(),
});

const recordPaymentSchema = z.object({
  invoiceId: z.string(),
  amount: z.string().min(1, "Payment amount is required"),
  paymentDate: z.string(),
  paymentMethod: z.enum(paymentMethodValues),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Generate invoice number: GK-2024-0001
 */
async function generateInvoiceNumber(
  business: "GCMC" | "KAJ"
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${business}-${year}`;

  // Get the latest invoice number for this business and year
  const latest = await db
    .select({ invoiceNumber: invoice.invoiceNumber })
    .from(invoice)
    .where(sql`${invoice.invoiceNumber} LIKE ${`${prefix}-%`}`)
    .orderBy(desc(invoice.invoiceNumber))
    .limit(1);

  let nextNumber = 1;
  if (latest.length > 0 && latest[0]) {
    const parts = latest[0].invoiceNumber.split("-");
    const lastNumber = Number.parseInt(parts[2] || "0", 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}-${nextNumber.toString().padStart(4, "0")}`;
}

/**
 * Calculate discount amount based on type and value
 */
function calculateDiscountAmount(
  subtotal: string,
  discountType: "NONE" | "PERCENTAGE" | "FIXED_AMOUNT",
  discountValue: string
): string {
  if (discountType === "NONE" || Number.parseFloat(discountValue) === 0) {
    return "0";
  }

  const subtotalNum = Number.parseFloat(subtotal);
  const valueNum = Number.parseFloat(discountValue);

  if (discountType === "PERCENTAGE") {
    // Cap percentage at 100%
    const percentage = Math.min(valueNum, 100);
    return ((subtotalNum * percentage) / 100).toFixed(2);
  }

  // Fixed amount - cap at subtotal
  return Math.min(valueNum, subtotalNum).toFixed(2);
}

/**
 * Calculate invoice totals from line items with discount support
 */
function calculateInvoiceTotals(
  lineItems: Array<{ amount: string }>,
  taxAmount: string,
  discountType: "NONE" | "PERCENTAGE" | "FIXED_AMOUNT" = "NONE",
  discountValue = "0"
): {
  subtotal: string;
  discountAmount: string;
  totalAmount: string;
} {
  const subtotal = lineItems
    .reduce((sum, item) => sum + Number.parseFloat(item.amount), 0)
    .toFixed(2);

  const discountAmount = calculateDiscountAmount(
    subtotal,
    discountType,
    discountValue
  );

  const totalAmount = (
    Number.parseFloat(subtotal) -
    Number.parseFloat(discountAmount) +
    Number.parseFloat(taxAmount)
  ).toFixed(2);

  return { subtotal, discountAmount, totalAmount };
}

/**
 * Update invoice status based on payment and due date
 */
async function updateInvoiceStatus(invoiceId: string): Promise<void> {
  const inv = await db.query.invoice.findFirst({
    where: eq(invoice.id, invoiceId),
  });

  if (!inv) {
    return;
  }

  let newStatus = inv.status;

  // If fully paid, mark as PAID
  if (Number.parseFloat(inv.amountPaid) >= Number.parseFloat(inv.totalAmount)) {
    newStatus = "PAID";
  }
  // If sent and overdue, mark as OVERDUE
  else if (
    inv.status === "SENT" &&
    inv.dueDate &&
    new Date(inv.dueDate) < new Date()
  ) {
    newStatus = "OVERDUE";
  }

  if (newStatus !== inv.status) {
    await db
      .update(invoice)
      .set({
        status: newStatus,
        paidDate:
          newStatus === "PAID" ? new Date().toISOString().split("T")[0] : null,
      })
      .where(eq(invoice.id, invoiceId));
  }
}

// Invoices router
export const invoicesRouter = {
  /**
   * List invoices with pagination and filters
   */
  list: staffProcedure
    .input(listInvoicesSchema)
    .handler(async ({ input, context }) => {
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);

      if (accessibleBusinesses.length === 0) {
        return { invoices: [], total: 0, page: input.page, limit: input.limit };
      }

      // biome-ignore lint/suspicious/noEvolvingTypes: Auto-fix
      const conditions = [];

      // Filter by accessible businesses
      if (input.business) {
        if (!accessibleBusinesses.includes(input.business)) {
          throw new ORPCError("FORBIDDEN", {
            message: "You don't have access to this business",
          });
        }
        conditions.push(eq(invoice.business, input.business));
      } else {
        conditions.push(
          sql`${invoice.business}::text = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[])`
        );
      }

      // Search filter (invoice number or client name)
      if (input.search) {
        const searchTerm = `%${input.search}%`;
        conditions.push(
          or(
            ilike(invoice.invoiceNumber, searchTerm),
            ilike(invoice.notes, searchTerm)
          )
        );
      }

      // Status filter
      if (input.status) {
        conditions.push(eq(invoice.status, input.status));
      }

      // Client filter
      if (input.clientId) {
        conditions.push(eq(invoice.clientId, input.clientId));
      }

      // Matter filter
      if (input.matterId) {
        conditions.push(eq(invoice.matterId, input.matterId));
      }

      // Date range filters
      if (input.fromDate) {
        conditions.push(gte(invoice.invoiceDate, input.fromDate));
      }
      if (input.toDate) {
        conditions.push(lte(invoice.invoiceDate, input.toDate));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const countResult = await db
        .select({ total: count() })
        .from(invoice)
        .where(whereClause);

      const total = countResult[0]?.total ?? 0;

      // Get paginated results
      const offset = (input.page - 1) * input.limit;
      const orderColumn = invoice[input.sortBy];
      const orderDirection = input.sortOrder === "asc" ? asc : desc;

      const invoices = await db.query.invoice.findMany({
        where: whereClause,
        orderBy: [orderDirection(orderColumn)],
        limit: input.limit,
        offset,
        with: {
          client: {
            columns: { id: true, displayName: true, email: true },
          },
          matter: {
            columns: { id: true, title: true, referenceNumber: true },
          },
          createdBy: {
            columns: { id: true, name: true },
          },
        },
      });

      return {
        invoices,
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  /**
   * Get single invoice by ID with full details
   */
  getById: staffProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const result = await db.query.invoice.findFirst({
        where: eq(invoice.id, input.id),
        with: {
          client: true,
          matter: true,
          lineItems: {
            // biome-ignore lint/nursery/noShadow: Auto-fix
            orderBy: (li, { asc }) => [asc(li.sortOrder)],
          },
          payments: {
            // biome-ignore lint/nursery/noShadow: Auto-fix
            orderBy: (p, { desc }) => [desc(p.paymentDate)],
            with: {
              recordedBy: {
                columns: { id: true, name: true },
              },
            },
          },
          createdBy: true,
          sentBy: true,
        },
      });

      if (!result) {
        throw new ORPCError("NOT_FOUND", { message: "Invoice not found" });
      }

      // Check if user has access to this invoice's business
      if (!canAccessBusiness(context.staff, result.business)) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this invoice",
        });
      }

      return result;
    }),

  /**
   * Create new invoice
   */
  create: staffProcedure
    .input(createInvoiceSchema)
    .handler(async ({ input, context }) => {
      // Verify user can access the business
      if (!canAccessBusiness(context.staff, input.business)) {
        throw new ORPCError("FORBIDDEN", {
          message: `You don't have access to ${input.business}`,
        });
      }

      // Verify client exists
      const clientExists = await db.query.client.findFirst({
        where: eq(client.id, input.clientId),
      });
      if (!clientExists) {
        throw new ORPCError("NOT_FOUND", { message: "Client not found" });
      }

      // Verify matter exists if provided
      if (input.matterId) {
        const matterExists = await db.query.matter.findFirst({
          where: eq(matter.id, input.matterId),
        });
        if (!matterExists) {
          throw new ORPCError("NOT_FOUND", { message: "Matter not found" });
        }
      }

      // Generate invoice number
      const invoiceNumber = await generateInvoiceNumber(input.business);

      // Calculate totals with discount
      const { subtotal, discountAmount, totalAmount } = calculateInvoiceTotals(
        input.lineItems,
        input.taxAmount,
        input.discountType,
        input.discountValue
      );

      // Create invoice
      const invoiceResult = await db
        .insert(invoice)
        .values({
          invoiceNumber,
          business: input.business,
          clientId: input.clientId,
          matterId: input.matterId || null,
          invoiceDate: input.invoiceDate,
          dueDate: input.dueDate,
          subtotal,
          taxAmount: input.taxAmount,
          totalAmount,
          amountDue: totalAmount,
          discountType: input.discountType,
          discountValue: input.discountValue,
          discountAmount,
          discountReason: input.discountReason || null,
          notes: input.notes || null,
          terms: input.terms || null,
          referenceNumber: input.referenceNumber || null,
          createdById: context.session.user.id,
        })
        .returning();

      const newInvoice = invoiceResult[0];
      if (!newInvoice) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create invoice",
        });
      }

      // Create line items
      const lineItemsWithInvoiceId = input.lineItems.map((item, index) => ({
        invoiceId: newInvoice.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
        serviceTypeId: item.serviceTypeId || null,
        sortOrder: item.sortOrder || index,
      }));

      await db.insert(invoiceLineItem).values(lineItemsWithInvoiceId);

      return newInvoice;
    }),

  /**
   * Update existing invoice (only DRAFT invoices can be fully edited)
   */
  update: staffProcedure
    .input(updateInvoiceSchema)
    .handler(async ({ input, context }) => {
      const { id, lineItems, ...updates } = input;

      // Fetch existing invoice
      const existing = await db.query.invoice.findFirst({
        where: eq(invoice.id, id),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Invoice not found" });
      }

      // Check access
      if (!canAccessBusiness(context.staff, existing.business)) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this invoice",
        });
      }

      // Only allow full editing of DRAFT invoices
      if (existing.status !== "DRAFT") {
        // For non-draft invoices, only allow status updates
        // biome-ignore lint/style/useCollapsedIf: Auto-fix
        if (Object.keys(updates).length > 1 || !updates.status) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Can only update status of non-draft invoices",
          });
        }
      }

      // Prepare update object with proper typing
      const updateData: Record<string, unknown> = { ...updates };

      // If updating line items, recalculate totals
      if (lineItems) {
        const { subtotal, totalAmount } = calculateInvoiceTotals(
          lineItems,
          updates.taxAmount || existing.taxAmount
        );

        // Delete old line items
        await db
          .delete(invoiceLineItem)
          .where(eq(invoiceLineItem.invoiceId, id));

        // Insert new line items
        const lineItemsWithInvoiceId = lineItems.map((item, index) => ({
          invoiceId: id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          serviceTypeId: item.serviceTypeId || null,
          sortOrder: item.sortOrder || index,
        }));

        await db.insert(invoiceLineItem).values(lineItemsWithInvoiceId);

        // Update invoice with new totals
        updateData.subtotal = subtotal;
        updateData.totalAmount = totalAmount;
        updateData.amountDue = (
          Number.parseFloat(totalAmount) -
          Number.parseFloat(existing.amountPaid)
        ).toFixed(2);
      }

      // If status is being set to SENT, record sent timestamp
      if (updates.status === "SENT" && existing.status === "DRAFT") {
        updateData.sentAt = new Date();
        updateData.sentById = context.session.user.id;
      }

      const [updated] = await db
        .update(invoice)
        .set(updateData)
        .where(eq(invoice.id, id))
        .returning();

      return updated;
    }),

  /**
   * Record a payment against an invoice
   */
  recordPayment: staffProcedure
    .input(recordPaymentSchema)
    .handler(async ({ input, context }) => {
      // Fetch invoice
      const inv = await db.query.invoice.findFirst({
        where: eq(invoice.id, input.invoiceId),
      });

      if (!inv) {
        throw new ORPCError("NOT_FOUND", { message: "Invoice not found" });
      }

      // Check access
      if (!canAccessBusiness(context.staff, inv.business)) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this invoice",
        });
      }

      // Validate payment amount
      const paymentAmount = Number.parseFloat(input.amount);
      const remainingAmount = Number.parseFloat(inv.amountDue);

      if (paymentAmount <= 0) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Payment amount must be greater than 0",
        });
      }

      if (paymentAmount > remainingAmount) {
        throw new ORPCError("BAD_REQUEST", {
          message: `Payment amount exceeds remaining balance of GYD ${remainingAmount}`,
        });
      }

      // Create payment record
      const [payment] = await db
        .insert(invoicePayment)
        .values({
          invoiceId: input.invoiceId,
          amount: input.amount,
          paymentDate: input.paymentDate,
          paymentMethod: input.paymentMethod,
          referenceNumber: input.referenceNumber || null,
          notes: input.notes || null,
          recordedById: context.session.user.id,
        })
        .returning();

      // Update invoice amounts
      const newAmountPaid = (
        Number.parseFloat(inv.amountPaid) + paymentAmount
      ).toFixed(2);
      const newAmountDue = (
        Number.parseFloat(inv.totalAmount) - Number.parseFloat(newAmountPaid)
      ).toFixed(2);

      await db
        .update(invoice)
        .set({
          amountPaid: newAmountPaid,
          amountDue: newAmountDue,
        })
        .where(eq(invoice.id, input.invoiceId));

      // Update invoice status if needed
      await updateInvoiceStatus(input.invoiceId);

      return payment;
    }),

  /**
   * Generate PDF for an invoice
   */
  generatePdf: staffProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      // Import dynamically to avoid issues
      const { generateInvoicePdf } = await import("../utils/invoice-pdf");

      const inv = await db.query.invoice.findFirst({
        where: eq(invoice.id, input.id),
        with: {
          client: true,
          matter: true,
          lineItems: {
            // biome-ignore lint/nursery/noShadow: Auto-fix
            orderBy: (li, { asc }) => [asc(li.sortOrder)],
          },
        },
      });

      if (!inv) {
        throw new ORPCError("NOT_FOUND", { message: "Invoice not found" });
      }

      // Check access
      if (!canAccessBusiness(context.staff, inv.business)) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this invoice",
        });
      }

      // Generate PDF
      const pdfBytes = await generateInvoicePdf({
        invoiceNumber: inv.invoiceNumber,
        business: inv.business as "GCMC" | "KAJ",
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        clientName: inv.client.displayName,
        clientEmail: inv.client.email,
        clientAddress: inv.client.address || null,
        clientTin: inv.client.tinNumber || null,
        lineItems: inv.lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
        })),
        subtotal: inv.subtotal,
        taxAmount: inv.taxAmount,
        discountType: inv.discountType,
        discountValue: inv.discountValue,
        discountAmount: inv.discountAmount,
        discountReason: inv.discountReason,
        totalAmount: inv.totalAmount,
        amountPaid: inv.amountPaid,
        amountDue: inv.amountDue,
        notes: inv.notes,
        terms: inv.terms,
        status: inv.status,
      });

      // Convert to base64 for transport
      const base64Pdf = Buffer.from(pdfBytes).toString("base64");

      return {
        pdf: base64Pdf,
        filename: `${inv.invoiceNumber}.pdf`,
        contentType: "application/pdf",
      };
    }),

  /**
   * Get invoice summary statistics
   */
  getSummary: staffProcedure.handler(async ({ context }) => {
    const accessibleBusinesses = getAccessibleBusinesses(context.staff);

    if (accessibleBusinesses.length === 0) {
      return {
        totalInvoices: 0,
        totalRevenue: "0",
        totalOutstanding: "0",
        totalOverdue: "0",
        byStatus: {},
      };
    }

    const whereClause = sql`${invoice.business}::text = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[])`;

    // Get counts by status
    const statusCounts = await db
      .select({
        status: invoice.status,
        count: count(),
        totalAmount: sql<string>`COALESCE(SUM(CAST(${invoice.totalAmount} AS DECIMAL)), 0)`,
        totalOutstanding: sql<string>`COALESCE(SUM(CAST(${invoice.amountDue} AS DECIMAL)), 0)`,
      })
      .from(invoice)
      .where(whereClause)
      .groupBy(invoice.status);

    const byStatus = statusCounts.reduce(
      // biome-ignore lint/nursery/noShadow: Auto-fix
      (acc, { status, count, totalAmount, totalOutstanding }) => {
        acc[status] = {
          count,
          totalAmount,
          totalOutstanding,
        };
        return acc;
      },
      {} as Record<
        string,
        { count: number; totalAmount: string; totalOutstanding: string }
      >
    );

    // Calculate totals
    const totalInvoices = statusCounts.reduce(
      // biome-ignore lint/nursery/noShadow: Auto-fix
      (sum, { count }) => sum + count,
      0
    );
    const totalRevenue = statusCounts
      .reduce((sum, { totalAmount }) => sum + Number.parseFloat(totalAmount), 0)
      .toFixed(2);
    const totalOutstanding = statusCounts
      .reduce(
        // biome-ignore lint/nursery/noShadow: Auto-fix
        (sum, { totalOutstanding }) =>
          sum + Number.parseFloat(totalOutstanding),
        0
      )
      .toFixed(2);

    // Get overdue amount
    const overdueResult = await db
      .select({
        totalOverdue: sql<string>`COALESCE(SUM(CAST(${invoice.amountDue} AS DECIMAL)), 0)`,
      })
      .from(invoice)
      .where(and(whereClause, eq(invoice.status, "OVERDUE")));

    const totalOverdue = overdueResult[0]?.totalOverdue || "0";

    return {
      totalInvoices,
      totalRevenue,
      totalOutstanding,
      totalOverdue,
      byStatus,
    };
  }),

  /**
   * Get client balance summary (total outstanding)
   */
  getClientBalance: staffProcedure
    .input(z.object({ clientId: z.string() }))
    .handler(async ({ input, context }) => {
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);

      const result = await db
        .select({
          totalInvoiced: sql<string>`COALESCE(SUM(CAST(${invoice.totalAmount} AS DECIMAL)), 0)`,
          totalPaid: sql<string>`COALESCE(SUM(CAST(${invoice.amountPaid} AS DECIMAL)), 0)`,
          totalOutstanding: sql<string>`COALESCE(SUM(CAST(${invoice.amountDue} AS DECIMAL)), 0)`,
          invoiceCount: count(),
        })
        .from(invoice)
        .where(
          and(
            eq(invoice.clientId, input.clientId),
            sql`${invoice.business}::text = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[])`,
            or(
              eq(invoice.status, "SENT"),
              eq(invoice.status, "OVERDUE"),
              eq(invoice.status, "PAID")
            )
          )
        );

      // Get overdue specifically
      const overdueResult = await db
        .select({
          totalOverdue: sql<string>`COALESCE(SUM(CAST(${invoice.amountDue} AS DECIMAL)), 0)`,
          overdueCount: count(),
        })
        .from(invoice)
        .where(
          and(
            eq(invoice.clientId, input.clientId),
            sql`${invoice.business}::text = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[])`,
            eq(invoice.status, "OVERDUE")
          )
        );

      return {
        clientId: input.clientId,
        totalInvoiced: result[0]?.totalInvoiced || "0",
        totalPaid: result[0]?.totalPaid || "0",
        totalOutstanding: result[0]?.totalOutstanding || "0",
        totalOverdue: overdueResult[0]?.totalOverdue || "0",
        invoiceCount: result[0]?.invoiceCount || 0,
        overdueCount: overdueResult[0]?.overdueCount || 0,
      };
    }),

  /**
   * Get aging report - breakdown by 0-30, 31-60, 61-90, 90+ days
   */
  getAgingReport: staffProcedure
    .input(
      z.object({
        business: z.enum(businessValues).optional(),
        clientId: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);

      if (accessibleBusinesses.length === 0) {
        return {
          current: { amount: "0", count: 0 },
          days30: { amount: "0", count: 0 },
          days60: { amount: "0", count: 0 },
          days90: { amount: "0", count: 0 },
          days90Plus: { amount: "0", count: 0 },
          total: { amount: "0", count: 0 },
        };
      }

      const conditions = [
        sql`${invoice.business}::text = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[])`,
        or(eq(invoice.status, "SENT"), eq(invoice.status, "OVERDUE")),
        sql`CAST(${invoice.amountDue} AS DECIMAL) > 0`,
      ];

      if (input.business) {
        conditions.push(eq(invoice.business, input.business));
      }

      if (input.clientId) {
        conditions.push(eq(invoice.clientId, input.clientId));
      }

      const whereClause = and(...conditions);

      // Get all outstanding invoices with their age
      const agingData = await db
        .select({
          amountDue: invoice.amountDue,
          dueDate: invoice.dueDate,
        })
        .from(invoice)
        .where(whereClause);

      const today = new Date();
      const buckets = {
        current: { amount: 0, count: 0 }, // Not yet due
        days30: { amount: 0, count: 0 }, // 1-30 days overdue
        days60: { amount: 0, count: 0 }, // 31-60 days overdue
        days90: { amount: 0, count: 0 }, // 61-90 days overdue
        days90Plus: { amount: 0, count: 0 }, // 90+ days overdue
      };

      for (const inv of agingData) {
        const dueDate = new Date(inv.dueDate);
        const daysOverdue = Math.floor(
          (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const amount = Number.parseFloat(inv.amountDue);

        if (daysOverdue <= 0) {
          buckets.current.amount += amount;
          buckets.current.count += 1;
        } else if (daysOverdue <= 30) {
          buckets.days30.amount += amount;
          buckets.days30.count += 1;
        } else if (daysOverdue <= 60) {
          buckets.days60.amount += amount;
          buckets.days60.count += 1;
        } else if (daysOverdue <= 90) {
          buckets.days90.amount += amount;
          buckets.days90.count += 1;
        } else {
          buckets.days90Plus.amount += amount;
          buckets.days90Plus.count += 1;
        }
      }

      const total = {
        amount: (
          buckets.current.amount +
          buckets.days30.amount +
          buckets.days60.amount +
          buckets.days90.amount +
          buckets.days90Plus.amount
        ).toFixed(2),
        count:
          buckets.current.count +
          buckets.days30.count +
          buckets.days60.count +
          buckets.days90.count +
          buckets.days90Plus.count,
      };

      return {
        current: {
          amount: buckets.current.amount.toFixed(2),
          count: buckets.current.count,
        },
        days30: {
          amount: buckets.days30.amount.toFixed(2),
          count: buckets.days30.count,
        },
        days60: {
          amount: buckets.days60.amount.toFixed(2),
          count: buckets.days60.count,
        },
        days90: {
          amount: buckets.days90.amount.toFixed(2),
          count: buckets.days90.count,
        },
        days90Plus: {
          amount: buckets.days90Plus.amount.toFixed(2),
          count: buckets.days90Plus.count,
        },
        total,
      };
    }),

  /**
   * Apply discount to an existing invoice (DRAFT only)
   */
  applyDiscount: staffProcedure
    .input(
      z.object({
        invoiceId: z.string(),
        discountType: z.enum(discountTypeValues),
        discountValue: z.string(),
        discountReason: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      // Fetch existing invoice
      const existing = await db.query.invoice.findFirst({
        where: eq(invoice.id, input.invoiceId),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Invoice not found" });
      }

      // Check access
      if (!canAccessBusiness(context.staff, existing.business)) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this invoice",
        });
      }

      // Only allow discount changes on DRAFT invoices
      if (existing.status !== "DRAFT") {
        throw new ORPCError("BAD_REQUEST", {
          message: "Can only apply discounts to draft invoices",
        });
      }

      // Calculate new discount and totals
      const discountAmount = calculateDiscountAmount(
        existing.subtotal,
        input.discountType,
        input.discountValue
      );

      const totalAmount = (
        Number.parseFloat(existing.subtotal) -
        Number.parseFloat(discountAmount) +
        Number.parseFloat(existing.taxAmount)
      ).toFixed(2);

      const amountDue = (
        Number.parseFloat(totalAmount) - Number.parseFloat(existing.amountPaid)
      ).toFixed(2);

      const [updated] = await db
        .update(invoice)
        .set({
          discountType: input.discountType,
          discountValue: input.discountValue,
          discountAmount,
          discountReason: input.discountReason || null,
          totalAmount,
          amountDue,
        })
        .where(eq(invoice.id, input.invoiceId))
        .returning();

      return updated;
    }),
};
