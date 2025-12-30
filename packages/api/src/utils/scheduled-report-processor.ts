/**
 * Scheduled Report Processor
 *
 * Processes due scheduled reports every 5 minutes.
 * Checks scheduledReport table where isActive = true and nextRunAt <= now().
 * Generates the report file (PDF/Excel/CSV) and emails it to recipients.
 * Updates lastRunAt and calculates new nextRunAt.
 */

import {
  client,
  db,
  deadline,
  invoice,
  matter,
  scheduledReport,
  staff,
  user,
} from "@SYNERGY-GY/db";
import { and, count, desc, eq, lte, sql } from "drizzle-orm";
import { type ScheduledReportEmailData, sendScheduledReport } from "./email";
import {
  generateReportCsv,
  generateReportExcel,
  generateReportPdf,
} from "./report-exports";

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes

// Standard report configurations (matching reports.ts)
const STANDARD_REPORTS: Record<
  string,
  { name: string; description: string; category: string }
> = {
  CLIENT_SUMMARY: {
    name: "Client Summary Report",
    description: "Overview of all clients",
    category: "CLIENT",
  },
  CLIENT_ACTIVITY: {
    name: "Client Activity Report",
    description: "Client activity and matter counts",
    category: "CLIENT",
  },
  MATTER_STATUS: {
    name: "Matter Status Report",
    description: "Status of all matters",
    category: "MATTER",
  },
  MATTER_REVENUE: {
    name: "Matter Revenue Report",
    description: "Revenue by matter status and business",
    category: "MATTER",
  },
  REVENUE_SUMMARY: {
    name: "Revenue Summary",
    description: "Financial overview",
    category: "FINANCIAL",
  },
  INVOICE_AGING: {
    name: "Invoice Aging Report",
    description: "Outstanding invoices by age",
    category: "FINANCIAL",
  },
  DEADLINE_SUMMARY: {
    name: "Deadline Summary Report",
    description: "Upcoming and overdue deadlines",
    category: "DEADLINE",
  },
  STAFF_PRODUCTIVITY: {
    name: "Staff Productivity Report",
    description: "Staff workload and assignments",
    category: "STAFF",
  },
};

type ReportColumn = {
  key: string;
  label: string;
  type?: string;
};

type ReportData = {
  reportName: string;
  description: string;
  columns: ReportColumn[];
  data: Record<string, unknown>[];
  summary: Record<string, unknown>;
  filters?: {
    business?: string;
    fromDate?: string;
    toDate?: string;
  };
  generatedAt: string;
  generatedBy: string;
};

/**
 * Get deadline status from completion and due date
 */
function getDeadlineStatus(
  isCompleted: boolean,
  dueDate: Date | string
): string {
  if (isCompleted) {
    return "COMPLETED";
  }
  const due = new Date(dueDate);
  const now = new Date();
  if (due < now) {
    return "OVERDUE";
  }
  const daysUntilDue = Math.ceil(
    (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysUntilDue <= 7) {
    return "DUE_SOON";
  }
  return "PENDING";
}

/**
 * Generate report data for a given report code
 * This mirrors the logic in reports.ts exportReport handler
 */
async function generateReportData(
  reportCode: string,
  parameters: Record<string, unknown>
): Promise<ReportData> {
  const reportConfig = STANDARD_REPORTS[reportCode];
  if (!reportConfig) {
    throw new Error(`Unknown report code: ${reportCode}`);
  }

  // Default business filter to both businesses
  const businessFilter = (parameters.business as string[]) || ["GCMC", "KAJ"];

  let columns: ReportColumn[] = [];
  let data: Record<string, unknown>[] = [];
  let summary: Record<string, unknown> = {};

  switch (reportCode) {
    case "CLIENT_SUMMARY": {
      const clientConditions = [
        sql`${client.businesses} && ARRAY[${sql.join(businessFilter, sql`, `)}]::text[]`,
      ];

      const clientsData = await db
        .select({
          displayName: client.displayName,
          email: client.email,
          phone: client.phone,
          type: client.type,
          status: client.status,
          createdAt: client.createdAt,
        })
        .from(client)
        .where(and(...clientConditions))
        .orderBy(desc(client.createdAt));

      columns = [
        { key: "displayName", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "type", label: "Type" },
        { key: "status", label: "Status" },
        { key: "createdAt", label: "Created", type: "date" },
      ];
      data = clientsData as Record<string, unknown>[];
      summary = { totalClients: clientsData.length };
      break;
    }

    case "CLIENT_ACTIVITY": {
      const clientConditions = [
        sql`${client.businesses} && ARRAY[${sql.join(businessFilter, sql`, `)}]::text[]`,
      ];

      const clientsWithActivity = await db
        .select({
          id: client.id,
          displayName: client.displayName,
          email: client.email,
          type: client.type,
          status: client.status,
        })
        .from(client)
        .where(and(...clientConditions))
        .orderBy(desc(client.createdAt));

      const matterCountsByClient = await db
        .select({
          clientId: matter.clientId,
          total: count(),
          completed: sql<number>`COUNT(*) FILTER (WHERE ${matter.status} = 'COMPLETE')`,
          inProgress: sql<number>`COUNT(*) FILTER (WHERE ${matter.status} = 'IN_PROGRESS')`,
        })
        .from(matter)
        .where(
          sql`${matter.business}::text = ANY(ARRAY[${sql.join(businessFilter, sql`, `)}]::text[])`
        )
        .groupBy(matter.clientId);

      const matterCountMap = matterCountsByClient.reduce(
        (acc, row) => {
          acc[row.clientId] = {
            total: row.total,
            completed: Number(row.completed),
            inProgress: Number(row.inProgress),
          };
          return acc;
        },
        {} as Record<
          string,
          { total: number; completed: number; inProgress: number }
        >
      );

      const clientActivityData = clientsWithActivity.map((c) => ({
        displayName: c.displayName,
        email: c.email,
        type: c.type,
        status: c.status,
        totalMatters: matterCountMap[c.id]?.total || 0,
        completedMatters: matterCountMap[c.id]?.completed || 0,
        inProgressMatters: matterCountMap[c.id]?.inProgress || 0,
      }));

      columns = [
        { key: "displayName", label: "Client Name" },
        { key: "email", label: "Email" },
        { key: "type", label: "Type" },
        { key: "status", label: "Status" },
        { key: "totalMatters", label: "Total Matters", type: "number" },
        { key: "completedMatters", label: "Completed", type: "number" },
        { key: "inProgressMatters", label: "In Progress", type: "number" },
      ];

      data = clientActivityData as Record<string, unknown>[];
      summary = {
        totalClients: clientActivityData.length,
        totalMatters: clientActivityData.reduce(
          (sum, c) => sum + c.totalMatters,
          0
        ),
      };
      break;
    }

    case "MATTER_STATUS": {
      const matterConditions = [
        sql`${matter.business}::text = ANY(ARRAY[${sql.join(businessFilter, sql`, `)}]::text[])`,
      ];

      const mattersData = await db
        .select({
          title: matter.title,
          business: matter.business,
          status: matter.status,
          priority: matter.priority,
          estimatedFee: matter.estimatedFee,
          createdAt: matter.createdAt,
        })
        .from(matter)
        .where(and(...matterConditions))
        .orderBy(desc(matter.createdAt));

      columns = [
        { key: "title", label: "Title" },
        { key: "business", label: "Business" },
        { key: "status", label: "Status" },
        { key: "priority", label: "Priority" },
        { key: "estimatedFee", label: "Estimated Fee", type: "currency" },
        { key: "createdAt", label: "Created", type: "date" },
      ];
      data = mattersData as Record<string, unknown>[];
      summary = { totalMatters: mattersData.length };
      break;
    }

    case "MATTER_REVENUE": {
      const matterRevenueConditions = [
        sql`${matter.business}::text = ANY(ARRAY[${sql.join(businessFilter, sql`, `)}]::text[])`,
      ];

      const matterRevenueData = await db
        .select({
          business: matter.business,
          status: matter.status,
          count: count(),
          estimatedFee: sql<string>`COALESCE(SUM(CAST(${matter.estimatedFee} AS DECIMAL)), 0)`,
          actualFee: sql<string>`COALESCE(SUM(CAST(${matter.actualFee} AS DECIMAL)), 0)`,
          paidCount: sql<number>`COUNT(*) FILTER (WHERE ${matter.isPaid} = true)`,
        })
        .from(matter)
        .where(and(...matterRevenueConditions))
        .groupBy(matter.business, matter.status);

      columns = [
        { key: "business", label: "Business" },
        { key: "status", label: "Status" },
        { key: "count", label: "Matters", type: "number" },
        { key: "estimatedFee", label: "Estimated Fees", type: "currency" },
        { key: "actualFee", label: "Actual Fees", type: "currency" },
        { key: "paidCount", label: "Paid", type: "number" },
      ];

      data = matterRevenueData.map((row) => ({
        business: row.business,
        status: row.status,
        count: row.count,
        estimatedFee: row.estimatedFee,
        actualFee: row.actualFee,
        paidCount: Number(row.paidCount),
      })) as Record<string, unknown>[];
      summary = {
        totalMatters: matterRevenueData.reduce(
          (sum, row) => sum + row.count,
          0
        ),
        totalEstimated: matterRevenueData.reduce(
          (sum, row) => sum + Number.parseFloat(row.estimatedFee),
          0
        ),
        totalActual: matterRevenueData.reduce(
          (sum, row) => sum + Number.parseFloat(row.actualFee),
          0
        ),
      };
      break;
    }

    case "REVENUE_SUMMARY": {
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
        .where(
          sql`${invoice.business}::text = ANY(ARRAY[${sql.join(businessFilter, sql`, `)}]::text[])`
        )
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
      summary = { totalInvoices: invoicesData.length };
      break;
    }

    case "DEADLINE_SUMMARY": {
      const deadlineConditions = [
        sql`${deadline.business}::text = ANY(ARRAY[${sql.join(businessFilter, sql`, `)}]::text[])`,
      ];

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
      data = deadlinesWithStatus as Record<string, unknown>[];
      summary = { totalDeadlines: deadlinesWithStatus.length };
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
      data = staffWithCounts as Record<string, unknown>[];
      summary = { totalStaff: staffWithCounts.length };
      break;
    }

    default:
      throw new Error(`Report ${reportCode} is not implemented for scheduling`);
  }

  return {
    reportName: reportConfig.name,
    description: reportConfig.description,
    columns,
    data,
    summary,
    filters: {
      business: businessFilter.join(", "),
    },
    generatedAt: new Date().toISOString(),
    generatedBy: "Scheduled Report System",
  };
}

/**
 * Adjust date for weekly schedule
 */
function adjustForWeeklySchedule(
  next: Date,
  now: Date,
  dayOfWeek: number
): void {
  const currentDay = next.getDay();
  const daysUntil = (dayOfWeek - currentDay + 7) % 7;
  const isSameDayPassed = daysUntil === 0 && next <= now;
  next.setDate(next.getDate() + (isSameDayPassed ? 7 : daysUntil));
}

/**
 * Adjust date for monthly schedule
 */
function adjustForMonthlySchedule(
  next: Date,
  now: Date,
  dayOfMonth: number
): void {
  next.setDate(dayOfMonth);
  if (next <= now) {
    next.setMonth(next.getMonth() + 1);
  }
}

/**
 * Calculate next run time based on frequency and schedule
 */
function calculateNextRun(
  frequency: "DAILY" | "WEEKLY" | "MONTHLY",
  time: string,
  dayOfWeek?: number | null,
  dayOfMonth?: number | null
): Date {
  const parts = time.split(":").map(Number);
  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;
  const now = new Date();
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);

  // If time has passed today, start from tomorrow
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  if (frequency === "WEEKLY" && dayOfWeek !== null && dayOfWeek !== undefined) {
    adjustForWeeklySchedule(next, now, dayOfWeek);
  } else if (
    frequency === "MONTHLY" &&
    dayOfMonth !== null &&
    dayOfMonth !== undefined
  ) {
    adjustForMonthlySchedule(next, now, dayOfMonth);
  }

  return next;
}

/**
 * Process a single scheduled report
 */
async function processScheduledReport(
  schedule: typeof scheduledReport.$inferSelect
): Promise<boolean> {
  const reportCode = schedule.reportId;

  console.log(
    `[ScheduledReportProcessor] Executing report: ${schedule.name} (${reportCode})`
  );

  try {
    // Generate report data
    const reportData = await generateReportData(
      reportCode,
      (schedule.parameters as Record<string, unknown>) || {}
    );

    // Generate file based on format
    let fileContent: Buffer | Uint8Array;
    let contentType: string;
    let fileExtension: string;

    switch (schedule.format) {
      case "PDF": {
        fileContent = await generateReportPdf(reportData);
        contentType = "application/pdf";
        fileExtension = "pdf";
        break;
      }
      case "EXCEL": {
        fileContent = await generateReportExcel(reportData);
        contentType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        fileExtension = "xlsx";
        break;
      }
      case "CSV": {
        const csvContent = generateReportCsv(reportData);
        fileContent = Buffer.from(csvContent, "utf-8");
        contentType = "text/csv";
        fileExtension = "csv";
        break;
      }
      default:
        throw new Error(`Unsupported format: ${schedule.format}`);
    }

    // Build filename
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `${reportCode.toLowerCase().replace(/_/g, "-")}-${timestamp}.${fileExtension}`;

    // Get recipients
    const recipients = (schedule.recipients as string[]) || [];
    if (recipients.length === 0) {
      console.warn(
        `[ScheduledReportProcessor] No recipients for schedule ${schedule.id}`
      );
      // Still mark as successful run
      await db
        .update(scheduledReport)
        .set({
          lastRunAt: new Date(),
          nextRunAt: calculateNextRun(
            schedule.frequency,
            schedule.time,
            schedule.dayOfWeek,
            schedule.dayOfMonth
          ),
        })
        .where(eq(scheduledReport.id, schedule.id));
      return true;
    }

    // Send email with attachment
    const emailData: ScheduledReportEmailData = {
      recipientEmails: recipients,
      reportName: reportData.reportName,
      scheduleName: schedule.name,
      generatedAt: new Date().toLocaleString(),
      rowCount: reportData.data.length,
      attachment: {
        filename,
        content: fileContent,
        contentType,
      },
    };

    await sendScheduledReport(emailData);

    // Update schedule
    await db
      .update(scheduledReport)
      .set({
        lastRunAt: new Date(),
        nextRunAt: calculateNextRun(
          schedule.frequency,
          schedule.time,
          schedule.dayOfWeek,
          schedule.dayOfMonth
        ),
      })
      .where(eq(scheduledReport.id, schedule.id));

    console.log(
      `[ScheduledReportProcessor] Report sent: ${schedule.name} to ${recipients.length} recipient(s)`
    );
    return true;
  } catch (error) {
    console.error(
      `[ScheduledReportProcessor] Failed to process schedule ${schedule.id}:`,
      error
    );
    return false;
  }
}

/**
 * Check for and process due scheduled reports
 */
async function checkAndProcessSchedules(): Promise<void> {
  const now = new Date();

  // Find due schedules
  const dueSchedules = await db
    .select()
    .from(scheduledReport)
    .where(
      and(
        eq(scheduledReport.isActive, true),
        lte(scheduledReport.nextRunAt, now)
      )
    )
    .limit(10); // Process up to 10 at a time

  if (dueSchedules.length === 0) {
    return;
  }

  console.log(
    `[ScheduledReportProcessor] Found ${dueSchedules.length} due schedule(s)`
  );

  for (const schedule of dueSchedules) {
    await processScheduledReport(schedule);
  }
}

let processorInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the scheduled report processor
 * Runs immediately and then every 5 minutes
 */
export function startScheduledReportProcessor(): void {
  if (processorInterval) {
    console.log("[ScheduledReportProcessor] Processor already running");
    return;
  }

  console.log(
    `[ScheduledReportProcessor] Starting processor (checking every ${CHECK_INTERVAL_MS / 1000}s)`
  );

  // Run immediately on startup
  checkAndProcessSchedules().catch((error) => {
    console.error("[ScheduledReportProcessor] Initial check failed:", error);
  });

  // Then run on interval
  processorInterval = setInterval(() => {
    checkAndProcessSchedules().catch((error) => {
      console.error(
        "[ScheduledReportProcessor] Scheduled check failed:",
        error
      );
    });
  }, CHECK_INTERVAL_MS);
}

/**
 * Stop the scheduled report processor
 */
export function stopScheduledReportProcessor(): void {
  if (processorInterval) {
    clearInterval(processorInterval);
    processorInterval = null;
    console.log("[ScheduledReportProcessor] Processor stopped");
  }
}

/**
 * Manually trigger a schedule check (useful for testing)
 */
export async function triggerScheduleCheck(): Promise<void> {
  await checkAndProcessSchedules();
}

/**
 * Execute a single scheduled report immediately
 * Used by runScheduleNow endpoint
 */
export function executeScheduledReport(
  schedule: typeof scheduledReport.$inferSelect
): Promise<boolean> {
  return processScheduledReport(schedule);
}
