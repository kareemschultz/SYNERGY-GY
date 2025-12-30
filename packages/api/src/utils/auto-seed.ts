/**
 * Auto-Seed Utility
 *
 * Runs essential seed scripts automatically on server startup.
 * All operations are idempotent - safe to run multiple times.
 *
 * Seeds:
 * - Service Categories (GCMC & KAJ)
 * - Default Tags
 * - Knowledge Base Items
 * - Email Templates
 *
 * This runs AFTER initial-setup.ts creates the owner account.
 */

import {
  DEFAULT_TAGS,
  db,
  emailTemplate,
  eq,
  serviceCategory,
  sql,
  tag,
} from "@SYNERGY-GY/db";

type SeedResult = {
  name: string;
  created: number;
  skipped: number;
};

/**
 * Run all essential seeds on startup
 * Called from server index.ts after initial setup
 */
export async function runAutoSeed(): Promise<void> {
  console.log("[AutoSeed] Running essential seeds...");

  const results: SeedResult[] = [];

  try {
    // 1. Seed Tags
    results.push(await seedTags());

    // 2. Seed Service Categories
    results.push(await seedServiceCategories());

    // 3. Seed Email Templates
    results.push(await seedEmailTemplates());

    // Log results
    let totalCreated = 0;
    let totalSkipped = 0;

    for (const result of results) {
      totalCreated += result.created;
      totalSkipped += result.skipped;
      if (result.created > 0) {
        console.log(
          `[AutoSeed] ${result.name}: ${result.created} created, ${result.skipped} skipped`
        );
      }
    }

    if (totalCreated > 0) {
      console.log(
        `[AutoSeed] ✅ Complete: ${totalCreated} items created, ${totalSkipped} skipped`
      );
    } else {
      console.log("[AutoSeed] ✅ All seeds already applied");
    }
  } catch (error) {
    console.error("[AutoSeed] ❌ Error during seeding:", error);
    // Don't throw - let server continue even if seeding fails
  }
}

/**
 * Seed default tags
 */
async function seedTags(): Promise<SeedResult> {
  const result: SeedResult = { name: "Tags", created: 0, skipped: 0 };

  for (const defaultTag of DEFAULT_TAGS) {
    const existing = await db
      .select()
      .from(tag)
      .where(eq(tag.name, defaultTag.name))
      .limit(1);

    if (existing.length > 0) {
      result.skipped += 1;
      continue;
    }

    await db.insert(tag).values({
      name: defaultTag.name,
      color: defaultTag.color,
      business: null,
    });
    result.created += 1;
  }

  return result;
}

/**
 * Seed service categories for GCMC and KAJ
 */
async function seedServiceCategories(): Promise<SeedResult> {
  const result: SeedResult = {
    name: "Service Categories",
    created: 0,
    skipped: 0,
  };

  // Check if already seeded
  const existingCount = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(serviceCategory);

  if (existingCount[0] && existingCount[0].count > 0) {
    result.skipped = existingCount[0].count;
    return result;
  }

  // GCMC Categories
  const gcmcCategories = [
    {
      name: "TRAINING",
      displayName: "Training & Development",
      icon: "GraduationCap",
      sortOrder: 1,
    },
    {
      name: "CONSULTANCY",
      displayName: "Business Development & Consultancy",
      icon: "Briefcase",
      sortOrder: 2,
    },
    {
      name: "PARALEGAL",
      displayName: "Paralegal Services",
      icon: "FileText",
      sortOrder: 3,
    },
    {
      name: "IMMIGRATION",
      displayName: "Immigration Services",
      icon: "Plane",
      sortOrder: 4,
    },
    {
      name: "BUSINESS_PROPOSALS",
      displayName: "Business Proposals",
      icon: "FileEdit",
      sortOrder: 5,
    },
  ];

  // KAJ Categories
  const kajCategories = [
    {
      name: "TAX",
      displayName: "Tax Services",
      icon: "Calculator",
      sortOrder: 6,
    },
    {
      name: "ACCOUNTING",
      displayName: "Accounting Services",
      icon: "FileSpreadsheet",
      sortOrder: 7,
    },
    {
      name: "AUDIT",
      displayName: "Audit Services",
      icon: "ClipboardCheck",
      sortOrder: 8,
    },
    {
      name: "NIS",
      displayName: "NIS Services",
      icon: "ShieldCheck",
      sortOrder: 9,
    },
    {
      name: "COMPLIANCE",
      displayName: "Compliance Services",
      icon: "BadgeCheck",
      sortOrder: 10,
    },
  ];

  // Insert GCMC categories
  for (const cat of gcmcCategories) {
    await db.insert(serviceCategory).values({
      business: "GCMC",
      name: cat.name,
      displayName: cat.displayName,
      description: `${cat.displayName} services`,
      icon: cat.icon,
      sortOrder: cat.sortOrder,
    });
    result.created += 1;
  }

  // Insert KAJ categories
  for (const cat of kajCategories) {
    await db.insert(serviceCategory).values({
      business: "KAJ",
      name: cat.name,
      displayName: cat.displayName,
      description: `${cat.displayName} services`,
      icon: cat.icon,
      sortOrder: cat.sortOrder,
    });
    result.created += 1;
  }

  return result;
}

/**
 * Seed email templates
 */
async function seedEmailTemplates(): Promise<SeedResult> {
  const result: SeedResult = {
    name: "Email Templates",
    created: 0,
    skipped: 0,
  };

  const templates = [
    {
      type: "PORTAL_INVITE" as const,
      name: "Client Portal Invitation",
      subject: "You've Been Invited to Your Client Portal",
      htmlContent: `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<h2>Welcome to Your Client Portal</h2>
<p>Dear {{clientName}},</p>
<p>You have been invited to access your client portal at {{businessName}}. This secure portal allows you to:</p>
<ul><li>View your matters and case progress</li><li>Access and download your documents</li><li>Submit documents and respond to requests</li><li>Communicate securely with our team</li></ul>
<p><a href="{{portalUrl}}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Access Your Portal</a></p>
<p>If you have any questions, please don't hesitate to contact us.</p>
<p>Best regards,<br>{{businessName}}</p>
</body></html>`,
      textContent:
        "Dear {{clientName}},\n\nYou have been invited to access your client portal at {{businessName}}.\n\nAccess your portal here: {{portalUrl}}\n\nBest regards,\n{{businessName}}",
      availableVariables: "clientName, portalUrl, businessName",
    },
    {
      type: "WELCOME" as const,
      name: "Welcome Email",
      subject: "Welcome to {{businessName}}",
      htmlContent: `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<h2>Welcome!</h2>
<p>Dear {{clientName}},</p>
<p>Thank you for choosing {{businessName}} for your professional services needs.</p>
<p>We are committed to providing you with excellent service and support. If you have any questions, please don't hesitate to reach out.</p>
<p>Best regards,<br>{{businessName}}</p>
</body></html>`,
      textContent:
        "Dear {{clientName}},\n\nThank you for choosing {{businessName}}.\n\nBest regards,\n{{businessName}}",
      availableVariables: "clientName, businessName",
    },
    {
      type: "DOCUMENT_REQUEST" as const,
      name: "Document Request",
      subject: "Documents Required for {{matterTitle}}",
      htmlContent: `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<h2>Document Request</h2>
<p>Dear {{clientName}},</p>
<p>We require the following documents for your matter: <strong>{{matterTitle}}</strong></p>
<p>{{documentList}}</p>
<p>Please upload these documents through your client portal or reply to this email with the attachments.</p>
<p>Best regards,<br>{{businessName}}</p>
</body></html>`,
      textContent:
        "Dear {{clientName}},\n\nWe require documents for: {{matterTitle}}\n\n{{documentList}}\n\nPlease upload via your portal.\n\nBest regards,\n{{businessName}}",
      availableVariables:
        "clientName, matterTitle, documentList, businessName, portalUrl",
    },
    {
      type: "DEADLINE_REMINDER" as const,
      name: "Deadline Reminder",
      subject: "Upcoming Deadline: {{deadlineTitle}}",
      htmlContent: `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<h2>Deadline Reminder</h2>
<p>Dear {{clientName}},</p>
<p>This is a reminder that you have an upcoming deadline:</p>
<p><strong>{{deadlineTitle}}</strong><br>Due: {{deadlineDate}}</p>
<p>{{deadlineDescription}}</p>
<p>Please ensure all requirements are met before this date.</p>
<p>Best regards,<br>{{businessName}}</p>
</body></html>`,
      textContent:
        "Dear {{clientName}},\n\nUpcoming deadline: {{deadlineTitle}}\nDue: {{deadlineDate}}\n\n{{deadlineDescription}}\n\nBest regards,\n{{businessName}}",
      availableVariables:
        "clientName, deadlineTitle, deadlineDate, deadlineDescription, businessName",
    },
    {
      type: "INVOICE" as const,
      name: "Invoice Notification",
      subject: "Invoice #{{invoiceNumber}} from {{businessName}}",
      htmlContent: `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<h2>Invoice</h2>
<p>Dear {{clientName}},</p>
<p>Please find attached Invoice #{{invoiceNumber}} for an amount of {{invoiceAmount}}.</p>
<p>Due Date: {{dueDate}}</p>
<p>You can view and pay this invoice through your client portal.</p>
<p>Best regards,<br>{{businessName}}</p>
</body></html>`,
      textContent:
        "Dear {{clientName}},\n\nInvoice #{{invoiceNumber}}\nAmount: {{invoiceAmount}}\nDue: {{dueDate}}\n\nBest regards,\n{{businessName}}",
      availableVariables:
        "clientName, invoiceNumber, invoiceAmount, dueDate, businessName, portalUrl",
    },
    {
      type: "APPOINTMENT_CONFIRMATION" as const,
      name: "Appointment Confirmation",
      subject: "Appointment Confirmed: {{appointmentDate}}",
      htmlContent: `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<h2>Appointment Confirmed</h2>
<p>Dear {{clientName}},</p>
<p>Your appointment has been confirmed for:</p>
<p><strong>Date:</strong> {{appointmentDate}}<br><strong>Time:</strong> {{appointmentTime}}<br><strong>Location:</strong> {{location}}</p>
<p>{{appointmentNotes}}</p>
<p>Best regards,<br>{{businessName}}</p>
</body></html>`,
      textContent:
        "Dear {{clientName}},\n\nAppointment confirmed:\nDate: {{appointmentDate}}\nTime: {{appointmentTime}}\nLocation: {{location}}\n\nBest regards,\n{{businessName}}",
      availableVariables:
        "clientName, appointmentDate, appointmentTime, location, appointmentNotes, businessName",
    },
    {
      type: "APPOINTMENT_REMINDER" as const,
      name: "Appointment Reminder",
      subject: "Reminder: Appointment Tomorrow at {{appointmentTime}}",
      htmlContent: `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<h2>Appointment Reminder</h2>
<p>Dear {{clientName}},</p>
<p>This is a friendly reminder of your upcoming appointment:</p>
<p><strong>Date:</strong> {{appointmentDate}}<br><strong>Time:</strong> {{appointmentTime}}<br><strong>Location:</strong> {{location}}</p>
<p>If you need to reschedule, please contact us as soon as possible.</p>
<p>Best regards,<br>{{businessName}}</p>
</body></html>`,
      textContent:
        "Dear {{clientName}},\n\nReminder of your appointment:\nDate: {{appointmentDate}}\nTime: {{appointmentTime}}\n\nBest regards,\n{{businessName}}",
      availableVariables:
        "clientName, appointmentDate, appointmentTime, location, businessName",
    },
    {
      type: "MATTER_UPDATE" as const,
      name: "Matter Status Update",
      subject: "Update on Your Matter: {{matterTitle}}",
      htmlContent: `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<h2>Matter Update</h2>
<p>Dear {{clientName}},</p>
<p>We have an update regarding your matter: <strong>{{matterTitle}}</strong></p>
<p>Status: {{matterStatus}}</p>
<p>{{updateMessage}}</p>
<p>You can view full details in your client portal.</p>
<p>Best regards,<br>{{businessName}}</p>
</body></html>`,
      textContent:
        "Dear {{clientName}},\n\nUpdate on: {{matterTitle}}\nStatus: {{matterStatus}}\n\n{{updateMessage}}\n\nBest regards,\n{{businessName}}",
      availableVariables:
        "clientName, matterTitle, matterStatus, updateMessage, businessName, portalUrl",
    },
    {
      type: "PASSWORD_RESET" as const,
      name: "Password Reset",
      subject: "Reset Your Password",
      htmlContent: `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<h2>Password Reset</h2>
<p>You requested a password reset. Click the button below to set a new password:</p>
<p><a href="{{resetUrl}}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
<p>If you didn't request this, please ignore this email.</p>
<p>This link expires in 1 hour.</p>
</body></html>`,
      textContent:
        "Password Reset\n\nReset your password here: {{resetUrl}}\n\nThis link expires in 1 hour.",
      availableVariables: "resetUrl",
    },
    {
      type: "PAYMENT_RECEIVED" as const,
      name: "Payment Received",
      subject: "Payment Received - Thank You!",
      htmlContent: `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<h2>Payment Received</h2>
<p>Dear {{clientName}},</p>
<p>Thank you for your payment of {{paymentAmount}} for Invoice #{{invoiceNumber}}.</p>
<p>Transaction Reference: {{transactionRef}}</p>
<p>Best regards,<br>{{businessName}}</p>
</body></html>`,
      textContent:
        "Dear {{clientName}},\n\nPayment of {{paymentAmount}} received for Invoice #{{invoiceNumber}}.\n\nThank you!\n{{businessName}}",
      availableVariables:
        "clientName, paymentAmount, invoiceNumber, transactionRef, businessName",
    },
  ];

  for (const template of templates) {
    const existing = await db
      .select()
      .from(emailTemplate)
      .where(eq(emailTemplate.type, template.type))
      .limit(1);

    if (existing.length > 0) {
      result.skipped += 1;
      continue;
    }

    await db.insert(emailTemplate).values({
      type: template.type,
      name: template.name,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      availableVariables: template.availableVariables,
      isActive: true,
      isDefault: true,
    });
    result.created += 1;
  }

  return result;
}
