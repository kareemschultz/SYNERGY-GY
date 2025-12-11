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
    .where(sql`${invoice.invoiceNumber} LIKE ${prefix + "-%"}`)
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
 * Calculate invoice totals from line items
 */
function calculateInvoiceTotals(
  lineItems: Array<{ amount: string }>,
  taxAmount: string
): {
  subtotal: string;
  totalAmount: string;
} {
  const subtotal = lineItems
    .reduce((sum, item) => sum + Number.parseFloat(item.amount), 0)
    .toFixed(2);

  const totalAmount = (
    Number.parseFloat(subtotal) + Number.parseFloat(taxAmount)
  ).toFixed(2);

  return { subtotal, totalAmount };
}

/**
 * Update invoice status based on payment and due date
 */
async function updateInvoiceStatus(invoiceId: string): Promise<void> {
  const inv = await db.query.invoice.findFirst({
    where: eq(invoice.id, invoiceId),
  });

  if (!inv) return;

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
          sql`${invoice.business} = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[])`
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
            orderBy: (li, { asc }) => [asc(li.sortOrder)],
          },
          payments: {
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

      // Calculate totals
      const { subtotal, totalAmount } = calculateInvoiceTotals(
        input.lineItems,
        input.taxAmount
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
   * Generate PDF (placeholder for now - will be implemented with PDF library)
   */
  generatePdf: staffProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const inv = await db.query.invoice.findFirst({
        where: eq(invoice.id, input.id),
        with: {
          client: true,
          matter: true,
          lineItems: {
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

      // TODO: Implement PDF generation with library like PDFKit or Puppeteer
      // For now, return placeholder URL
      return {
        url: `/api/invoices/${inv.id}/pdf`,
        message: "PDF generation not yet implemented",
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

    const whereClause = sql`${invoice.business} = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[])`;

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
      (sum, { count }) => sum + count,
      0
    );
    const totalRevenue = statusCounts
      .reduce((sum, { totalAmount }) => sum + Number.parseFloat(totalAmount), 0)
      .toFixed(2);
    const totalOutstanding = statusCounts
      .reduce(
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
};
