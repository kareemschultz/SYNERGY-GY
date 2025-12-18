/**
 * Email Service Utility
 *
 * Provides email sending functionality using Resend API.
 * Includes templates for portal invites, password resets, and notifications.
 *
 * @module utils/email
 */

import { Resend } from "resend";

// Types
export type EmailConfig = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
};

export type PortalInviteData = {
  clientName: string;
  email: string;
  inviteUrl: string;
  expiresInDays: number;
  invitedBy: string;
};

export type WelcomeEmailData = {
  clientName: string;
  email: string;
  loginUrl: string;
};

export type PasswordResetData = {
  email: string;
  resetUrl: string;
  expiresInHours: number;
};

export type StaffPasswordSetupData = {
  staffName: string;
  email: string;
  setupUrl: string;
  expiresInHours: number;
  invitedBy: string;
};

export type DocumentRequestData = {
  clientName: string;
  documentTitle: string;
  description: string;
  dueDate: string;
  portalUrl: string;
};

export type DocumentUploadConfirmationData = {
  clientName: string;
  documentTitle: string;
  uploadedFileName: string;
  uploadedAt: string;
};

export type MessageNotificationData = {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  subject: string;
  messagePreview: string;
  portalUrl: string;
};

export type PortalDocumentUploadedData = {
  staffEmail: string;
  staffName: string;
  clientName: string;
  documentName: string;
  category: string;
  uploadedAt: string;
  reviewUrl: string;
};

export type MatterCreatedNotificationData = {
  clientEmail: string;
  clientName: string;
  matterTitle: string;
  matterDescription: string;
  portalUrl: string;
};

export type DeadlineApproachingData = {
  recipientEmail: string;
  recipientName: string;
  deadlineTitle: string;
  deadlineDate: string;
  daysRemaining: number;
  matterTitle: string;
  clientName: string;
  portalUrl: string;
};

// Email service class
class EmailService {
  private resend: Resend | null = null;
  private isInitialized = false;
  private readonly isDevelopment: boolean;
  private readonly defaultFrom: string;
  private readonly appUrl: string;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== "production";
    this.defaultFrom = process.env.EMAIL_FROM || "noreply@gk-nexus.com";
    this.appUrl = process.env.BETTER_AUTH_URL || "http://localhost:5173";
    this.initialize();
  }

  private initialize(): void {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.warn(
        "[Email Service] RESEND_API_KEY not configured. Emails will be logged to console in development mode."
      );
      this.isInitialized = false;
      return;
    }

    try {
      this.resend = new Resend(apiKey);
      this.isInitialized = true;
      console.log("[Email Service] Initialized successfully");
    } catch (error) {
      console.error("[Email Service] Failed to initialize:", error);
      this.isInitialized = false;
    }
  }

  /**
   * Send an email using Resend API
   * In development without API key, logs email to console
   */
  private async sendEmail(config: EmailConfig): Promise<void> {
    const emailConfig = {
      ...config,
      from: config.from || this.defaultFrom,
    };

    // Development mode without API key - log to console
    if (!this.isInitialized) {
      console.log("\n=== EMAIL (Development Mode) ===");
      console.log("To:", emailConfig.to);
      console.log("From:", emailConfig.from);
      console.log("Subject:", emailConfig.subject);
      console.log("---");
      console.log(emailConfig.text || "No plain text version");
      console.log("================================\n");
      return;
    }

    try {
      if (!this.resend) {
        throw new Error("Email service not initialized");
      }

      await this.resend.emails.send({
        from: emailConfig.from,
        to: Array.isArray(emailConfig.to) ? emailConfig.to : [emailConfig.to],
        subject: emailConfig.subject,
        html: emailConfig.html,
        text: emailConfig.text,
        replyTo: emailConfig.replyTo,
      });

      console.log(
        `[Email Service] Email sent successfully to ${emailConfig.to}`
      );
    } catch (error) {
      console.error("[Email Service] Failed to send email:", error);
      // In development, don't throw - just log
      if (!this.isDevelopment) {
        throw error;
      }
    }
  }

  /**
   * Send portal invite email to client
   */
  async sendPortalInvite(data: PortalInviteData): Promise<void> {
    const html = this.getPortalInviteTemplate(data);
    const text = this.getPortalInviteTextTemplate(data);

    await this.sendEmail({
      to: data.email,
      subject: "You've been invited to the GK-Nexus Client Portal",
      html,
      text,
    });
  }

  /**
   * Send welcome email after client registers
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
    const html = this.getWelcomeEmailTemplate(data);
    const text = this.getWelcomeEmailTextTemplate(data);

    await this.sendEmail({
      to: data.email,
      subject: "Welcome to GK-Nexus Client Portal",
      html,
      text,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(data: PasswordResetData): Promise<void> {
    const html = this.getPasswordResetTemplate(data);
    const text = this.getPasswordResetTextTemplate(data);

    await this.sendEmail({
      to: data.email,
      subject: "Reset your GK-Nexus password",
      html,
      text,
    });
  }

  /**
   * Send staff password setup email
   */
  async sendStaffPasswordSetup(data: StaffPasswordSetupData): Promise<void> {
    const html = this.getStaffPasswordSetupTemplate(data);
    const text = this.getStaffPasswordSetupTextTemplate(data);

    await this.sendEmail({
      to: data.email,
      subject: "Set up your GK-Nexus staff account",
      html,
      text,
    });
  }

  /**
   * Send document request notification to client
   */
  async sendDocumentRequest(data: DocumentRequestData): Promise<void> {
    const html = this.getDocumentRequestTemplate(data);
    const text = this.getDocumentRequestTextTemplate(data);

    await this.sendEmail({
      to: data.clientName, // Assuming email is included in clientName for now
      subject: `Document Request: ${data.documentTitle}`,
      html,
      text,
    });
  }

  /**
   * Send document upload confirmation
   */
  async sendDocumentUploadConfirmation(
    data: DocumentUploadConfirmationData
  ): Promise<void> {
    const html = this.getDocumentUploadConfirmationTemplate(data);
    const text = this.getDocumentUploadConfirmationTextTemplate(data);

    await this.sendEmail({
      to: data.clientName, // Assuming email is included in clientName for now
      subject: "Document Upload Confirmation",
      html,
      text,
    });
  }

  /**
   * Send message notification (for both staff and portal users)
   */
  async sendMessageNotification(data: MessageNotificationData): Promise<void> {
    const html = this.getMessageNotificationTemplate(data);
    const text = this.getMessageNotificationTextTemplate(data);

    await this.sendEmail({
      to: data.recipientEmail,
      subject: `New Message: ${data.subject}`,
      html,
      text,
    });
  }

  /**
   * Send notification to staff when portal user uploads a document
   */
  async sendPortalDocumentUploaded(
    data: PortalDocumentUploadedData
  ): Promise<void> {
    const html = this.getPortalDocumentUploadedTemplate(data);
    const text = this.getPortalDocumentUploadedTextTemplate(data);

    await this.sendEmail({
      to: data.staffEmail,
      subject: `Document Uploaded: ${data.documentName} from ${data.clientName}`,
      html,
      text,
    });
  }

  /**
   * Send notification when a new matter is created
   */
  async sendMatterCreatedNotification(
    data: MatterCreatedNotificationData
  ): Promise<void> {
    const html = this.getMatterCreatedTemplate(data);
    const text = this.getMatterCreatedTextTemplate(data);

    await this.sendEmail({
      to: data.clientEmail,
      subject: `New Matter Created: ${data.matterTitle}`,
      html,
      text,
    });
  }

  /**
   * Send deadline approaching notification
   */
  async sendDeadlineApproaching(data: DeadlineApproachingData): Promise<void> {
    const html = this.getDeadlineApproachingTemplate(data);
    const text = this.getDeadlineApproachingTextTemplate(data);

    await this.sendEmail({
      to: data.recipientEmail,
      subject: `Deadline Approaching: ${data.deadlineTitle}`,
      html,
      text,
    });
  }

  // ===========================
  // HTML Email Templates
  // ===========================

  private getEmailLayout(content: string, title: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background-color: #667eea;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      transition: background-color 0.3s;
    }
    .button:hover {
      background-color: #5568d3;
    }
    .info-box {
      background-color: #f8fafc;
      border-left: 4px solid #667eea;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      background-color: #f8fafc;
      padding: 30px;
      text-align: center;
      font-size: 14px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
      color: #92400e;
    }
    @media only screen and (max-width: 600px) {
      .container {
        margin: 0;
        border-radius: 0;
      }
      .content {
        padding: 30px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>GK-Nexus</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>This email was sent by GK-Nexus</p>
      <p>Grace Cameron Management Consultancy &amp; KAJ Accountancy Services</p>
      <p>
        <a href="${this.appUrl}">Visit Portal</a> |
        <a href="${this.appUrl}/support">Get Support</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getPortalInviteTemplate(data: PortalInviteData): string {
    const content = `
      <h2>You've been invited to the Client Portal</h2>
      <p>Hello ${data.clientName},</p>
      <p>${data.invitedBy} has invited you to access the GK-Nexus Client Portal, where you can:</p>
      <ul>
        <li>View the status of your matters</li>
        <li>Download and upload documents</li>
        <li>Communicate with our team</li>
        <li>Track important deadlines</li>
      </ul>
      <p>Click the button below to activate your account:</p>
      <center>
        <a href="${data.inviteUrl}" class="button">Activate Account</a>
      </center>
      <div class="warning">
        <strong>Important:</strong> This invitation link will expire in ${data.expiresInDays} days.
      </div>
      <div class="info-box">
        <p><strong>Your login email:</strong> ${data.email}</p>
        <p>You'll create your password when you activate your account.</p>
      </div>
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
    `;
    return this.getEmailLayout(content, "Portal Invitation");
  }

  private getWelcomeEmailTemplate(data: WelcomeEmailData): string {
    const content = `
      <h2>Welcome to GK-Nexus!</h2>
      <p>Hello ${data.clientName},</p>
      <p>Your account has been successfully activated. Welcome to the GK-Nexus Client Portal!</p>
      <p>You can now:</p>
      <ul>
        <li>Access all your documents in one secure place</li>
        <li>Track the progress of your matters</li>
        <li>Upload requested documents</li>
        <li>Message our team directly</li>
        <li>Stay informed about important deadlines</li>
      </ul>
      <center>
        <a href="${data.loginUrl}" class="button">Go to Portal</a>
      </center>
      <div class="info-box">
        <p><strong>Your login email:</strong> ${data.email}</p>
        <p>Keep your password secure and don't share it with anyone.</p>
      </div>
      <p>If you have any questions or need assistance, please don't hesitate to reach out to our team.</p>
    `;
    return this.getEmailLayout(content, "Welcome to GK-Nexus");
  }

  private getPasswordResetTemplate(data: PasswordResetData): string {
    const content = `
      <h2>Reset Your Password</h2>
      <p>We received a request to reset your password for your GK-Nexus account.</p>
      <p>Click the button below to create a new password:</p>
      <center>
        <a href="${data.resetUrl}" class="button">Reset Password</a>
      </center>
      <div class="warning">
        <strong>Security Notice:</strong> This link will expire in ${data.expiresInHours} hour${data.expiresInHours > 1 ? "s" : ""}.
      </div>
      <div class="info-box">
        <p><strong>Didn't request this?</strong></p>
        <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
      </div>
      <p>For security reasons, this link can only be used once.</p>
    `;
    return this.getEmailLayout(content, "Reset Your Password");
  }

  private getStaffPasswordSetupTemplate(data: StaffPasswordSetupData): string {
    const content = `
      <h2>Welcome to the Team!</h2>
      <p>Hello ${data.staffName},</p>
      <p>${data.invitedBy} has created a staff account for you on GK-Nexus.</p>
      <p>Click the button below to set up your password and complete your account activation:</p>
      <center>
        <a href="${data.setupUrl}" class="button">Set Up Account</a>
      </center>
      <div class="warning">
        <strong>Important:</strong> This setup link will expire in ${data.expiresInHours} hours.
      </div>
      <div class="info-box">
        <p><strong>Your login email:</strong> ${data.email}</p>
        <p>You'll create your password when you set up your account.</p>
      </div>
      <p>Once your account is set up, you'll have access to the GK-Nexus management system.</p>
    `;
    return this.getEmailLayout(content, "Set Up Your Account");
  }

  private getDocumentRequestTemplate(data: DocumentRequestData): string {
    const content = `
      <h2>Document Request</h2>
      <p>Hello ${data.clientName},</p>
      <p>We need the following document from you:</p>
      <div class="info-box">
        <p><strong>${data.documentTitle}</strong></p>
        <p>${data.description}</p>
        <p><strong>Due Date:</strong> ${data.dueDate}</p>
      </div>
      <p>Please upload this document through your client portal:</p>
      <center>
        <a href="${data.portalUrl}" class="button">Upload Document</a>
      </center>
      <p>If you have any questions about this request, please contact us through the portal or reply to this email.</p>
    `;
    return this.getEmailLayout(content, "Document Request");
  }

  private getDocumentUploadConfirmationTemplate(
    data: DocumentUploadConfirmationData
  ): string {
    const content = `
      <h2>Document Upload Confirmed</h2>
      <p>Hello ${data.clientName},</p>
      <p>Thank you for uploading your document. We have successfully received it.</p>
      <div class="info-box">
        <p><strong>Document:</strong> ${data.documentTitle}</p>
        <p><strong>File:</strong> ${data.uploadedFileName}</p>
        <p><strong>Uploaded:</strong> ${data.uploadedAt}</p>
      </div>
      <p>Our team will review your document and contact you if we need any additional information.</p>
      <p>You can view all your uploaded documents in your portal at any time.</p>
    `;
    return this.getEmailLayout(content, "Upload Confirmation");
  }

  private getMessageNotificationTemplate(
    data: MessageNotificationData
  ): string {
    const content = `
      <h2>New Message</h2>
      <p>Hello ${data.recipientName},</p>
      <p>You have received a new message from <strong>${data.senderName}</strong>:</p>
      <div class="info-box">
        <p><strong>Subject:</strong> ${data.subject}</p>
        <p>${data.messagePreview}</p>
      </div>
      <center>
        <a href="${data.portalUrl}" class="button">View Message</a>
      </center>
      <p>Log in to your portal to view the full message and respond.</p>
    `;
    return this.getEmailLayout(content, "New Message");
  }

  private getPortalDocumentUploadedTemplate(
    data: PortalDocumentUploadedData
  ): string {
    const content = `
      <h2>Document Pending Review</h2>
      <p>Hello ${data.staffName},</p>
      <p>A client has uploaded a new document that requires your review:</p>
      <div class="info-box">
        <p><strong>Client:</strong> ${data.clientName}</p>
        <p><strong>Document:</strong> ${data.documentName}</p>
        <p><strong>Category:</strong> ${data.category}</p>
        <p><strong>Uploaded:</strong> ${data.uploadedAt}</p>
      </div>
      <center>
        <a href="${data.reviewUrl}" class="button">Review Document</a>
      </center>
      <p>Please review and approve or reject this document.</p>
    `;
    return this.getEmailLayout(content, "Document Pending Review");
  }

  private getMatterCreatedTemplate(
    data: MatterCreatedNotificationData
  ): string {
    const content = `
      <h2>New Matter Created</h2>
      <p>Hello ${data.clientName},</p>
      <p>A new matter has been created for you:</p>
      <div class="info-box">
        <p><strong>${data.matterTitle}</strong></p>
        <p>${data.matterDescription}</p>
      </div>
      <center>
        <a href="${data.portalUrl}" class="button">View in Portal</a>
      </center>
      <p>Log in to your client portal to track the progress of this matter.</p>
    `;
    return this.getEmailLayout(content, "New Matter Created");
  }

  private getDeadlineApproachingTemplate(
    data: DeadlineApproachingData
  ): string {
    const urgencyClass = data.daysRemaining <= 3 ? "warning" : "info-box";
    const content = `
      <h2>Deadline Approaching</h2>
      <p>Hello ${data.recipientName},</p>
      <p>A deadline is approaching and requires your attention:</p>
      <div class="${urgencyClass}">
        <p><strong>${data.deadlineTitle}</strong></p>
        <p><strong>Due Date:</strong> ${data.deadlineDate}</p>
        <p><strong>Days Remaining:</strong> ${data.daysRemaining}</p>
        <p><strong>Matter:</strong> ${data.matterTitle}</p>
        <p><strong>Client:</strong> ${data.clientName}</p>
      </div>
      <center>
        <a href="${data.portalUrl}" class="button">View Details</a>
      </center>
    `;
    return this.getEmailLayout(content, "Deadline Approaching");
  }

  // ===========================
  // Plain Text Email Templates
  // ===========================

  private getPortalInviteTextTemplate(data: PortalInviteData): string {
    return `
You've been invited to the GK-Nexus Client Portal

Hello ${data.clientName},

${data.invitedBy} has invited you to access the GK-Nexus Client Portal, where you can:

- View the status of your matters
- Download and upload documents
- Communicate with our team
- Track important deadlines

Activate your account by visiting this link:
${data.inviteUrl}

IMPORTANT: This invitation link will expire in ${data.expiresInDays} days.

Your login email: ${data.email}
You'll create your password when you activate your account.

If you didn't expect this invitation, you can safely ignore this email.

---
GK-Nexus
Grace Cameron Management Consultancy & KAJ Accountancy Services
${this.appUrl}
    `;
  }

  private getWelcomeEmailTextTemplate(data: WelcomeEmailData): string {
    return `
Welcome to GK-Nexus!

Hello ${data.clientName},

Your account has been successfully activated. Welcome to the GK-Nexus Client Portal!

You can now:
- Access all your documents in one secure place
- Track the progress of your matters
- Upload requested documents
- Message our team directly
- Stay informed about important deadlines

Access your portal at: ${data.loginUrl}

Your login email: ${data.email}
Keep your password secure and don't share it with anyone.

If you have any questions or need assistance, please don't hesitate to reach out to our team.

---
GK-Nexus
Grace Cameron Management Consultancy & KAJ Accountancy Services
${this.appUrl}
    `;
  }

  private getPasswordResetTextTemplate(data: PasswordResetData): string {
    return `
Reset Your Password

We received a request to reset your password for your GK-Nexus account.

Reset your password by visiting this link:
${data.resetUrl}

SECURITY NOTICE: This link will expire in ${data.expiresInHours} hour${data.expiresInHours > 1 ? "s" : ""}.

Didn't request this?
If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

For security reasons, this link can only be used once.

---
GK-Nexus
Grace Cameron Management Consultancy & KAJ Accountancy Services
${this.appUrl}
    `;
  }

  private getStaffPasswordSetupTextTemplate(
    data: StaffPasswordSetupData
  ): string {
    return `
Welcome to the Team!

Hello ${data.staffName},

${data.invitedBy} has created a staff account for you on GK-Nexus.

Set up your password and complete your account activation:
${data.setupUrl}

IMPORTANT: This setup link will expire in ${data.expiresInHours} hours.

Your login email: ${data.email}
You'll create your password when you set up your account.

Once your account is set up, you'll have access to the GK-Nexus management system.

---
GK-Nexus
Grace Cameron Management Consultancy & KAJ Accountancy Services
${this.appUrl}
    `;
  }

  private getDocumentRequestTextTemplate(data: DocumentRequestData): string {
    return `
Document Request

Hello ${data.clientName},

We need the following document from you:

${data.documentTitle}
${data.description}
Due Date: ${data.dueDate}

Upload this document through your client portal:
${data.portalUrl}

If you have any questions about this request, please contact us through the portal or reply to this email.

---
GK-Nexus
Grace Cameron Management Consultancy & KAJ Accountancy Services
${this.appUrl}
    `;
  }

  private getDocumentUploadConfirmationTextTemplate(
    data: DocumentUploadConfirmationData
  ): string {
    return `
Document Upload Confirmed

Hello ${data.clientName},

Thank you for uploading your document. We have successfully received it.

Document: ${data.documentTitle}
File: ${data.uploadedFileName}
Uploaded: ${data.uploadedAt}

Our team will review your document and contact you if we need any additional information.

You can view all your uploaded documents in your portal at any time.

---
GK-Nexus
Grace Cameron Management Consultancy & KAJ Accountancy Services
${this.appUrl}
    `;
  }

  private getMessageNotificationTextTemplate(
    data: MessageNotificationData
  ): string {
    return `
New Message

Hello ${data.recipientName},

You have received a new message from ${data.senderName}:

Subject: ${data.subject}

${data.messagePreview}

View full message at: ${data.portalUrl}

---
GK-Nexus
Grace Cameron Management Consultancy & KAJ Accountancy Services
${this.appUrl}
    `;
  }

  private getPortalDocumentUploadedTextTemplate(
    data: PortalDocumentUploadedData
  ): string {
    return `
Document Pending Review

Hello ${data.staffName},

A client has uploaded a new document that requires your review:

Client: ${data.clientName}
Document: ${data.documentName}
Category: ${data.category}
Uploaded: ${data.uploadedAt}

Review document at: ${data.reviewUrl}

---
GK-Nexus
Grace Cameron Management Consultancy & KAJ Accountancy Services
${this.appUrl}
    `;
  }

  private getMatterCreatedTextTemplate(
    data: MatterCreatedNotificationData
  ): string {
    return `
New Matter Created

Hello ${data.clientName},

A new matter has been created for you:

${data.matterTitle}
${data.matterDescription}

View in portal at: ${data.portalUrl}

---
GK-Nexus
Grace Cameron Management Consultancy & KAJ Accountancy Services
${this.appUrl}
    `;
  }

  private getDeadlineApproachingTextTemplate(
    data: DeadlineApproachingData
  ): string {
    return `
Deadline Approaching

Hello ${data.recipientName},

A deadline is approaching and requires your attention:

${data.deadlineTitle}
Due Date: ${data.deadlineDate}
Days Remaining: ${data.daysRemaining}
Matter: ${data.matterTitle}
Client: ${data.clientName}

View details at: ${data.portalUrl}

---
GK-Nexus
Grace Cameron Management Consultancy & KAJ Accountancy Services
${this.appUrl}
    `;
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Convenience functions for direct import
export const sendPortalInvite = (data: PortalInviteData) =>
  emailService.sendPortalInvite(data);
export const sendWelcomeEmail = (data: WelcomeEmailData) =>
  emailService.sendWelcomeEmail(data);
export const sendPasswordReset = (data: PasswordResetData) =>
  emailService.sendPasswordReset(data);
export const sendStaffPasswordSetup = (data: StaffPasswordSetupData) =>
  emailService.sendStaffPasswordSetup(data);
export const sendDocumentRequest = (data: DocumentRequestData) =>
  emailService.sendDocumentRequest(data);
export const sendDocumentUploadConfirmation = (
  data: DocumentUploadConfirmationData
) => emailService.sendDocumentUploadConfirmation(data);
export const sendMessageNotification = (data: MessageNotificationData) =>
  emailService.sendMessageNotification(data);
export const sendPortalDocumentUploaded = (data: PortalDocumentUploadedData) =>
  emailService.sendPortalDocumentUploaded(data);
export const sendMatterCreatedNotification = (
  data: MatterCreatedNotificationData
) => emailService.sendMatterCreatedNotification(data);
export const sendDeadlineApproaching = (data: DeadlineApproachingData) =>
  emailService.sendDeadlineApproaching(data);
