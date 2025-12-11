# Email Integration Documentation

**Status:** Complete
**GitHub Issue:** #11
**Completed:** 2025-12-11

## Overview

This document describes the email integration implementation for the GK-Nexus platform using Resend as the email service provider. The integration supports portal invitations, password resets, staff onboarding, and future document-related notifications.

## Features

### Implemented Email Templates

1. **Portal Invite** - Sent when staff invites a client to the portal
2. **Welcome Email** - Sent after successful client registration
3. **Password Reset** - Sent when user requests password reset
4. **Staff Password Setup** - Sent when admin creates a new staff account
5. **Document Request** - Template ready for future document request feature
6. **Document Upload Confirmation** - Template ready for future upload feature

### Key Capabilities

- Professional HTML and plain text email templates
- Responsive email design with mobile-friendly layout
- Graceful fallback in development (logs to console without API key)
- Type-safe email data with TypeScript interfaces
- Personalized emails with staff/client names
- Security features (token expiration, one-time use links)
- Proper error handling and logging

## Architecture

### File Structure

```
/packages/api/src/
├── utils/
│   ├── email.ts              # Main email service and templates
│   └── __test-email.ts       # Test script (for development)
└── routers/
    ├── portal.ts             # Portal invite & password reset
    └── admin.ts              # Staff password setup
```

### Email Service Class

Location: `/packages/api/src/utils/email.ts`

The `EmailService` class is implemented as a singleton with the following structure:

```typescript
class EmailService {
  private resend: Resend | null
  private isInitialized: boolean
  private readonly isDevelopment: boolean
  private readonly defaultFrom: string
  private readonly appUrl: string

  // Public methods
  sendPortalInvite(data: PortalInviteData): Promise<void>
  sendWelcomeEmail(data: WelcomeEmailData): Promise<void>
  sendPasswordReset(data: PasswordResetData): Promise<void>
  sendStaffPasswordSetup(data: StaffPasswordSetupData): Promise<void>
  sendDocumentRequest(data: DocumentRequestData): Promise<void>
  sendDocumentUploadConfirmation(data: DocumentUploadConfirmationData): Promise<void>
}
```

### Template Structure

Each email template includes:
- **HTML Version** - Rich formatting with gradient header, styled buttons, info boxes
- **Plain Text Version** - Readable fallback for text-only email clients
- **Consistent Layout** - Branded header, footer with links, responsive design
- **Security Notices** - Warning boxes for expiration times and security information

## Configuration

### Environment Variables

Add to `.env` file:

```bash
# Required for sending emails
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxx"

# From address (must be verified in Resend)
EMAIL_FROM="noreply@yourdomain.com"

# Optional
EMAIL_REPLY_TO="support@yourdomain.com"
EMAIL_SUPPORT="support@yourdomain.com"

# App URL for email links (already configured)
BETTER_AUTH_URL="http://localhost:5173"  # Development
# or
BETTER_AUTH_URL="https://yourdomain.com"  # Production
```

### Getting Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain or use Resend's test domain for development
3. Go to [API Keys](https://resend.com/api-keys)
4. Create a new API key
5. Add to `.env` file

### Development Mode

Without `RESEND_API_KEY`, the service automatically:
- Logs emails to console with formatted output
- Shows email subject, recipient, and plain text content
- Allows testing email flows without sending real emails

Example console output:
```
=== EMAIL (Development Mode) ===
To: client@example.com
From: noreply@gk-nexus.com
Subject: You've been invited to the GK-Nexus Client Portal
---
[Email content here]
================================
```

## Integration Points

### Portal Router (`/packages/api/src/routers/portal.ts`)

#### 1. Portal Invite

**Endpoint:** `portal.invite.send`
**Trigger:** Staff member sends portal invite to client
**Email Template:** Portal Invite

```typescript
// Sends email after creating invite
await sendPortalInvite({
  clientName: clientRecord.displayName,
  email: input.email,
  inviteUrl: `${appUrl}/portal/register?token=${token}`,
  expiresInDays: INVITE_EXPIRY_DAYS,
  invitedBy: staffMemberName,
});
```

#### 2. Password Reset

**Endpoint:** `portal.auth.requestPasswordReset`
**Trigger:** User requests password reset
**Email Template:** Password Reset

```typescript
// Sends email after generating reset token
await sendPasswordReset({
  email: input.email,
  resetUrl: `${appUrl}/portal/reset-password?token=${token}`,
  expiresInHours: PASSWORD_RESET_EXPIRY_HOURS,
});
```

### Admin Router (`/packages/api/src/routers/admin.ts`)

#### 3. Staff Password Setup

**Endpoint:** `admin.staff.create`
**Trigger:** Admin creates new staff account
**Email Template:** Staff Password Setup

```typescript
// Sends email after creating staff user
await sendStaffPasswordSetup({
  staffName: name,
  email,
  setupUrl: `${appUrl}/staff/setup-password?token=${setupToken}`,
  expiresInHours: 24,
  invitedBy: "GK-Nexus Admin",
});
```

## Testing

### Test Script

Run the test script to verify email functionality:

```bash
bun packages/api/src/utils/__test-email.ts
```

This will test all email templates and show output in console (in development mode).

### Manual Testing

#### Testing Portal Invite

1. Start the server: `bun run dev:server`
2. Use the admin panel to invite a client
3. Check console output for email content (without API key)
4. With API key, check recipient's inbox

#### Testing Password Reset

1. Navigate to portal login page
2. Click "Forgot Password"
3. Enter email address
4. Check console or inbox for reset email

#### Testing Staff Password Setup

1. Use admin panel to create new staff member
2. Check console or inbox for setup email

### Integration Tests

For production, consider adding integration tests:

```typescript
describe("Email Service", () => {
  it("should send portal invite email", async () => {
    await emailService.sendPortalInvite({
      clientName: "Test Client",
      email: "test@example.com",
      inviteUrl: "http://example.com/register?token=test",
      expiresInDays: 7,
      invitedBy: "Test Admin",
    });
    // Assert email was sent
  });
});
```

## Email Template Design

### Visual Design

- **Color Scheme:** Purple gradient (#667eea to #764ba2)
- **Layout:** Responsive, max-width 600px
- **Typography:** System font stack for cross-platform compatibility
- **Buttons:** Prominent call-to-action with hover states
- **Info Boxes:** Light background with colored left border
- **Warnings:** Yellow background for important notices

### Accessibility

- Semantic HTML structure
- Sufficient color contrast
- Alt text for any images (if added in future)
- Clear hierarchy with headings
- Plain text alternative for all emails

### Mobile Responsiveness

- Single column layout on mobile
- Touch-friendly button sizes (44px min)
- Readable font sizes (16px minimum)
- Proper spacing for mobile screens

## Security Considerations

### Token Security

- **Secure Generation:** Uses `crypto.randomBytes()` for tokens
- **Expiration:** All tokens have time limits
- **One-Time Use:** Password reset tokens marked as used
- **HTTPS Required:** Production should use HTTPS for all links

### Email Security

- **DKIM/SPF:** Configured through Resend for verified domains
- **Rate Limiting:** Consider adding rate limits for email endpoints
- **Input Validation:** All email addresses validated with Zod schemas
- **No Sensitive Data:** Emails don't contain passwords or sensitive info

### Privacy

- **Enumeration Prevention:** Password reset always shows success message
- **Unsubscribe:** Consider adding unsubscribe links for notifications
- **Data Minimization:** Only necessary data included in emails

## Troubleshooting

### Common Issues

#### 1. Emails Not Sending

**Symptom:** No emails received, no console output
**Solution:**
- Check `RESEND_API_KEY` is set correctly
- Verify API key is valid in Resend dashboard
- Check server logs for errors
- Ensure `EMAIL_FROM` matches verified domain

#### 2. Emails Going to Spam

**Symptom:** Emails arrive but in spam folder
**Solution:**
- Verify domain in Resend (adds DKIM/SPF)
- Use a professional `EMAIL_FROM` address
- Avoid spam trigger words in templates
- Test with mail-tester.com

#### 3. Template Rendering Issues

**Symptom:** HTML not displaying correctly
**Solution:**
- Test with multiple email clients (Gmail, Outlook, Apple Mail)
- Use email testing tools (Litmus, Email on Acid)
- Keep HTML simple (avoid modern CSS features)
- Ensure inline styles are used

#### 4. Links Not Working

**Symptom:** Email links return 404 or don't work
**Solution:**
- Verify `BETTER_AUTH_URL` is correct
- Check frontend routes exist for `/portal/register`, etc.
- Test token validation logic
- Ensure tokens aren't expired

### Debug Mode

Enable detailed logging:

```typescript
// Temporary: Add to email.ts constructor
console.log("[Email Service] Initialized with:", {
  isDevelopment: this.isDevelopment,
  defaultFrom: this.defaultFrom,
  appUrl: this.appUrl,
  hasApiKey: !!process.env.RESEND_API_KEY,
});
```

## Future Enhancements

### Planned Features

1. **Email Queue System**
   - Implement background job processing
   - Retry failed emails with exponential backoff
   - Track email delivery status

2. **Template Improvements**
   - Add email preview endpoint for testing
   - Support for embedded images/logos
   - Customizable templates per business (GCMC vs KAJ)

3. **Additional Email Types**
   - Document request notifications (already templated)
   - Upload confirmations (already templated)
   - Deadline reminders
   - Matter status updates
   - Invoice notifications

4. **Analytics**
   - Track email open rates
   - Monitor click-through rates
   - Bounce and complaint handling

5. **User Preferences**
   - Email notification settings
   - Frequency controls
   - Unsubscribe management

## Dependencies

### NPM Packages

```json
{
  "resend": "^6.6.0"
}
```

### Environment Requirements

- Node.js 18+ or Bun 1.0+
- PostgreSQL database (for token storage)
- Valid Resend account

## API Reference

### Email Service Methods

#### `sendPortalInvite(data: PortalInviteData): Promise<void>`

Sends portal invitation email to client.

**Parameters:**
- `clientName` (string) - Client's display name
- `email` (string) - Client's email address
- `inviteUrl` (string) - Registration URL with token
- `expiresInDays` (number) - Days until invitation expires
- `invitedBy` (string) - Name of staff member sending invite

**Throws:** Error if email sending fails (production only)

#### `sendPasswordReset(data: PasswordResetData): Promise<void>`

Sends password reset email with secure link.

**Parameters:**
- `email` (string) - User's email address
- `resetUrl` (string) - Password reset URL with token
- `expiresInHours` (number) - Hours until link expires

**Throws:** Error if email sending fails (production only)

#### `sendStaffPasswordSetup(data: StaffPasswordSetupData): Promise<void>`

Sends password setup email to new staff member.

**Parameters:**
- `staffName` (string) - Staff member's full name
- `email` (string) - Staff member's email address
- `setupUrl` (string) - Password setup URL with token
- `expiresInHours` (number) - Hours until link expires
- `invitedBy` (string) - Name of admin who created account

**Throws:** Error if email sending fails (production only)

## Maintenance

### Regular Tasks

- **Weekly:** Review email delivery rates in Resend dashboard
- **Monthly:** Check for bounced emails and update records
- **Quarterly:** Review and update email templates
- **Annually:** Renew domain verification if needed

### Monitoring

Monitor these metrics:
- Email send success rate
- Email open rates (if tracking enabled)
- Bounce rates
- Spam complaint rates
- Average delivery time

### Backup Strategy

The email service doesn't require backup as it's stateless. However:
- Keep `.env.example` updated with all required variables
- Document template changes in CHANGELOG
- Version control email templates

## Support

### Internal Documentation

- Main README: `/README.md`
- Project Setup: `/GITHUB.md`
- Phase 2 Specs: `/specs/phase-2/01-client-portal.md`

### External Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend Email Best Practices](https://resend.com/docs/send-with-nodejs)
- [Email Testing Tools](https://www.mail-tester.com/)

### Getting Help

If you encounter issues:
1. Check this documentation first
2. Review Resend dashboard for errors
3. Check server logs for stack traces
4. Test with the test script
5. Open a GitHub issue with details

## Changelog

### 2025-12-11 - Initial Implementation (#11)

- Installed Resend SDK
- Created email service utility with singleton pattern
- Implemented 6 email templates (HTML + plain text)
- Integrated with portal router (invites, password reset)
- Integrated with admin router (staff onboarding)
- Added development mode with console logging
- Documented environment variables
- Created test script
- Updated CHANGELOG.md

## Contributors

- Implementation: Claude Code (Sonnet 4.5)
- Specification: GK-Nexus team
- Email Design: Based on modern SaaS email standards

---

**Last Updated:** 2025-12-11
**Document Version:** 1.0.0
**Related Issues:** #11 (Email Integration), #6 (Client Portal)
