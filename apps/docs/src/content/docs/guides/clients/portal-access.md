---
title: Client Portal Access
description: How to invite clients to the portal and manage their access
---

The GK-Nexus Client Portal gives clients self-service access to view their matters, upload documents, and track progress.

## Inviting a Client to the Portal

### From the Client Profile

1. Navigate to **Clients** in the sidebar
2. Click on the client you want to invite
3. Click the **Portal Access** tab
4. Click **Send Portal Invite**
5. Confirm the client's email address
6. Click **Send Invitation**

The client will receive an email with a link to set up their account.

### What the Client Receives

**Invitation Email Contains:**
- Personalized welcome message
- Link to activate their account (valid for 7 days)
- Instructions for setting up a password
- Your contact information

### Invitation Status

| Status | Meaning |
|--------|---------|
| **Pending** | Email sent, awaiting client action |
| **Accepted** | Client has activated their account |
| **Expired** | 7 days passed, need to resend |

## Managing Portal Access

### View Portal Status

On the client profile, the **Portal Access** tab shows:
- Current access status (Active/Inactive/Not Invited)
- Last login date
- Number of documents uploaded
- Portal activity history

### Resend Invitation

If an invitation expires:
1. Go to client profile > Portal Access
2. Click **Resend Invitation**
3. A new 7-day invitation is sent

### Disable Access

To temporarily disable a client's portal access:
1. Go to client profile > Portal Access
2. Click **Disable Access**
3. Client can no longer log in

Access can be re-enabled at any time.

## What Clients Can Do in the Portal

### View Matters
- See all their active matters
- View matter status and progress
- Check assigned staff member
- See upcoming deadlines

### Document Management
- Upload requested documents
- Download completed documents
- View document history
- Receive upload confirmations

### Appointments (Coming Soon)
- View scheduled appointments
- Request new appointments
- Receive appointment reminders

## Email Notifications

### Automatic Emails Sent to Clients

| Event | Email Sent |
|-------|------------|
| Portal invite | Invitation with activation link |
| Account activated | Welcome email |
| Document requested | Request notification |
| Document uploaded | Confirmation receipt |
| Password reset | Reset link email |

### Email Configuration

**Required Environment Variables:**
```env
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com
```

Without these configured, emails are logged to console in development mode.

## Troubleshooting

### Client Didn't Receive Email

1. Check spam/junk folder
2. Verify email address is correct
3. Check Resend dashboard for delivery status
4. Resend invitation if needed

### Client Can't Login

1. Check if portal access is enabled
2. Verify account was activated
3. Try password reset
4. Check for account lockout (5 failed attempts)

### Invitation Link Expired

1. Go to client profile
2. Click **Resend Invitation**
3. New 7-day link is sent

## Security Features

- **Session timeout**: 30 minutes of inactivity
- **Login lockout**: 5 failed attempts = 15-minute lockout
- **Secure tokens**: Cryptographically random invitation/session tokens
- **Password requirements**: Minimum 8 characters
- **Activity logging**: All portal actions are logged

## Best Practices

### When to Invite Clients

- After initial consultation
- When you need documents from them
- When matter status updates are frequent
- For long-term clients with multiple matters

### Communication

- Inform client to expect the email
- Provide your contact info for questions
- Follow up if invitation isn't accepted within 3 days
- Explain portal benefits during onboarding

### Document Management

- Use clear document names when requesting
- Set reasonable due dates
- Acknowledge uploads promptly
- Keep portal documents organized
