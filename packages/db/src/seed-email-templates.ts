/**
 * Email Templates Seed Script
 *
 * Seeds default email templates for various notification types.
 * All operations are idempotent - safe to run multiple times.
 *
 * Usage: DATABASE_URL="..." bun run packages/db/src/seed-email-templates.ts
 */

import { eq } from "drizzle-orm";
import { db, type EmailTemplateType, emailTemplate } from "./index";

type TemplateData = {
  type: EmailTemplateType;
  name: string;
  description: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  availableVariables: string;
};

const defaultTemplates: TemplateData[] = [
  // Portal & Authentication
  {
    type: "PORTAL_INVITE",
    name: "Client Portal Invitation",
    description: "Sent when inviting a client to the portal",
    subject: "You've Been Invited to Your Client Portal",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0f172a; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Your Client Portal</h1>
    </div>
    <div class="content">
      <p>Dear {{clientName}},</p>
      <p>You have been invited to access your secure client portal. Through the portal, you can:</p>
      <ul>
        <li>View the status of your matters</li>
        <li>Upload and download documents</li>
        <li>Send secure messages to your representative</li>
        <li>View invoices and make payments</li>
      </ul>
      <p>Click the button below to set up your account:</p>
      <a href="{{portalUrl}}" class="button">Access Portal</a>
      <p><strong>Note:</strong> This invitation link will expire in 7 days.</p>
    </div>
    <div class="footer">
      <p>{{businessName}} | This is an automated message</p>
    </div>
  </div>
</body>
</html>`,
    textContent: `Dear {{clientName}},

You have been invited to access your secure client portal.

Through the portal, you can:
- View the status of your matters
- Upload and download documents
- Send secure messages to your representative
- View invoices and make payments

Access your portal here: {{portalUrl}}

Note: This invitation link will expire in 7 days.

{{businessName}}`,
    availableVariables: "clientName, portalUrl, businessName",
  },
  {
    type: "WELCOME",
    name: "Welcome Email",
    description: "Sent to new staff members",
    subject: "Welcome to {{businessName}}",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0f172a; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to {{businessName}}!</h1>
    </div>
    <div class="content">
      <p>Dear {{userName}},</p>
      <p>Welcome to the team! Your account has been created successfully.</p>
      <p>Click the button below to set up your password and start using the system:</p>
      <a href="{{setupUrl}}" class="button">Set Up Your Account</a>
      <p>If you have any questions, please contact your administrator.</p>
    </div>
    <div class="footer">
      <p>{{businessName}} | This is an automated message</p>
    </div>
  </div>
</body>
</html>`,
    textContent: `Dear {{userName}},

Welcome to {{businessName}}! Your account has been created successfully.

Set up your password here: {{setupUrl}}

If you have any questions, please contact your administrator.

{{businessName}}`,
    availableVariables: "userName, businessName, setupUrl",
  },
  {
    type: "PASSWORD_RESET",
    name: "Password Reset",
    description: "Sent when a user requests a password reset",
    subject: "Password Reset Request",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0f172a; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 10px; border-radius: 4px; margin: 10px 0; }
    .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <p>Dear {{userName}},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      <a href="{{resetUrl}}" class="button">Reset Password</a>
      <div class="warning">
        <strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request this reset, please ignore this email or contact support.
      </div>
    </div>
    <div class="footer">
      <p>{{businessName}} | This is an automated message</p>
    </div>
  </div>
</body>
</html>`,
    textContent: `Dear {{userName}},

We received a request to reset your password.

Reset your password here: {{resetUrl}}

This link will expire in 1 hour.

If you didn't request this reset, please ignore this email.

{{businessName}}`,
    availableVariables: "userName, resetUrl, businessName",
  },

  // Documents
  {
    type: "DOCUMENT_REQUEST",
    name: "Document Request",
    description: "Sent when requesting documents from a client",
    subject: "Document Request - {{matterTitle}}",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0f172a; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .document-list { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Document Request</h1>
    </div>
    <div class="content">
      <p>Dear {{clientName}},</p>
      <p>We require the following documents for your matter: <strong>{{matterTitle}}</strong></p>
      <div class="document-list">
        {{documentList}}
      </div>
      <p>Please upload the requested documents through your client portal:</p>
      <a href="{{portalUrl}}" class="button">Upload Documents</a>
      {{#if deadline}}
      <p><strong>Deadline:</strong> {{deadline}}</p>
      {{/if}}
      <p>If you have any questions, please don't hesitate to contact us.</p>
    </div>
    <div class="footer">
      <p>{{businessName}} | {{staffName}}</p>
    </div>
  </div>
</body>
</html>`,
    textContent: `Dear {{clientName}},

We require the following documents for your matter: {{matterTitle}}

Documents needed:
{{documentList}}

Please upload the requested documents through your client portal: {{portalUrl}}

Deadline: {{deadline}}

If you have any questions, please don't hesitate to contact us.

{{businessName}}
{{staffName}}`,
    availableVariables:
      "clientName, matterTitle, documentList, portalUrl, deadline, businessName, staffName",
  },
  {
    type: "DOCUMENT_UPLOAD_CONFIRMATION",
    name: "Document Upload Confirmation",
    description: "Sent when a client uploads a document",
    subject: "Document Received - {{documentName}}",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0f172a; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .success { background: #d1fae5; border: 1px solid #10b981; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Document Received</h1>
    </div>
    <div class="content">
      <p>Dear {{clientName}},</p>
      <div class="success">
        <strong>✓ Document Successfully Received</strong>
        <p>Document: {{documentName}}<br>
        Uploaded: {{uploadDate}}</p>
      </div>
      <p>Our team will review the document and contact you if we need any additional information.</p>
    </div>
    <div class="footer">
      <p>{{businessName}} | This is an automated message</p>
    </div>
  </div>
</body>
</html>`,
    textContent: `Dear {{clientName}},

Your document has been successfully received.

Document: {{documentName}}
Uploaded: {{uploadDate}}

Our team will review the document and contact you if we need any additional information.

{{businessName}}`,
    availableVariables: "clientName, documentName, uploadDate, businessName",
  },

  // Matters & Appointments
  {
    type: "MATTER_CREATED",
    name: "New Matter Notification",
    description: "Sent when a new matter is created for a client",
    subject: "New Matter Created - {{matterTitle}}",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0f172a; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .matter-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #3b82f6; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Matter Created</h1>
    </div>
    <div class="content">
      <p>Dear {{clientName}},</p>
      <p>A new matter has been created for you:</p>
      <div class="matter-info">
        <strong>{{matterTitle}}</strong><br>
        Reference: {{matterReference}}<br>
        Service Type: {{serviceType}}<br>
        Status: {{status}}
      </div>
      <p>You can track the progress of your matter through your client portal:</p>
      <a href="{{portalUrl}}" class="button">View Matter</a>
    </div>
    <div class="footer">
      <p>{{businessName}} | {{staffName}}</p>
    </div>
  </div>
</body>
</html>`,
    textContent: `Dear {{clientName}},

A new matter has been created for you:

Title: {{matterTitle}}
Reference: {{matterReference}}
Service Type: {{serviceType}}
Status: {{status}}

View your matter at: {{portalUrl}}

{{businessName}}
{{staffName}}`,
    availableVariables:
      "clientName, matterTitle, matterReference, serviceType, status, portalUrl, businessName, staffName",
  },
  {
    type: "APPOINTMENT_REMINDER",
    name: "Appointment Reminder",
    description: "Sent as a reminder before scheduled appointments",
    subject: "Appointment Reminder - {{appointmentDate}}",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0f172a; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .appointment { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #f59e0b; }
    .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Appointment Reminder</h1>
    </div>
    <div class="content">
      <p>Dear {{clientName}},</p>
      <p>This is a reminder of your upcoming appointment:</p>
      <div class="appointment">
        <strong>📅 {{appointmentTitle}}</strong><br>
        Date: {{appointmentDate}}<br>
        Time: {{appointmentTime}}<br>
        {{#if location}}Location: {{location}}{{/if}}
        {{#if meetingLink}}Join Online: {{meetingLink}}{{/if}}
      </div>
      <p>{{#if notes}}Notes: {{notes}}{{/if}}</p>
      <p>If you need to reschedule, please contact us as soon as possible.</p>
    </div>
    <div class="footer">
      <p>{{businessName}} | {{staffName}}</p>
    </div>
  </div>
</body>
</html>`,
    textContent: `Dear {{clientName}},

This is a reminder of your upcoming appointment:

{{appointmentTitle}}
Date: {{appointmentDate}}
Time: {{appointmentTime}}
Location: {{location}}
Join Online: {{meetingLink}}

Notes: {{notes}}

If you need to reschedule, please contact us as soon as possible.

{{businessName}}
{{staffName}}`,
    availableVariables:
      "clientName, appointmentTitle, appointmentDate, appointmentTime, location, meetingLink, notes, businessName, staffName",
  },
  {
    type: "BOOKING_CONFIRMATION",
    name: "Booking Confirmation",
    description: "Sent when an appointment is booked",
    subject: "Appointment Confirmed - {{appointmentDate}}",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0f172a; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .confirmation { background: #d1fae5; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .details { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Booking Confirmed</h1>
    </div>
    <div class="content">
      <p>Dear {{clientName}},</p>
      <div class="confirmation">
        <strong>✓ Your appointment has been confirmed!</strong>
      </div>
      <div class="details">
        <strong>{{appointmentTitle}}</strong><br>
        Date: {{appointmentDate}}<br>
        Time: {{appointmentTime}}<br>
        Duration: {{duration}} minutes<br>
        {{#if location}}Location: {{location}}{{/if}}
      </div>
      <p>We look forward to meeting with you. Please arrive 10 minutes early if visiting in person.</p>
    </div>
    <div class="footer">
      <p>{{businessName}}</p>
    </div>
  </div>
</body>
</html>`,
    textContent: `Dear {{clientName}},

Your appointment has been confirmed!

{{appointmentTitle}}
Date: {{appointmentDate}}
Time: {{appointmentTime}}
Duration: {{duration}} minutes
Location: {{location}}

We look forward to meeting with you.

{{businessName}}`,
    availableVariables:
      "clientName, appointmentTitle, appointmentDate, appointmentTime, duration, location, businessName",
  },

  // Invoices & Payments
  {
    type: "INVOICE_CREATED",
    name: "Invoice Notification",
    description: "Sent when an invoice is created",
    subject: "Invoice #{{invoiceNumber}} - {{amount}}",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0f172a; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .invoice-box { background: white; padding: 20px; border-radius: 6px; margin: 15px 0; border: 1px solid #e5e7eb; }
    .amount { font-size: 24px; font-weight: bold; color: #0f172a; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Invoice</h1>
    </div>
    <div class="content">
      <p>Dear {{clientName}},</p>
      <p>A new invoice has been generated for your account:</p>
      <div class="invoice-box">
        <p><strong>Invoice #{{invoiceNumber}}</strong></p>
        <p class="amount">{{amount}}</p>
        <p>Due Date: {{dueDate}}</p>
        <p>Service: {{serviceDescription}}</p>
      </div>
      <a href="{{paymentUrl}}" class="button">View & Pay Invoice</a>
      <p>Thank you for your business.</p>
    </div>
    <div class="footer">
      <p>{{businessName}}</p>
    </div>
  </div>
</body>
</html>`,
    textContent: `Dear {{clientName}},

A new invoice has been generated for your account:

Invoice #{{invoiceNumber}}
Amount: {{amount}}
Due Date: {{dueDate}}
Service: {{serviceDescription}}

View and pay your invoice: {{paymentUrl}}

Thank you for your business.

{{businessName}}`,
    availableVariables:
      "clientName, invoiceNumber, amount, dueDate, serviceDescription, paymentUrl, businessName",
  },
  {
    type: "PAYMENT_RECEIVED",
    name: "Payment Confirmation",
    description: "Sent when a payment is received",
    subject: "Payment Received - Thank You!",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0f172a; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .success { background: #d1fae5; padding: 20px; border-radius: 6px; margin: 15px 0; text-align: center; }
    .receipt { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Received</h1>
    </div>
    <div class="content">
      <p>Dear {{clientName}},</p>
      <div class="success">
        <h2 style="color: #10b981; margin: 0;">✓ Payment Successful</h2>
      </div>
      <div class="receipt">
        <p><strong>Payment Details:</strong></p>
        <p>Amount: {{amount}}<br>
        Invoice: #{{invoiceNumber}}<br>
        Payment Method: {{paymentMethod}}<br>
        Date: {{paymentDate}}<br>
        Transaction ID: {{transactionId}}</p>
      </div>
      <p>Thank you for your payment. A receipt has been saved to your account.</p>
    </div>
    <div class="footer">
      <p>{{businessName}}</p>
    </div>
  </div>
</body>
</html>`,
    textContent: `Dear {{clientName}},

Payment Successful!

Amount: {{amount}}
Invoice: #{{invoiceNumber}}
Payment Method: {{paymentMethod}}
Date: {{paymentDate}}
Transaction ID: {{transactionId}}

Thank you for your payment.

{{businessName}}`,
    availableVariables:
      "clientName, amount, invoiceNumber, paymentMethod, paymentDate, transactionId, businessName",
  },

  // Recurring Matters
  {
    type: "RECURRING_MATTER_CREATED",
    name: "Recurring Matter Notification",
    description: "Sent when a recurring matter instance is created",
    subject: "New {{serviceType}} Matter Created - {{period}}",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0f172a; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .matter-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #8b5cf6; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Recurring Matter Created</h1>
    </div>
    <div class="content">
      <p>Dear {{clientName}},</p>
      <p>A new recurring matter has been automatically created for you:</p>
      <div class="matter-info">
        <strong>🔄 {{matterTitle}}</strong><br>
        Period: {{period}}<br>
        Service: {{serviceType}}<br>
        Deadline: {{deadline}}
      </div>
      <p>Our team will begin working on this matter shortly. You can view details in your portal:</p>
      <a href="{{portalUrl}}" class="button">View Matter</a>
    </div>
    <div class="footer">
      <p>{{businessName}}</p>
    </div>
  </div>
</body>
</html>`,
    textContent: `Dear {{clientName}},

A new recurring matter has been automatically created for you:

{{matterTitle}}
Period: {{period}}
Service: {{serviceType}}
Deadline: {{deadline}}

View your matter at: {{portalUrl}}

{{businessName}}`,
    availableVariables:
      "clientName, matterTitle, period, serviceType, deadline, portalUrl, businessName",
  },

  // Reports & Notifications
  {
    type: "SCHEDULED_REPORT",
    name: "Scheduled Report Delivery",
    description: "Sent when a scheduled report is generated",
    subject: "{{reportName}} - {{reportDate}}",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0f172a; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .report-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Scheduled Report</h1>
    </div>
    <div class="content">
      <p>Dear {{userName}},</p>
      <p>Your scheduled report is ready:</p>
      <div class="report-box">
        <strong>📊 {{reportName}}</strong><br>
        Generated: {{reportDate}}<br>
        Period: {{reportPeriod}}
      </div>
      <p>The report is attached to this email.</p>
    </div>
    <div class="footer">
      <p>{{businessName}} | Automated Report</p>
    </div>
  </div>
</body>
</html>`,
    textContent: `Dear {{userName}},

Your scheduled report is ready:

{{reportName}}
Generated: {{reportDate}}
Period: {{reportPeriod}}

The report is attached to this email.

{{businessName}}`,
    availableVariables:
      "userName, reportName, reportDate, reportPeriod, businessName",
  },
  {
    type: "DEADLINE_APPROACHING",
    name: "Deadline Reminder",
    description: "Sent when a matter deadline is approaching",
    subject: "Deadline Approaching - {{matterTitle}}",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .warning { background: #fef2f2; border: 1px solid #dc2626; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Deadline Approaching</h1>
    </div>
    <div class="content">
      <p>Dear {{userName}},</p>
      <div class="warning">
        <strong>Matter: {{matterTitle}}</strong><br>
        Client: {{clientName}}<br>
        Deadline: {{deadline}}<br>
        Days Remaining: {{daysRemaining}}
      </div>
      <p>Please ensure all necessary actions are completed before the deadline.</p>
    </div>
    <div class="footer">
      <p>{{businessName}} | Automated Reminder</p>
    </div>
  </div>
</body>
</html>`,
    textContent: `Dear {{userName}},

DEADLINE APPROACHING

Matter: {{matterTitle}}
Client: {{clientName}}
Deadline: {{deadline}}
Days Remaining: {{daysRemaining}}

Please ensure all necessary actions are completed before the deadline.

{{businessName}}`,
    availableVariables:
      "userName, matterTitle, clientName, deadline, daysRemaining, businessName",
  },
  {
    type: "MESSAGE_NOTIFICATION",
    name: "New Message Notification",
    description: "Sent when a new portal message is received",
    subject: "New Message from {{senderName}}",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0f172a; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .message-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #3b82f6; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Message</h1>
    </div>
    <div class="content">
      <p>Dear {{recipientName}},</p>
      <p>You have received a new message from {{senderName}}:</p>
      <div class="message-box">
        <p><strong>Subject:</strong> {{subject}}</p>
        <p>{{messagePreview}}</p>
      </div>
      <a href="{{portalUrl}}" class="button">View Full Message</a>
    </div>
    <div class="footer">
      <p>{{businessName}} | This is an automated message</p>
    </div>
  </div>
</body>
</html>`,
    textContent: `Dear {{recipientName}},

You have received a new message from {{senderName}}:

Subject: {{subject}}
{{messagePreview}}

View the full message: {{portalUrl}}

{{businessName}}`,
    availableVariables:
      "recipientName, senderName, subject, messagePreview, portalUrl, businessName",
  },
];

async function seedEmailTemplates() {
  console.log("🌱 Seeding Email Templates...\n");

  let created = 0;
  let skipped = 0;

  for (const template of defaultTemplates) {
    try {
      // Check if template with this type already exists
      const existing = await db
        .select()
        .from(emailTemplate)
        .where(eq(emailTemplate.type, template.type))
        .limit(1);

      if (existing.length > 0) {
        console.log(`  ⏭️  Skipped: ${template.name} (already exists)`);
        skipped += 1;
        continue;
      }

      await db.insert(emailTemplate).values({
        type: template.type,
        name: template.name,
        description: template.description,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
        availableVariables: template.availableVariables,
        isDefault: true,
        isActive: true,
      });

      console.log(`  ✓ Created: ${template.name}`);
      created += 1;
    } catch (error) {
      console.error(`  ✗ Failed: ${template.name}`, error);
    }
  }

  console.log(`\n📋 Summary: ${created} created, ${skipped} skipped`);
}

// Export for use in main seed script
export { seedEmailTemplates };

// Run directly if executed
seedEmailTemplates()
  .then(() => {
    console.log("\n✨ Email template seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
