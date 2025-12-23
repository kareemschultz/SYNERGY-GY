# Email Integration

**Status:** Future
**Phase:** 3
**Priority:** High
**Estimated Effort:** 2-3 weeks

## Overview

Send transactional and notification emails from within the platform with tracking and template management.

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| EML-FR-01 | Send emails from platform | Must |
| EML-FR-02 | Email templates | Must |
| EML-FR-03 | Variable substitution | Must |
| EML-FR-04 | Attachment support | Should |
| EML-FR-05 | Delivery tracking | Should |
| EML-FR-06 | Open tracking | Could |
| EML-FR-07 | Click tracking | Could |
| EML-FR-08 | Bulk sending | Should |
| EML-FR-09 | Unsubscribe handling | Must |
| EML-FR-10 | Send history | Must |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| EML-NFR-01 | Delivery rate | > 95% |
| EML-NFR-02 | Send time | < 5 seconds |
| EML-NFR-03 | Daily limit | 1,000 emails |

## Email Types

### Automated Emails
| Type | Trigger | Recipients |
|------|---------|------------|
| Deadline Reminder | X days before due | Client/Staff |
| Matter Status Update | Status change | Client |
| Document Request | Staff request | Client |
| Portal Invite | Staff action | Client |
| Invoice Sent | Invoice created | Client |
| Payment Confirmation | Payment recorded | Client |
| Appointment Confirmation | Booking | Client |
| Appointment Reminder | 24h/2h before | Client |

### Manual Emails
- Ad-hoc client communication
- Bulk announcements
- Custom notifications

## Database Schema

### Tables

#### `emailTemplate`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | varchar(100) | Template name |
| type | enum | Template type |
| subject | varchar(255) | Email subject |
| bodyHtml | text | HTML body |
| bodyText | text | Plain text body |
| variables | jsonb | Available variables |
| isActive | boolean | Template active |
| createdAt | timestamp | Created date |
| updatedAt | timestamp | Updated date |

#### `emailLog`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| templateId | uuid | Template FK |
| recipientEmail | varchar(255) | To address |
| recipientName | varchar(255) | Recipient name |
| clientId | uuid | Client FK (optional) |
| subject | varchar(255) | Actual subject |
| bodyHtml | text | Actual body |
| status | enum | QUEUED, SENT, DELIVERED, BOUNCED, FAILED |
| externalId | varchar(100) | Provider message ID |
| sentAt | timestamp | Send time |
| deliveredAt | timestamp | Delivery time |
| openedAt | timestamp | First open |
| clickedAt | timestamp | First click |
| bouncedAt | timestamp | Bounce time |
| bounceReason | text | Bounce details |
| metadata | jsonb | Additional data |
| sentById | uuid | Sender FK |

#### `emailPreference`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clientId | uuid | Client FK |
| emailType | varchar(50) | Email type |
| isEnabled | boolean | Subscribed |
| updatedAt | timestamp | Last change |

## Email Templates

### Variable System
```
{{client.displayName}}
{{client.email}}
{{matter.referenceNumber}}
{{matter.title}}
{{matter.status}}
{{deadline.title}}
{{deadline.dueDate}}
{{invoice.number}}
{{invoice.total}}
{{link.portal}}
{{link.unsubscribe}}
```

### Example: Deadline Reminder
```
Subject: Reminder: {{deadline.title}} due on {{deadline.dueDate}}

Dear {{client.displayName}},

This is a reminder that the following deadline is approaching:

Deadline: {{deadline.title}}
Due Date: {{deadline.dueDate}}
Priority: {{deadline.priority}}

{{#if matter}}
Related Matter: {{matter.referenceNumber}} - {{matter.title}}
{{/if}}

Please ensure all required actions are completed before the due date.

If you have any questions, please contact us.

Best regards,
{{business.name}}

---
To manage your email preferences, click here: {{link.unsubscribe}}
```

## API Endpoints

### Templates: `/email/templates`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/list` | List templates |
| GET | `/getById` | Single template |
| POST | `/create` | Create template |
| PUT | `/update` | Update template |
| POST | `/preview` | Preview with data |

### Sending: `/email`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/send` | Send single email |
| POST | `/sendBulk` | Send to multiple |
| GET | `/history` | Email history |
| GET | `/stats` | Sending statistics |

### Preferences: `/email/preferences`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/client/:id` | Client preferences |
| PUT | `/update` | Update preference |
| GET | `/unsubscribe/:token` | Unsubscribe page |

## Implementation Plan

### Week 1: Foundation
- [ ] Set up Resend account
- [ ] Email service wrapper
- [ ] Template schema
- [ ] Basic send functionality

### Week 2: Templates & UI
- [ ] Template management UI
- [ ] Variable system
- [ ] Email preview
- [ ] Send history

### Week 3: Automation & Polish
- [ ] Automated email triggers
- [ ] Preference management
- [ ] Testing
- [ ] Documentation

## Provider: Resend

**Why Resend:**
- Developer-friendly API
- Good deliverability
- React email templates
- Reasonable pricing
- Webhook support

**Setup:**
```bash
bun add resend
```

```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
```

## Business Rules

1. **Opt-out Respected**: Never send to unsubscribed
2. **Rate Limiting**: Max sends per hour
3. **Bounce Handling**: Auto-disable bounced addresses
4. **Audit Trail**: Log all sends
5. **Templates**: Use templates for consistency

## Dependencies

- Resend account and API key
- Client management (recipients)
- Various modules for triggers

## Success Criteria

- [ ] 95%+ delivery rate
- [ ] Zero spam complaints
- [ ] 50%+ open rate
- [ ] All notifications sent via platform

---

## Implementation Requirements

### Core Functionality

#### Email Service Layer
- **Resend SDK Integration**
  - Install and configure Resend SDK
  - Create service wrapper with error handling
  - Implement retry logic for failed sends
  - Rate limiting to respect Resend limits
  - API key management via environment variables

- **Template Engine**
  - Variable substitution system (Handlebars or similar)
  - Template validation before sending
  - HTML and plain text version generation
  - Preview functionality with sample data
  - Template versioning support

- **Queue System**
  - Background job processing for bulk sends
  - Priority queue for urgent emails
  - Retry mechanism for failed deliveries
  - Batch processing for performance
  - Job status tracking

#### Database Implementation
- **Schema Creation**
  - Implement all tables in Drizzle schema
  - Add indexes for email lookups (recipientEmail, status, sentAt)
  - Foreign key relationships to clients, matters
  - Soft delete for templates

- **Queries**
  - Efficient email history queries with pagination
  - Stats aggregation (delivery rate, open rate)
  - Template usage analytics
  - Bounce rate tracking

#### API Endpoints
- **Template Management**
  - CRUD operations with validation
  - Template duplication
  - Variable extraction from template content
  - Template activation/deactivation

- **Email Sending**
  - Single email with attachments
  - Bulk send with individual personalization
  - Send time validation
  - Recipient validation (email format, unsubscribe status)

- **Webhook Handler**
  - Resend webhook signature verification
  - Event processing (delivered, bounced, opened, clicked)
  - Update email log status
  - Automatic bounce handling

### UI Components

#### Template Management Interface
- **Template List View**
  - Filterable by type and status
  - Search by name
  - Usage statistics
  - Quick actions (edit, duplicate, preview)

- **Template Editor**
  - Rich text editor for HTML content
  - Plain text editor
  - Variable picker/inserter
  - Live preview panel
  - Subject line editor with variable support
  - Test send functionality

#### Email History Interface
- **History List**
  - Filterable by status, recipient, date range
  - Search by subject or recipient
  - Sort by date, status
  - Batch actions (retry failed)

- **Detail View**
  - Full email content preview
  - Delivery timeline
  - Tracking statistics (opens, clicks)
  - Resend option

#### Preference Management
- **Client Preferences**
  - Checkbox list for email types
  - Global unsubscribe option
  - Preference save with confirmation
  - Audit trail of changes

### Automated Triggers

#### Event Handlers
- **Deadline Module Integration**
  - Listen for deadline creation/updates
  - Calculate reminder send times
  - Queue reminder emails

- **Matter Module Integration**
  - Status change notifications
  - Assignment notifications
  - Completion notifications

- **Invoice Module Integration**
  - Invoice sent notification
  - Payment confirmation
  - Overdue reminders

- **Portal Module Integration**
  - Portal invite emails
  - Password reset emails
  - Login notifications

### External Integration Requirements

#### Resend Setup
- **Account Configuration**
  - Create Resend account
  - Verify sending domain
  - Configure DNS records (SPF, DKIM, DMARC)
  - Set up webhook endpoint URL
  - Generate and secure API key

- **Domain Reputation**
  - Warm up sending domain
  - Monitor reputation score
  - Handle feedback loops
  - Maintain suppression list

#### Email Infrastructure
- **DNS Configuration**
  - SPF record: `v=spf1 include:resend.com ~all`
  - DKIM record from Resend
  - DMARC policy configuration
  - MX records (if using custom domain for replies)

### Security Considerations

#### Data Protection
- **Sensitive Information**
  - No passwords or API keys in email content
  - Secure handling of client personal data
  - Encryption of stored email content
  - PII handling in logs

- **Access Control**
  - Role-based access to template management
  - Audit log for template changes
  - Restrict who can send bulk emails
  - Email history access control

#### Anti-Spam Compliance
- **CAN-SPAM Compliance**
  - Unsubscribe link in every marketing email
  - Physical address in footer
  - Honor unsubscribe requests within 10 days
  - Accurate subject lines and sender information

- **GDPR Compliance**
  - Explicit consent for marketing emails
  - Right to be forgotten (delete email data)
  - Data retention policies
  - Privacy policy links

#### Rate Limiting
- **Sending Limits**
  - Per-user hourly limits
  - Global daily limits
  - Prevent abuse
  - Monitor for spam patterns

## Acceptance Criteria

### Functional Acceptance

#### Template System
- [ ] Create email template with variables
- [ ] Edit existing template
- [ ] Deactivate template
- [ ] Preview template with sample data
- [ ] Duplicate template
- [ ] Variables properly substituted in sent emails
- [ ] Both HTML and plain text versions generated
- [ ] Template validation prevents invalid templates

#### Email Sending
- [ ] Send single email successfully
- [ ] Send email with attachment (up to 10MB)
- [ ] Send bulk emails to 100+ recipients
- [ ] Failed sends automatically retry
- [ ] Bounced email addresses marked
- [ ] Unsubscribed users not sent emails
- [ ] Email appears in recipient inbox (not spam)
- [ ] Delivery confirmation received

#### Tracking
- [ ] Email marked as delivered in log
- [ ] Open tracking records first open
- [ ] Click tracking records link clicks
- [ ] Bounce events logged
- [ ] Complaint events logged
- [ ] History shows all events in timeline

#### Automation
- [ ] Deadline reminder email sent 7 days before due date
- [ ] Matter status change triggers notification
- [ ] Invoice creation sends email to client
- [ ] Portal invite email sent on user creation
- [ ] Appointment reminder sent 24 hours before

#### Preferences
- [ ] Client can view their email preferences
- [ ] Client can opt out of specific email types
- [ ] Client can globally unsubscribe
- [ ] Unsubscribe link works in emails
- [ ] Preference changes take effect immediately

### Non-Functional Acceptance

#### Performance
- [ ] Single email sent within 5 seconds
- [ ] Bulk send of 100 emails queued within 10 seconds
- [ ] Email history loads 100 records in < 2 seconds
- [ ] Template preview generated in < 1 second
- [ ] Webhook processing completes in < 1 second

#### Reliability
- [ ] Delivery rate > 95% for valid addresses
- [ ] Failed sends retry 3 times
- [ ] Webhook processing idempotent
- [ ] No lost emails in queue
- [ ] Service handles Resend API downtime gracefully

#### Scalability
- [ ] Support 1,000 emails per day
- [ ] Handle 50 templates
- [ ] 90-day email history accessible
- [ ] Concurrent bulk sends by multiple users

#### Security
- [ ] API keys encrypted in environment
- [ ] Webhook signature verified
- [ ] Unauthorized users cannot send emails
- [ ] Email content sanitized (XSS prevention)
- [ ] Sensitive data not logged

## Test Cases

### Unit Tests

#### Template Service
```typescript
describe('EmailTemplateService', () => {
  test('should substitute variables correctly')
  test('should handle missing variables gracefully')
  test('should validate template syntax')
  test('should generate plain text from HTML')
  test('should extract variables from template')
})
```

#### Email Service
```typescript
describe('EmailService', () => {
  test('should send single email via Resend')
  test('should handle Resend API errors')
  test('should respect unsubscribe status')
  test('should validate email addresses')
  test('should attach files correctly')
  test('should queue bulk sends')
})
```

#### Preference Service
```typescript
describe('EmailPreferenceService', () => {
  test('should check if client opted in for email type')
  test('should record opt-out correctly')
  test('should handle global unsubscribe')
  test('should return all preferences for client')
})
```

### Integration Tests

#### API Endpoints
```typescript
describe('POST /email/send', () => {
  test('should send email to valid recipient')
  test('should return 400 for invalid email')
  test('should return 403 for unsubscribed recipient')
  test('should log email in database')
  test('should require authentication')
})

describe('POST /email/templates/create', () => {
  test('should create valid template')
  test('should return 400 for invalid template')
  test('should require admin role')
  test('should extract variables')
})

describe('POST /email/webhook', () => {
  test('should process delivery event')
  test('should process bounce event')
  test('should reject invalid signature')
  test('should be idempotent')
})
```

### E2E Tests

#### Email Workflows
```typescript
describe('Deadline Reminder Email', () => {
  test('should send reminder when deadline created')
  test('should substitute deadline details')
  test('should record send in history')
  test('should track delivery')
})

describe('Unsubscribe Flow', () => {
  test('should load unsubscribe page from email link')
  test('should save preference')
  test('should not send future emails of that type')
  test('should show confirmation message')
})
```

### Manual Test Cases

1. **Template Creation**
   - Create template with 5 variables
   - Preview with sample data
   - Verify all variables replaced
   - Send test email
   - Verify received email matches preview

2. **Bulk Send**
   - Select 10 clients
   - Send bulk email
   - Verify all 10 received within 2 minutes
   - Check history shows all 10 sends

3. **Bounce Handling**
   - Send to invalid email address
   - Verify bounce event received
   - Check email marked as bounced
   - Verify client email flagged

4. **Unsubscribe**
   - Click unsubscribe link in email
   - Verify lands on preference page
   - Opt out of deadline reminders
   - Create new deadline
   - Verify no email sent

5. **Attachment**
   - Send email with PDF attachment
   - Verify attachment received
   - Verify file size correct
   - Test with 10MB file

### Performance Test Cases

1. **Load Test**
   - Queue 1,000 bulk emails
   - Measure processing time
   - Verify all delivered
   - Check for memory leaks

2. **Concurrent Sends**
   - 5 users send emails simultaneously
   - Verify no conflicts
   - Check all delivered
   - Verify correct sender attribution

3. **History Query**
   - Load history with 10,000 records
   - Measure query time
   - Test pagination performance
   - Test filter performance
