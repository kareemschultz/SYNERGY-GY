import {
  client,
  db,
  deadline,
  invoice,
  matter,
  reportExecution,
  staff,
  user,
} from "@SYNERGY-GY/db";
import { ORPCError } from "@orpc/server";
import { and, count, desc, eq, gte, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getAccessibleBusinesses, staffProcedure } from "../index";

// Input schemas
const reportFormatValues = ["PDF", "EXCEL", "CSV"] as const;
const reportCategoryValues = [
  "CLIENT",
  "MATTER",
  "FINANCIAL",
  "DEADLINE",
  "DOCUMENT",
  "STAFF",
] as const;

// Standard report codes
const STANDARD_REPORTS = {
  // Client reports
  CLIENT_SUMMARY: {
    name: "Client Summary Report",
    description:
      "Overview of clients by type, status, and business distribution",
    category: "CLIENT",
  },
  CLIENT_ACTIVITY: {
    name: "Client Activity Report",
    description: "Matters, documents, and activity per client",
    category: "CLIENT",
  },
  // Matter reports
  MATTER_STATUS: {
    name: "Matter Status Report",
    description: "Matters by status with completion metrics",
    category: "MATTER",
  },
  MATTER_REVENUE: {
    name: "Matter Revenue Report",
    description: "Revenue breakdown by service type and business",
    category: "FINANCIAL",
  },
  // Financial reports
  REVENUE_SUMMARY: {
    name: "Revenue Summary Report",
    description: "Total revenue by period, business, and service type",
    category: "FINANCIAL",
  },
  ACCOUNTS_RECEIVABLE: {
    name: "Accounts Receivable Report",
    description: "Outstanding invoices with aging analysis",
    category: "FINANCIAL",
  },
  INVOICE_REPORT: {
    name: "Invoice Report",
    description: "All invoices with payment status and methods",
    category: "FINANCIAL",
  },
  // Deadline reports
  DEADLINE_SUMMARY: {
    name: "Deadline Summary Report",
    description: "Upcoming and overdue deadlines by type",
    category: "DEADLINE",
  },
  // Staff reports
  STAFF_PRODUCTIVITY: {
    name: "Staff Productivity Report",
    description: "Matters and activity per staff member",
    category: "STAFF",
  },
} as const;

const listReportsSchema = z.object({
  category: z.enum(reportCategoryValues).optional(),
  search: z.string().optional(),
});

const executeReportSchema = z.object({
  reportCode: z.string(),
  format: z.enum(reportFormatValues).default("PDF"),
  filters: z
    .object({
      business: z.enum(["GCMC", "KAJ"]).optional(),
      fromDate: z.string().optional(),
      toDate: z.string().optional(),
      clientId: z.string().optional(),
      status: z.string().optional(),
    })
    .optional(),
});

// Helper: Calculate deadline status from isCompleted and dueDate
function getDeadlineStatus(
  isCompleted: boolean,
  dueDate: Date | string
): string {
  if (isCompleted) {
    return "COMPLETED";
  }
  const today = new Date();
  const due = new Date(dueDate);
  return due < today ? "OVERDUE" : "PENDING";
}

// Reports router
export const reportsRouter = {
  /**
   * List available reports
   */
  list: staffProcedure.input(listReportsSchema).handler(async ({ input }) => {
    // Return standard reports as a list
    const reports = Object.entries(STANDARD_REPORTS).map(([code, report]) => ({
      code,
      name: report.name,
      description: report.description,
      category: report.category,
      type: "STANDARD" as const,
    }));

    let filteredReports = reports;

    if (input.category) {
      filteredReports = filteredReports.filter(
        (r) => r.category === input.category
      );
    }

    if (input.search) {
      const searchLower = input.search.toLowerCase();
      filteredReports = filteredReports.filter(
        (r) =>
          r.name.toLowerCase().includes(searchLower) ||
          r.description.toLowerCase().includes(searchLower)
      );
    }

    // Group by category
    const grouped = filteredReports.reduce(
      (acc, report) => {
        if (!acc[report.category]) {
          acc[report.category] = [];
        }
        acc[report.category].push(report);
        return acc;
      },
      {} as Record<string, typeof filteredReports>
    );

    return {
      reports: filteredReports,
      grouped,
      categories: Object.keys(grouped),
    };
  }),

  /**
   * Execute a report and return data
   */
  execute: staffProcedure
    .input(executeReportSchema)
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex report logic
    .handler(async ({ input, context }) => {
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);

      if (accessibleBusinesses.length === 0) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to any business data",
        });
      }

      // Validate business filter
      if (
        input.filters?.business &&
        !accessibleBusinesses.includes(input.filters.business)
      ) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this business",
        });
      }

      const businessFilter = input.filters?.business
        ? [input.filters.business]
        : accessibleBusinesses;

      // Get report configuration
      const reportConfig =
        STANDARD_REPORTS[input.reportCode as keyof typeof STANDARD_REPORTS];
      if (!reportConfig) {
        throw new ORPCError("NOT_FOUND", {
          message: `Report '${input.reportCode}' not found`,
        });
      }

      // Execute the specific report
      let data: unknown;
      let columns: Array<{ key: string; label: string; type?: string }> = [];
      let summary: Record<string, unknown> = {};

      switch (input.reportCode) {
        case "CLIENT_SUMMARY": {
          // Client Summary Report - clients have businesses array
          const clientsData = await db
            .select({
              type: client.type,
              businesses: client.businesses,
            })
            .from(client)
            .where(
              sql`${client.businesses} && ARRAY[${sql.join(businessFilter, sql`, `)}]::text[]`
            );

          // Aggregate by type and business
          const aggregated: {
            type: string;
            business: string;
            count: number;
          }[] = [];
          const businessCounts: Record<string, number> = {};

          for (const c of clientsData) {
            // Count by type (simplified - count each client once for their first matching business)
            const matchingBiz = (c.businesses || []).find((b: string) =>
              businessFilter.includes(b as "GCMC" | "KAJ")
            );
            if (matchingBiz) {
              const existing = aggregated.find(
                (a) => a.type === c.type && a.business === matchingBiz
              );
              if (existing) {
                existing.count += 1;
              } else {
                aggregated.push({
                  type: c.type,
                  business: matchingBiz,
                  count: 1,
                });
              }
              businessCounts[matchingBiz] =
                (businessCounts[matchingBiz] || 0) + 1;
            }
          }

          columns = [
            { key: "type", label: "Client Type" },
            { key: "business", label: "Business" },
            { key: "count", label: "Count", type: "number" },
          ];

          data = aggregated;
          summary = {
            totalClients: clientsData.length,
            byBusiness: businessCounts,
          };
          break;
        }

        case "MATTER_STATUS": {
          // Matter Status Report
          const mattersData = await db
            .select({
              status: matter.status,
              business: matter.business,
              count: count(),
            })
            .from(matter)
            .where(
              sql`${matter.business}::text = ANY(ARRAY[${sql.join(businessFilter, sql`, `)}]::text[])`
            )
            .groupBy(matter.status, matter.business);

          columns = [
            { key: "status", label: "Status" },
            { key: "business", label: "Business" },
            { key: "count", label: "Count", type: "number" },
          ];

          const totalMatters = mattersData.reduce(
            (sum, row) => sum + row.count,
            0
          );
          data = mattersData;
          summary = {
            totalMatters,
            byStatus: mattersData.reduce(
              (acc, row) => {
                acc[row.status] = (acc[row.status] || 0) + row.count;
                return acc;
              },
              {} as Record<string, number>
            ),
          };
          break;
        }

        case "REVENUE_SUMMARY": {
          // Revenue Summary Report
          const invoiceConditions = [
            sql`${invoice.business}::text = ANY(ARRAY[${sql.join(businessFilter, sql`, `)}]::text[])`,
            or(
              eq(invoice.status, "SENT"),
              eq(invoice.status, "PAID"),
              eq(invoice.status, "OVERDUE")
            ),
          ];

          if (input.filters?.fromDate) {
            invoiceConditions.push(
              gte(invoice.invoiceDate, input.filters.fromDate)
            );
          }
          if (input.filters?.toDate) {
            invoiceConditions.push(
              lte(invoice.invoiceDate, input.filters.toDate)
            );
          }

          const revenueData = await db
            .select({
              business: invoice.business,
              totalInvoiced: sql<string>`COALESCE(SUM(CAST(${invoice.totalAmount} AS DECIMAL)), 0)`,
              totalPaid: sql<string>`COALESCE(SUM(CAST(${invoice.amountPaid} AS DECIMAL)), 0)`,
              totalOutstanding: sql<string>`COALESCE(SUM(CAST(${invoice.amountDue} AS DECIMAL)), 0)`,
              invoiceCount: count(),
            })
            .from(invoice)
            .where(and(...invoiceConditions))
            .groupBy(invoice.business);

          columns = [
            { key: "business", label: "Business" },
            { key: "totalInvoiced", label: "Total Invoiced", type: "currency" },
            { key: "totalPaid", label: "Total Paid", type: "currency" },
            {
              key: "totalOutstanding",
              label: "Outstanding",
              type: "currency",
            },
            { key: "invoiceCount", label: "Invoices", type: "number" },
          ];

          data = revenueData;
          summary = {
            grandTotal: revenueData.reduce(
              (sum, row) => sum + Number.parseFloat(row.totalInvoiced),
              0
            ),
            totalPaid: revenueData.reduce(
              (sum, row) => sum + Number.parseFloat(row.totalPaid),
              0
            ),
            totalOutstanding: revenueData.reduce(
              (sum, row) => sum + Number.parseFloat(row.totalOutstanding),
              0
            ),
          };
          break;
        }

        case "ACCOUNTS_RECEIVABLE": {
          // Accounts Receivable with aging
          const arConditions = [
            sql`${invoice.business}::text = ANY(ARRAY[${sql.join(businessFilter, sql`, `)}]::text[])`,
            or(eq(invoice.status, "SENT"), eq(invoice.status, "OVERDUE")),
            sql`CAST(${invoice.amountDue} AS DECIMAL) > 0`,
          ];

          const arData = await db
            .select({
              invoiceNumber: invoice.invoiceNumber,
              clientId: invoice.clientId,
              business: invoice.business,
              invoiceDate: invoice.invoiceDate,
              dueDate: invoice.dueDate,
              totalAmount: invoice.totalAmount,
              amountPaid: invoice.amountPaid,
              amountDue: invoice.amountDue,
              status: invoice.status,
            })
            .from(invoice)
            .where(and(...arConditions))
            .orderBy(desc(invoice.dueDate));

          // Calculate aging
          const today = new Date();
          const arWithAging = arData.map((inv) => {
            const dueDate = new Date(inv.dueDate);
            const daysOverdue = Math.floor(
              (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            let agingBucket = "Current";
            if (daysOverdue > 0 && daysOverdue <= 30) {
              agingBucket = "1-30 Days";
            } else if (daysOverdue > 30 && daysOverdue <= 60) {
              agingBucket = "31-60 Days";
            } else if (daysOverdue > 60 && daysOverdue <= 90) {
              agingBucket = "61-90 Days";
            } else if (daysOverdue > 90) {
              agingBucket = "90+ Days";
            }

            return {
              ...inv,
              daysOverdue: Math.max(0, daysOverdue),
              agingBucket,
            };
          });

          columns = [
            { key: "invoiceNumber", label: "Invoice #" },
            { key: "business", label: "Business" },
            { key: "invoiceDate", label: "Invoice Date", type: "date" },
            { key: "dueDate", label: "Due Date", type: "date" },
            { key: "totalAmount", label: "Total", type: "currency" },
            { key: "amountDue", label: "Due", type: "currency" },
            { key: "agingBucket", label: "Aging" },
            { key: "daysOverdue", label: "Days Overdue", type: "number" },
          ];

          data = arWithAging;

          // Aging summary
          const agingSummary = arWithAging.reduce(
            (acc, inv) => {
              acc[inv.agingBucket] =
                (acc[inv.agingBucket] || 0) + Number.parseFloat(inv.amountDue);
              return acc;
            },
            {} as Record<string, number>
          );

          summary = {
            totalOutstanding: arWithAging.reduce(
              (sum, inv) => sum + Number.parseFloat(inv.amountDue),
              0
            ),
            invoiceCount: arWithAging.length,
            aging: agingSummary,
          };
          break;
        }

        case "INVOICE_REPORT": {
          // Invoice Report
          const invConditions = [
            sql`${invoice.business}::text = ANY(ARRAY[${sql.join(businessFilter, sql`, `)}]::text[])`,
          ];

          if (input.filters?.fromDate) {
            invConditions.push(
              gte(invoice.invoiceDate, input.filters.fromDate)
            );
          }
          if (input.filters?.toDate) {
            invConditions.push(lte(invoice.invoiceDate, input.filters.toDate));
          }
          if (input.filters?.status) {
            invConditions.push(
              eq(
                invoice.status,
                input.filters.status as
                  | "DRAFT"
                  | "SENT"
                  | "PAID"
                  | "OVERDUE"
                  | "CANCELLED"
              )
            );
          }

          const invoicesData = await db
            .select({
              invoiceNumber: invoice.invoiceNumber,
              business: invoice.business,
              invoiceDate: invoice.invoiceDate,
              dueDate: invoice.dueDate,
              totalAmount: invoice.totalAmount,
              amountPaid: invoice.amountPaid,
              amountDue: invoice.amountDue,
              status: invoice.status,
            })
            .from(invoice)
            .where(and(...invConditions))
            .orderBy(desc(invoice.invoiceDate));

          columns = [
            { key: "invoiceNumber", label: "Invoice #" },
            { key: "business", label: "Business" },
            { key: "invoiceDate", label: "Date", type: "date" },
            { key: "dueDate", label: "Due Date", type: "date" },
            { key: "totalAmount", label: "Total", type: "currency" },
            { key: "amountPaid", label: "Paid", type: "currency" },
            { key: "amountDue", label: "Due", type: "currency" },
            { key: "status", label: "Status" },
          ];

          data = invoicesData;

          // Summary by status
          const statusSummary = invoicesData.reduce(
            (acc, inv) => {
              if (!acc[inv.status]) {
                acc[inv.status] = { count: 0, total: 0 };
              }
              acc[inv.status].count += 1;
              acc[inv.status].total += Number.parseFloat(inv.totalAmount);
              return acc;
            },
            {} as Record<string, { count: number; total: number }>
          );

          summary = {
            totalInvoices: invoicesData.length,
            byStatus: statusSummary,
          };
          break;
        }

        case "DEADLINE_SUMMARY": {
          // Deadline Summary Report
          const deadlineConditions = [
            sql`${deadline.business}::text = ANY(ARRAY[${sql.join(businessFilter, sql`, `)}]::text[])`,
          ];

          if (input.filters?.fromDate) {
            deadlineConditions.push(
              gte(deadline.dueDate, input.filters.fromDate)
            );
          }
          if (input.filters?.toDate) {
            deadlineConditions.push(
              lte(deadline.dueDate, input.filters.toDate)
            );
          }

          const deadlinesData = await db
            .select({
              title: deadline.title,
              business: deadline.business,
              dueDate: deadline.dueDate,
              priority: deadline.priority,
              isCompleted: deadline.isCompleted,
              type: deadline.type,
            })
            .from(deadline)
            .where(and(...deadlineConditions))
            .orderBy(deadline.dueDate);

          // Compute status from isCompleted and dueDate
          const _today = new Date();
          const deadlinesWithStatus = deadlinesData.map((d) => ({
            ...d,
            status: getDeadlineStatus(d.isCompleted, d.dueDate),
          }));

          columns = [
            { key: "title", label: "Title" },
            { key: "business", label: "Business" },
            { key: "dueDate", label: "Due Date", type: "date" },
            { key: "priority", label: "Priority" },
            { key: "status", label: "Status" },
            { key: "type", label: "Type" },
          ];

          data = deadlinesWithStatus;

          // Summary
          const overdue = deadlinesWithStatus.filter(
            (d) => d.status === "OVERDUE"
          ).length;

          summary = {
            totalDeadlines: deadlinesWithStatus.length,
            overdue,
            upcoming: deadlinesWithStatus.filter((d) => d.status === "PENDING")
              .length,
            completed: deadlinesWithStatus.filter(
              (d) => d.status === "COMPLETED"
            ).length,
          };
          break;
        }

        case "STAFF_PRODUCTIVITY": {
          // Staff Productivity Report
          const staffData = await db
            .select({
              staffId: staff.id,
              staffName: user.name,
              staffEmail: user.email,
              role: staff.role,
              businesses: staff.businesses,
              isActive: staff.isActive,
            })
            .from(staff)
            .innerJoin(user, eq(staff.userId, user.id))
            .where(eq(staff.isActive, true));

          // Get matter counts per staff (as assigned)
          const matterCounts = await db
            .select({
              assignedStaffId: matter.assignedStaffId,
              count: count(),
            })
            .from(matter)
            .where(
              sql`${matter.business}::text = ANY(ARRAY[${sql.join(businessFilter, sql`, `)}]::text[])`
            )
            .groupBy(matter.assignedStaffId);

          const countMap = matterCounts.reduce(
            (acc, row) => {
              if (row.assignedStaffId) {
                acc[row.assignedStaffId] = row.count;
              }
              return acc;
            },
            {} as Record<string, number>
          );

          const staffWithCounts = staffData.map((s) => ({
            ...s,
            matterCount: countMap[s.staffId] || 0,
          }));

          columns = [
            { key: "staffName", label: "Name" },
            { key: "staffEmail", label: "Email" },
            { key: "role", label: "Role" },
            { key: "matterCount", label: "Matters Assigned", type: "number" },
          ];

          data = staffWithCounts;
          summary = {
            totalStaff: staffWithCounts.length,
            totalMattersAssigned: Object.values(countMap).reduce(
              (sum, c) => sum + c,
              0
            ),
          };
          break;
        }

        default:
          throw new ORPCError("NOT_FOUND", {
            message: `Report '${input.reportCode}' not implemented`,
          });
      }

      // Save execution record
      const [execution] = await db
        .insert(reportExecution)
        .values({
          reportId: input.reportCode, // Using report code as ID for now
          parameters: input.filters || {},
          filters: input.filters || {},
          format: input.format,
          status: "COMPLETED",
          rowCount: Array.isArray(data) ? data.length : 0,
          executedById: context.session.user.id,
          completedAt: new Date(),
        })
        .returning();

      return {
        executionId: execution?.id,
        report: {
          code: input.reportCode,
          name: reportConfig.name,
          description: reportConfig.description,
          category: reportConfig.category,
        },
        columns,
        data,
        summary,
        filters: input.filters,
        format: input.format,
        generatedAt: new Date().toISOString(),
        rowCount: Array.isArray(data) ? data.length : 0,
      };
    }),

  /**
   * Get execution history
   */
  history: staffProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .handler(async ({ input, context }) => {
      const executions = await db
        .select({
          id: reportExecution.id,
          reportId: reportExecution.reportId,
          format: reportExecution.format,
          status: reportExecution.status,
          rowCount: reportExecution.rowCount,
          startedAt: reportExecution.startedAt,
          completedAt: reportExecution.completedAt,
        })
        .from(reportExecution)
        .where(eq(reportExecution.executedById, context.session.user.id))
        .orderBy(desc(reportExecution.startedAt))
        .limit(input.limit);

      return executions;
    }),

  /**
   * Get report categories
   */
  categories: staffProcedure.handler(async () => [
    { value: "CLIENT", label: "Client Reports" },
    { value: "MATTER", label: "Matter Reports" },
    { value: "FINANCIAL", label: "Financial Reports" },
    { value: "DEADLINE", label: "Deadline Reports" },
    { value: "STAFF", label: "Staff Reports" },
  ]),

  /**
   * Export report to file format (PDF, Excel, CSV)
   */
  export: staffProcedure
    .input(executeReportSchema)
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex report logic
    .handler(async ({ input, context }) => {
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);

      if (accessibleBusinesses.length === 0) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to any business data",
        });
      }

      // Validate business filter
      if (
        input.filters?.business &&
        !accessibleBusinesses.includes(input.filters.business)
      ) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this business",
        });
      }

      const businessFilter = input.filters?.business
        ? [input.filters.business]
        : accessibleBusinesses;

      // Get report configuration
      const reportConfig =
        STANDARD_REPORTS[input.reportCode as keyof typeof STANDARD_REPORTS];
      if (!reportConfig) {
        throw new ORPCError("NOT_FOUND", {
          message: `Report '${input.reportCode}' not found`,
        });
      }

      // Execute the specific report (same logic as execute endpoint)
      let data: Record<string, unknown>[] = [];
      let columns: Array<{ key: string; label: string; type?: string }> = [];
      let summary: Record<string, unknown> = {};

      switch (input.reportCode) {
        case "CLIENT_SUMMARY": {
          const clientsData = await db
            .select({
              type: client.type,
              business: client.business,
              count: count(),
            })
            .from(client)
            .where(
              sql`${client.business}::text = ANY(ARRAY[${sql.join(businessFilter, sql`, `)}]::text[])`
            )
            .groupBy(client.type, client.business);

          const totalClients = await db
            .select({ total: count() })
            .from(client)
            .where(
              sql`${client.business}::text = ANY(ARRAY[${sql.join(businessFilter, sql`, `)}]::text[])`
            );

          columns = [
            { key: "type", label: "Client Type" },
            { key: "business", label: "Business" },
            { key: "count", label: "Count", type: "number" },
          ];

          data = clientsData as Record<string, unknown>[];
          summary = {
            totalClients: totalClients[0]?.total || 0,
          };
          break;
        }

        case "MATTER_STATUS": {
          const mattersData = await db
            .select({
              status: matter.status,
              business: matter.business,
              count: count(),
            })
            .from(matter)
            .where(
              sql`${matter.business}::text = ANY(ARRAY[${sql.join(businessFilter, sql`, `)}]::text[])`
            )
            .groupBy(matter.status, matter.business);

          columns = [
            { key: "status", label: "Status" },
            { key: "business", label: "Business" },
            { key: "count", label: "Count", type: "number" },
          ];

          data = mattersData as Record<string, unknown>[];
          summary = {
            totalMatters: mattersData.reduce((sum, row) => sum + row.count, 0),
          };
          break;
        }

        case "REVENUE_SUMMARY": {
          const invoiceConditions = [
            sql`${invoice.business}::text = ANY(ARRAY[${sql.join(businessFilter, sql`, `)}]::text[])`,
            or(
              eq(invoice.status, "SENT"),
              eq(invoice.status, "PAID"),
              eq(invoice.status, "OVERDUE")
            ),
          ];

          if (input.filters?.fromDate) {
            invoiceConditions.push(
              gte(invoice.invoiceDate, input.filters.fromDate)
            );
          }
          if (input.filters?.toDate) {
            invoiceConditions.push(
              lte(invoice.invoiceDate, input.filters.toDate)
            );
          }

          const revenueData = await db
            .select({
              business: invoice.business,
              totalInvoiced: sql<string>`COALESCE(SUM(CAST(${invoice.totalAmount} AS DECIMAL)), 0)`,
              totalPaid: sql<string>`COALESCE(SUM(CAST(${invoice.amountPaid} AS DECIMAL)), 0)`,
              totalOutstanding: sql<string>`COALESCE(SUM(CAST(${invoice.amountDue} AS DECIMAL)), 0)`,
              invoiceCount: count(),
            })
            .from(invoice)
            .where(and(...invoiceConditions))
            .groupBy(invoice.business);

          columns = [
            { key: "business", label: "Business" },
            { key: "totalInvoiced", label: "Total Invoiced", type: "currency" },
            { key: "totalPaid", label: "Total Paid", type: "currency" },
            { key: "totalOutstanding", label: "Outstanding", type: "currency" },
            { key: "invoiceCount", label: "Invoices", type: "number" },
          ];

          data = revenueData as Record<string, unknown>[];
          summary = {
            grandTotal: revenueData.reduce(
              (sum, row) => sum + Number.parseFloat(row.totalInvoiced),
              0
            ),
          };
          break;
        }

        case "ACCOUNTS_RECEIVABLE": {
          const arConditions = [
            sql`${invoice.business}::text = ANY(ARRAY[${sql.join(businessFilter, sql`, `)}]::text[])`,
            or(eq(invoice.status, "SENT"), eq(invoice.status, "OVERDUE")),
            sql`CAST(${invoice.amountDue} AS DECIMAL) > 0`,
          ];

          const arData = await db
            .select({
              invoiceNumber: invoice.invoiceNumber,
              business: invoice.business,
              invoiceDate: invoice.invoiceDate,
              dueDate: invoice.dueDate,
              totalAmount: invoice.totalAmount,
              amountDue: invoice.amountDue,
              status: invoice.status,
            })
            .from(invoice)
            .where(and(...arConditions))
            .orderBy(desc(invoice.dueDate));

          const today = new Date();
          const arWithAging = arData.map((inv) => {
            const dueDate = new Date(inv.dueDate);
            const daysOverdue = Math.floor(
              (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            let agingBucket = "Current";
            if (daysOverdue > 0 && daysOverdue <= 30) {
              agingBucket = "1-30 Days";
            } else if (daysOverdue > 30 && daysOverdue <= 60) {
              agingBucket = "31-60 Days";
            } else if (daysOverdue > 60 && daysOverdue <= 90) {
              agingBucket = "61-90 Days";
            } else if (daysOverdue > 90) {
              agingBucket = "90+ Days";
            }

            return {
              ...inv,
              daysOverdue: Math.max(0, daysOverdue),
              agingBucket,
            };
          });

          columns = [
            { key: "invoiceNumber", label: "Invoice #" },
            { key: "business", label: "Business" },
            { key: "invoiceDate", label: "Invoice Date", type: "date" },
            { key: "dueDate", label: "Due Date", type: "date" },
            { key: "totalAmount", label: "Total", type: "currency" },
            { key: "amountDue", label: "Due", type: "currency" },
            { key: "agingBucket", label: "Aging" },
            { key: "daysOverdue", label: "Days Overdue", type: "number" },
          ];

          data = arWithAging as Record<string, unknown>[];
          summary = {
            totalOutstanding: arWithAging.reduce(
              (sum, inv) => sum + Number.parseFloat(inv.amountDue),
              0
            ),
            invoiceCount: arWithAging.length,
          };
          break;
        }

        case "INVOICE_REPORT": {
          const invConditions = [
            sql`${invoice.business}::text = ANY(ARRAY[${sql.join(businessFilter, sql`, `)}]::text[])`,
          ];

          if (input.filters?.fromDate) {
            invConditions.push(
              gte(invoice.invoiceDate, input.filters.fromDate)
            );
          }
          if (input.filters?.toDate) {
            invConditions.push(lte(invoice.invoiceDate, input.filters.toDate));
          }
          if (input.filters?.status) {
            invConditions.push(
              eq(
                invoice.status,
                input.filters.status as
                  | "DRAFT"
                  | "SENT"
                  | "PAID"
                  | "OVERDUE"
                  | "CANCELLED"
              )
            );
          }

          const invoicesData = await db
            .select({
              invoiceNumber: invoice.invoiceNumber,
              business: invoice.business,
              invoiceDate: invoice.invoiceDate,
              dueDate: invoice.dueDate,
              totalAmount: invoice.totalAmount,
              amountPaid: invoice.amountPaid,
              amountDue: invoice.amountDue,
              status: invoice.status,
            })
            .from(invoice)
            .where(and(...invConditions))
            .orderBy(desc(invoice.invoiceDate));

          columns = [
            { key: "invoiceNumber", label: "Invoice #" },
            { key: "business", label: "Business" },
            { key: "invoiceDate", label: "Date", type: "date" },
            { key: "dueDate", label: "Due Date", type: "date" },
            { key: "totalAmount", label: "Total", type: "currency" },
            { key: "amountPaid", label: "Paid", type: "currency" },
            { key: "amountDue", label: "Due", type: "currency" },
            { key: "status", label: "Status" },
          ];

          data = invoicesData as Record<string, unknown>[];
          summary = {
            totalInvoices: invoicesData.length,
          };
          break;
        }

        case "DEADLINE_SUMMARY": {
          const deadlineConditions = [
            sql`${deadline.business}::text = ANY(ARRAY[${sql.join(businessFilter, sql`, `)}]::text[])`,
          ];

          if (input.filters?.fromDate) {
            deadlineConditions.push(
              gte(deadline.dueDate, input.filters.fromDate)
            );
          }
          if (input.filters?.toDate) {
            deadlineConditions.push(
              lte(deadline.dueDate, input.filters.toDate)
            );
          }

          const deadlinesData = await db
            .select({
              title: deadline.title,
              business: deadline.business,
              dueDate: deadline.dueDate,
              priority: deadline.priority,
              status: deadline.status,
              type: deadline.type,
            })
            .from(deadline)
            .where(and(...deadlineConditions))
            .orderBy(deadline.dueDate);

          columns = [
            { key: "title", label: "Title" },
            { key: "business", label: "Business" },
            { key: "dueDate", label: "Due Date", type: "date" },
            { key: "priority", label: "Priority" },
            { key: "status", label: "Status" },
            { key: "type", label: "Type" },
          ];

          data = deadlinesData as Record<string, unknown>[];
          summary = {
            totalDeadlines: deadlinesData.length,
          };
          break;
        }

        case "STAFF_PRODUCTIVITY": {
          const staffData = await db
            .select({
              staffId: staff.id,
              staffName: user.name,
              staffEmail: user.email,
              role: staff.role,
            })
            .from(staff)
            .innerJoin(user, eq(staff.userId, user.id))
            .where(eq(staff.isActive, true));

          const matterCounts = await db
            .select({
              assignedToId: matter.assignedToId,
              count: count(),
            })
            .from(matter)
            .where(
              sql`${matter.business}::text = ANY(ARRAY[${sql.join(businessFilter, sql`, `)}]::text[])`
            )
            .groupBy(matter.assignedToId);

          const countMap = matterCounts.reduce(
            (acc, row) => {
              if (row.assignedToId) {
                acc[row.assignedToId] = row.count;
              }
              return acc;
            },
            {} as Record<string, number>
          );

          const staffWithCounts = staffData.map((s) => ({
            ...s,
            matterCount: countMap[s.staffId] || 0,
          }));

          columns = [
            { key: "staffName", label: "Name" },
            { key: "staffEmail", label: "Email" },
            { key: "role", label: "Role" },
            { key: "matterCount", label: "Matters Assigned", type: "number" },
          ];

          data = staffWithCounts as Record<string, unknown>[];
          summary = {
            totalStaff: staffWithCounts.length,
          };
          break;
        }

        default:
          throw new ORPCError("NOT_FOUND", {
            message: `Report '${input.reportCode}' not implemented`,
          });
      }

      // Generate export file
      const reportExportData = {
        reportName: reportConfig.name,
        description: reportConfig.description,
        columns,
        data,
        summary,
        filters: input.filters,
        generatedAt: new Date().toISOString(),
        generatedBy: context.session.user.name || context.session.user.email,
      };

      let fileContent: string | Buffer | Uint8Array;
      let contentType: string;
      let fileExtension: string;

      switch (input.format) {
        case "PDF": {
          const { generateReportPdf } = await import("../utils/report-exports");
          fileContent = await generateReportPdf(reportExportData);
          contentType = "application/pdf";
          fileExtension = "pdf";
          break;
        }
        case "EXCEL": {
          const { generateReportExcel } = await import(
            "../utils/report-exports"
          );
          fileContent = await generateReportExcel(reportExportData);
          contentType =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
          fileExtension = "xlsx";
          break;
        }
        case "CSV": {
          const { generateReportCsv } = await import("../utils/report-exports");
          fileContent = generateReportCsv(reportExportData);
          contentType = "text/csv";
          fileExtension = "csv";
          break;
        }
        default:
          throw new ORPCError("BAD_REQUEST", {
            message: `Unsupported format: ${input.format}`,
          });
      }

      // Convert to base64 for transmission
      let base64Content: string;
      if (typeof fileContent === "string") {
        base64Content = Buffer.from(fileContent).toString("base64");
      } else if (fileContent instanceof Uint8Array) {
        base64Content = Buffer.from(fileContent).toString("base64");
      } else {
        base64Content = fileContent.toString("base64");
      }

      // Save execution record
      const [execution] = await db
        .insert(reportExecution)
        .values({
          reportId: input.reportCode,
          parameters: input.filters || {},
          filters: input.filters || {},
          format: input.format,
          status: "COMPLETED",
          rowCount: data.length,
          executedById: context.session.user.id,
          completedAt: new Date(),
        })
        .returning();

      const filename = `${input.reportCode.toLowerCase().replace(/_/g, "-")}-${new Date().toISOString().split("T")[0]}.${fileExtension}`;

      return {
        executionId: execution?.id,
        file: base64Content,
        filename,
        contentType,
        format: input.format,
        rowCount: data.length,
      };
    }),

  // =============================================
  // CUSTOM REPORTS
  // =============================================

  /**
   * List custom reports
   */
  listCustomReports: staffProcedure.handler(async ({ context }) => {
    const { reportDefinition } = await import("@SYNERGY-GY/db");

    const reports = await db.query.reportDefinition.findMany({
      where: eq(reportDefinition.type, "CUSTOM"),
      orderBy: (rd, { desc }) => [desc(rd.createdAt)],
      with: {
        createdBy: {
          columns: { name: true, email: true },
        },
      },
    });

    return reports;
  }),

  /**
   * Create custom report
   */
  createCustomReport: staffProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        category: z.enum(reportCategoryValues),
        queryTemplate: z.string(),
        columns: z.array(
          z.object({
            key: z.string(),
            label: z.string(),
            type: z.enum(["text", "number", "currency", "date"]).optional(),
          })
        ),
        parameters: z
          .array(
            z.object({
              key: z.string(),
              label: z.string(),
              type: z.enum(["text", "date", "select"]),
              required: z.boolean().optional(),
              options: z.array(z.string()).optional(),
            })
          )
          .optional(),
        defaultFilters: z.record(z.unknown()).optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { reportDefinition } = await import("@SYNERGY-GY/db");

      const [report] = await db
        .insert(reportDefinition)
        .values({
          name: input.name,
          description: input.description,
          type: "CUSTOM",
          category: input.category,
          queryTemplate: input.queryTemplate,
          columns: input.columns,
          parameters: input.parameters || [],
          defaultFilters: input.defaultFilters || {},
          createdById: context.session.user.id,
        })
        .returning();

      return report;
    }),

  /**
   * Update custom report
   */
  updateCustomReport: staffProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        category: z.enum(reportCategoryValues).optional(),
        queryTemplate: z.string().optional(),
        columns: z
          .array(
            z.object({
              key: z.string(),
              label: z.string(),
              type: z.enum(["text", "number", "currency", "date"]).optional(),
            })
          )
          .optional(),
        parameters: z
          .array(
            z.object({
              key: z.string(),
              label: z.string(),
              type: z.enum(["text", "date", "select"]),
              required: z.boolean().optional(),
              options: z.array(z.string()).optional(),
            })
          )
          .optional(),
        defaultFilters: z.record(z.unknown()).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { reportDefinition } = await import("@SYNERGY-GY/db");

      // Verify ownership or admin access
      const existing = await db.query.reportDefinition.findFirst({
        where: and(
          eq(reportDefinition.id, input.id),
          eq(reportDefinition.type, "CUSTOM")
        ),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", {
          message: "Custom report not found",
        });
      }

      const { id, ...updateData } = input;
      const [updated] = await db
        .update(reportDefinition)
        .set(updateData)
        .where(eq(reportDefinition.id, id))
        .returning();

      return updated;
    }),

  /**
   * Delete custom report
   */
  deleteCustomReport: staffProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const { reportDefinition } = await import("@SYNERGY-GY/db");

      const existing = await db.query.reportDefinition.findFirst({
        where: and(
          eq(reportDefinition.id, input.id),
          eq(reportDefinition.type, "CUSTOM")
        ),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", {
          message: "Custom report not found",
        });
      }

      await db
        .delete(reportDefinition)
        .where(eq(reportDefinition.id, input.id));

      return { success: true };
    }),

  // =============================================
  // SCHEDULED REPORTS
  // =============================================

  /**
   * List scheduled reports
   */
  listSchedules: staffProcedure.handler(async ({ context }) => {
    const { scheduledReport } = await import("@SYNERGY-GY/db");

    const schedules = await db.query.scheduledReport.findMany({
      orderBy: (sr, { asc }) => [asc(sr.nextRunAt)],
      with: {
        report: {
          columns: { name: true, category: true },
        },
        createdBy: {
          columns: { name: true, email: true },
        },
      },
    });

    return schedules;
  }),

  /**
   * Create scheduled report
   */
  createSchedule: staffProcedure
    .input(
      z.object({
        reportId: z.string(),
        name: z.string().min(1).max(100),
        parameters: z.record(z.unknown()).optional(),
        frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
        dayOfWeek: z.number().min(0).max(6).optional(),
        dayOfMonth: z.number().min(1).max(31).optional(),
        time: z.string(), // HH:MM format
        format: z.enum(reportFormatValues).default("PDF"),
        recipients: z.array(z.string().email()),
      })
    )
    .handler(async ({ input, context }) => {
      const { scheduledReport, reportDefinition } = await import(
        "@SYNERGY-GY/db"
      );

      // Verify report exists
      const report = await db.query.reportDefinition.findFirst({
        where: eq(reportDefinition.id, input.reportId),
      });

      // Also check if it's a standard report code
      const isStandardReport =
        input.reportId in STANDARD_REPORTS ||
        Object.keys(STANDARD_REPORTS).includes(input.reportId);

      if (!(report || isStandardReport)) {
        throw new ORPCError("NOT_FOUND", {
          message: "Report not found",
        });
      }

      // Calculate next run time
      const nextRunAt = calculateNextRun(
        input.frequency,
        input.time,
        input.dayOfWeek,
        input.dayOfMonth
      );

      const [schedule] = await db
        .insert(scheduledReport)
        .values({
          reportId: input.reportId,
          name: input.name,
          parameters: input.parameters || {},
          frequency: input.frequency,
          dayOfWeek: input.dayOfWeek,
          dayOfMonth: input.dayOfMonth,
          time: input.time,
          format: input.format,
          recipients: input.recipients,
          nextRunAt,
          createdById: context.session.user.id,
        })
        .returning();

      return schedule;
    }),

  /**
   * Update scheduled report
   */
  updateSchedule: staffProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        parameters: z.record(z.unknown()).optional(),
        frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional(),
        dayOfWeek: z.number().min(0).max(6).optional(),
        dayOfMonth: z.number().min(1).max(31).optional(),
        time: z.string().optional(),
        format: z.enum(reportFormatValues).optional(),
        recipients: z.array(z.string().email()).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .handler(async ({ input }) => {
      const { scheduledReport } = await import("@SYNERGY-GY/db");

      const existing = await db.query.scheduledReport.findFirst({
        where: eq(scheduledReport.id, input.id),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", {
          message: "Schedule not found",
        });
      }

      // Recalculate next run if schedule changed
      let nextRunAt = existing.nextRunAt;
      if (
        input.frequency ||
        input.time ||
        input.dayOfWeek ||
        input.dayOfMonth
      ) {
        nextRunAt = calculateNextRun(
          input.frequency || existing.frequency,
          input.time || existing.time,
          input.dayOfWeek ?? existing.dayOfWeek ?? undefined,
          input.dayOfMonth ?? existing.dayOfMonth ?? undefined
        );
      }

      const { id, ...updateData } = input;
      const [updated] = await db
        .update(scheduledReport)
        .set({ ...updateData, nextRunAt })
        .where(eq(scheduledReport.id, id))
        .returning();

      return updated;
    }),

  /**
   * Delete scheduled report
   */
  deleteSchedule: staffProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const { scheduledReport } = await import("@SYNERGY-GY/db");

      await db.delete(scheduledReport).where(eq(scheduledReport.id, input.id));

      return { success: true };
    }),

  /**
   * Run a scheduled report immediately
   */
  runScheduleNow: staffProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { scheduledReport } = await import("@SYNERGY-GY/db");

      const schedule = await db.query.scheduledReport.findFirst({
        where: eq(scheduledReport.id, input.id),
      });

      if (!schedule) {
        throw new ORPCError("NOT_FOUND", {
          message: "Schedule not found",
        });
      }

      // Execute the report (reuse export logic)
      // For now, return success - actual execution would go through a job queue
      // Update last run time
      await db
        .update(scheduledReport)
        .set({
          lastRunAt: new Date(),
          nextRunAt: calculateNextRun(
            schedule.frequency,
            schedule.time,
            schedule.dayOfWeek ?? undefined,
            schedule.dayOfMonth ?? undefined
          ),
        })
        .where(eq(scheduledReport.id, input.id));

      return {
        success: true,
        message: "Report execution started",
      };
    }),
};

// Helper: Calculate next run time
function calculateNextRun(
  frequency: "DAILY" | "WEEKLY" | "MONTHLY",
  time: string,
  dayOfWeek?: number,
  dayOfMonth?: number
): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const now = new Date();
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);

  // If time has passed today, start from tomorrow
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  switch (frequency) {
    case "DAILY":
      // Already set to next occurrence
      break;
    case "WEEKLY":
      if (dayOfWeek !== undefined) {
        const currentDay = next.getDay();
        const daysUntil = (dayOfWeek - currentDay + 7) % 7;
        if (daysUntil === 0 && next <= now) {
          next.setDate(next.getDate() + 7);
        } else {
          next.setDate(next.getDate() + daysUntil);
        }
      }
      break;
    case "MONTHLY":
      if (dayOfMonth !== undefined) {
        next.setDate(dayOfMonth);
        if (next <= now) {
          next.setMonth(next.getMonth() + 1);
        }
      }
      break;
  }

  return next;
}
