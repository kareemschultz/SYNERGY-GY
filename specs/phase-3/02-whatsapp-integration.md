# WhatsApp Integration

**Status:** Future
**Phase:** 3
**Priority:** Medium
**Estimated Effort:** 3-4 weeks

## Overview

WhatsApp Business API integration for client notifications, reminders, and two-way messaging. Highly relevant for Guyana where WhatsApp is widely used.

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| WA-FR-01 | Send template messages | Must |
| WA-FR-02 | Receive client messages | Must |
| WA-FR-03 | Automated notifications | Must |
| WA-FR-04 | Two-way conversation | Should |
| WA-FR-05 | Media messages (documents) | Should |
| WA-FR-06 | Quick reply buttons | Should |
| WA-FR-07 | Message history | Must |
| WA-FR-08 | Delivery/read receipts | Should |
| WA-FR-09 | Business profile | Must |
| WA-FR-10 | Auto-reply | Could |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| WA-NFR-01 | Delivery time | < 30 seconds |
| WA-NFR-02 | API uptime | 99.9% |
| WA-NFR-03 | Message retention | 30 days |

## WhatsApp Business API Rules

### Session Messages
- Free-form messages within 24 hours of user message
- No template required
- Two-way conversation

### Template Messages
- Must be pre-approved by Meta
- Can be sent anytime
- Used for notifications/reminders
- Variables in templates

### Opt-in Requirement
- Must have explicit opt-in from user
- Record consent
- Provide opt-out option

## Message Templates

### Deadline Reminder
```
Name: deadline_reminder
Category: UTILITY

Hello {{1}},

This is a reminder that *{{2}}* is due on *{{3}}*.

{{4}}

Please ensure this is completed on time.

Reply STOP to opt out.
```

### Matter Status Update
```
Name: matter_status_update
Category: UTILITY

Hello {{1}},

Your matter *{{2}}* (Ref: {{3}}) has been updated.

New Status: *{{4}}*

{{5}}

View details in your portal or contact us for more information.
```

### Appointment Reminder
```
Name: appointment_reminder
Category: UTILITY

Hello {{1}},

Reminder: You have an appointment scheduled.

Date: {{2}}
Time: {{3}}
Location: {{4}}

Reply YES to confirm or call us to reschedule.
```

### Document Request
```
Name: document_request
Category: UTILITY

Hello {{1}},

We need the following document for your matter:

*{{2}}*

Please upload via the client portal or bring to our office by {{3}}.

{{4}}
```

## Database Schema

### Tables

#### `whatsappContact`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clientId | uuid | Client FK |
| phoneNumber | varchar(20) | WhatsApp number |
| waId | varchar(50) | WhatsApp ID |
| optedIn | boolean | Consent given |
| optedInAt | timestamp | Consent date |
| optedOutAt | timestamp | Opt-out date |
| lastMessageAt | timestamp | Last interaction |

#### `whatsappMessage`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| contactId | uuid | Contact FK |
| direction | enum | INBOUND, OUTBOUND |
| messageType | enum | TEXT, TEMPLATE, IMAGE, DOCUMENT |
| content | text | Message content |
| templateName | varchar(100) | Template used |
| templateVars | jsonb | Template variables |
| waMessageId | varchar(100) | WhatsApp message ID |
| status | enum | SENT, DELIVERED, READ, FAILED |
| sentAt | timestamp | Send time |
| deliveredAt | timestamp | Delivery time |
| readAt | timestamp | Read time |
| failedReason | text | Error details |
| sentById | uuid | Staff FK |

#### `whatsappTemplate`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | varchar(100) | Template name |
| category | varchar(50) | Meta category |
| content | text | Template body |
| variables | jsonb | Variable descriptions |
| status | enum | PENDING, APPROVED, REJECTED |
| metaId | varchar(100) | Meta template ID |

## API Endpoints

### Messaging: `/whatsapp`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/send` | Send message |
| POST | `/sendTemplate` | Send template message |
| GET | `/messages/:contactId` | Message history |
| POST | `/webhook` | Receive messages/status |

### Contacts: `/whatsapp/contacts`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/list` | List contacts |
| POST | `/optIn` | Record opt-in |
| POST | `/optOut` | Record opt-out |

### Templates: `/whatsapp/templates`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/list` | List templates |
| POST | `/submit` | Submit for approval |
| GET | `/status` | Check approval status |

## UI Components

### WhatsApp Chat Panel
- In client detail page
- Message history
- Send message input
- Template selector
- Status indicators (sent/delivered/read)

### Opt-in Management
- Phone number input
- Consent checkbox
- Timestamp recording
- Opt-out button

## Implementation Plan

### Week 1: Setup
- [ ] WhatsApp Business API registration
- [ ] Meta Business Manager setup
- [ ] API integration setup
- [ ] Webhook configuration

### Week 2: Core Messaging
- [ ] Template submission
- [ ] Send message functionality
- [ ] Receive webhook handling
- [ ] Message storage

### Week 3: UI & Automation
- [ ] Chat panel UI
- [ ] Automated triggers
- [ ] Opt-in management
- [ ] Testing

### Week 4: Polish
- [ ] Error handling
- [ ] Retry logic
- [ ] Documentation
- [ ] Staff training

## Business Rules

1. **Opt-in Required**: Never message without consent
2. **24-Hour Window**: Template messages outside session
3. **Template Approval**: Wait for Meta approval
4. **Rate Limits**: Respect WhatsApp limits
5. **Quality Rating**: Monitor business quality score

## Technical Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   GK-Nexus  │────▶│   Webhook   │────▶│   WhatsApp  │
│   Server    │◀────│   Handler   │◀────│   Cloud API │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Database  │
                    │   (logs)    │
                    └─────────────┘
```

## Dependencies

- Meta Business Manager account
- WhatsApp Business API access
- Phone number for WhatsApp Business
- Webhook endpoint (public URL)

## Compliance

- GDPR-style consent
- Clear opt-out mechanism
- Message retention policy
- No spam/marketing without consent

## Success Criteria

- [ ] 80% of clients opt-in
- [ ] 95%+ delivery rate
- [ ] Response time improved
- [ ] Fewer missed reminders

---

## Implementation Requirements

### Core Functionality

#### WhatsApp Cloud API Integration
- **Meta SDK Setup**
  - Install WhatsApp Business API SDK
  - Configure API credentials (access token, phone number ID)
  - Implement authentication flow
  - API version management
  - Error handling for API responses

- **Message Sending Service**
  - Template message sending
  - Session message sending (free-form)
  - Media message handling (documents, images)
  - Message status tracking
  - Retry logic for failed sends
  - Rate limiting compliance

- **Webhook Handler**
  - Webhook verification endpoint
  - Message received event processing
  - Status update event processing
  - Media download handling
  - Event deduplication
  - Signature verification

#### Database Implementation
- **Schema Creation**
  - Implement all tables in Drizzle schema
  - Add indexes for phone number lookups
  - Foreign key relationships to clients
  - Message threading/conversation tracking

- **Queries**
  - Efficient message history with pagination
  - Contact search and filtering
  - Delivery statistics aggregation
  - Conversation grouping

#### API Endpoints
- **Message Operations**
  - Send template message with variables
  - Send session message
  - Send media message
  - Retrieve conversation history
  - Mark messages as read

- **Contact Management**
  - Register contact opt-in
  - Record opt-out
  - Update contact details
  - Sync WhatsApp profile info

- **Template Management**
  - Submit template to Meta for approval
  - Check template approval status
  - List approved templates
  - Template usage analytics

### UI Components

#### Chat Interface
- **Message List**
  - Conversation view (WhatsApp-style)
  - Message bubbles (inbound/outbound)
  - Status indicators (sent, delivered, read)
  - Timestamp display
  - Media message preview
  - Infinite scroll for history

- **Message Composer**
  - Text input with character count
  - Template selector
  - Variable input fields
  - Media upload (documents)
  - Quick reply buttons
  - Send button

#### Contact Management Interface
- **Contact List**
  - Opt-in status badges
  - Last message timestamp
  - Unread message indicators
  - Search and filter
  - Bulk opt-in management

- **Opt-in Form**
  - Phone number input with validation
  - Consent checkbox
  - Timestamp recording
  - Confirmation message

#### Template Management
- **Template List**
  - Approval status badges
  - Category labels
  - Usage statistics
  - Quick send action

- **Template Submission Form**
  - Name input
  - Category selection
  - Content editor with variable placeholders
  - Example values
  - Submit for approval button

### Automated Triggers

#### Event Handlers
- **Deadline Reminders**
  - Send template message X days before deadline
  - Include deadline details
  - Link to client portal

- **Matter Status Updates**
  - Notify on status change
  - Include matter reference
  - Next steps information

- **Document Requests**
  - Request specific documents
  - Include due date
  - Upload instructions

- **Appointment Reminders**
  - 24-hour reminder
  - 2-hour reminder
  - Confirmation request

### External Integration Requirements

#### Meta Business Setup
- **Business Manager Configuration**
  - Create Meta Business Manager account
  - Add business details
  - Verify business identity
  - Set up payment method

- **WhatsApp Business API Access**
  - Apply for API access
  - Phone number registration
  - Two-factor authentication setup
  - Business profile configuration
  - Quality rating monitoring

#### Webhook Infrastructure
- **Endpoint Setup**
  - Public HTTPS endpoint
  - SSL certificate
  - Webhook verification token
  - Callback URL registration
  - Event subscription configuration

#### Template Approval Process
- **Meta Template Submission**
  - Follow Meta template guidelines
  - Category selection rules
  - Variable naming conventions
  - Example values requirement
  - Approval wait time (typically 24-48 hours)

### Security Considerations

#### Data Protection
- **Message Privacy**
  - End-to-end encryption (Meta handled)
  - Secure storage of message content
  - PII protection in logs
  - Message retention policies
  - Right to deletion

- **Access Control**
  - Role-based chat access
  - Client data segregation
  - Staff permission levels
  - Audit logging for messages

#### Compliance
- **WhatsApp Business Policy**
  - Opt-in requirement enforcement
  - 24-hour session window respect
  - Template message only outside session
  - No spam/marketing without consent
  - Quality rating maintenance

- **Data Retention**
  - Message history retention (30 days default)
  - Media file retention
  - Opt-in/opt-out record keeping
  - Compliance with local regulations

#### Authentication
- **API Security**
  - Access token rotation
  - Secure token storage
  - Webhook signature verification
  - Request validation
  - Rate limit handling

## Acceptance Criteria

### Functional Acceptance

#### Message Sending
- [ ] Send template message successfully
- [ ] Send session message within 24-hour window
- [ ] Send document attachment (PDF)
- [ ] Variables properly substituted in templates
- [ ] Message appears in recipient WhatsApp
- [ ] Delivery receipt received
- [ ] Read receipt received (if enabled by user)
- [ ] Failed messages logged with reason

#### Message Receiving
- [ ] Webhook receives inbound messages
- [ ] Message stored in database
- [ ] Message appears in chat UI
- [ ] Staff notified of new message
- [ ] Session window tracked correctly
- [ ] Media messages downloaded and stored
- [ ] Conversation threading works

#### Contact Management
- [ ] Record opt-in with timestamp
- [ ] Verify phone number format
- [ ] Sync WhatsApp profile name
- [ ] Record opt-out and honor it
- [ ] Prevent messages to opted-out contacts
- [ ] Display opt-in status in UI

#### Template Management
- [ ] Submit template to Meta for approval
- [ ] Track approval status
- [ ] List only approved templates for sending
- [ ] Template variables populate correctly
- [ ] Template categories respected
- [ ] Rejection reasons displayed

#### Automation
- [ ] Deadline reminder sent 7 days before due
- [ ] Matter status change sends notification
- [ ] Document request message sent on demand
- [ ] Appointment reminder sent 24h before
- [ ] Messages only sent to opted-in contacts

### Non-Functional Acceptance

#### Performance
- [ ] Message sent within 30 seconds
- [ ] Webhook processed within 5 seconds
- [ ] Chat history loads 100 messages in < 2 seconds
- [ ] Template list loads in < 1 second
- [ ] Concurrent conversations supported

#### Reliability
- [ ] Delivery rate > 90% for valid numbers
- [ ] Failed messages retry 3 times
- [ ] Webhook events not lost
- [ ] Message order preserved
- [ ] Handle WhatsApp API downtime gracefully

#### Scalability
- [ ] Support 1,000 contacts
- [ ] Handle 500 messages per day
- [ ] 30-day message history accessible
- [ ] 20 active conversations simultaneously

#### Security
- [ ] Access tokens encrypted
- [ ] Webhook signature verified
- [ ] Unauthorized users cannot send messages
- [ ] Message content sanitized
- [ ] Opt-in/opt-out audit trail

## Test Cases

### Unit Tests

#### Message Service
```typescript
describe('WhatsAppMessageService', () => {
  test('should send template message via API')
  test('should send session message')
  test('should handle API errors')
  test('should check session window validity')
  test('should respect opt-out status')
  test('should validate phone numbers')
  test('should substitute template variables')
})
```

#### Contact Service
```typescript
describe('WhatsAppContactService', () => {
  test('should record opt-in')
  test('should record opt-out')
  test('should check if contact opted in')
  test('should format phone numbers correctly')
  test('should sync WhatsApp profile')
})
```

#### Template Service
```typescript
describe('WhatsAppTemplateService', () => {
  test('should submit template to Meta')
  test('should check approval status')
  test('should list approved templates')
  test('should validate template format')
  test('should extract variables from template')
})
```

### Integration Tests

#### API Endpoints
```typescript
describe('POST /whatsapp/send', () => {
  test('should send message to opted-in contact')
  test('should return 403 for opted-out contact')
  test('should return 400 for invalid phone number')
  test('should log message in database')
  test('should require authentication')
})

describe('POST /whatsapp/webhook', () => {
  test('should process incoming message')
  test('should process status update')
  test('should reject invalid signature')
  test('should be idempotent')
  test('should download media files')
})

describe('POST /whatsapp/contacts/optIn', () => {
  test('should record opt-in')
  test('should validate phone number')
  test('should timestamp opt-in')
  test('should require consent checkbox')
})
```

### E2E Tests

#### WhatsApp Workflows
```typescript
describe('Deadline Reminder via WhatsApp', () => {
  test('should send reminder when deadline created')
  test('should use approved template')
  test('should substitute deadline details')
  test('should record send in message history')
  test('should track delivery status')
})

describe('Two-Way Conversation', () => {
  test('should receive client message')
  test('should open session window')
  test('should send session message reply')
  test('should display conversation in UI')
  test('should notify staff of new message')
})

describe('Opt-Out Flow', () => {
  test('should record opt-out when client replies STOP')
  test('should prevent future messages')
  test('should display opt-out status')
  test('should allow opt-in again later')
})
```

### Manual Test Cases

1. **Template Message Send**
   - Select approved template
   - Enter variable values
   - Send to opted-in contact
   - Verify received on WhatsApp
   - Check status updates (sent, delivered, read)

2. **Session Conversation**
   - Client sends message
   - Staff receives in chat panel
   - Staff replies with session message
   - Verify bidirectional communication
   - Test session expiry after 24 hours

3. **Media Message**
   - Send document (PDF)
   - Verify received on WhatsApp
   - Client can download document
   - Check file size and format

4. **Opt-In Process**
   - Add phone number
   - Check consent box
   - Save opt-in
   - Send test message
   - Verify delivered

5. **Opt-Out Process**
   - Client replies with "STOP"
   - System records opt-out
   - Attempt to send message
   - Verify blocked
   - Check UI shows opted-out status

### Performance Test Cases

1. **Bulk Message Send**
   - Send template to 100 contacts
   - Measure send time
   - Verify all delivered
   - Check for rate limit errors

2. **Concurrent Conversations**
   - 10 clients send messages simultaneously
   - Verify all received
   - Check message ordering
   - Test staff response to multiple

3. **Message History Load**
   - Load conversation with 1,000 messages
   - Measure load time
   - Test pagination performance
   - Test scroll performance

### Compliance Test Cases

1. **Session Window Enforcement**
   - Client sends message
   - Wait 24 hours
   - Attempt session message
   - Verify blocked, requires template

2. **Opt-In Enforcement**
   - Attempt to send to non-opted-in contact
   - Verify blocked
   - Check error message
   - Verify not logged as sent

3. **Quality Rating**
   - Monitor quality rating score
   - Test that no spam patterns detected
   - Verify template usage appropriate
   - Check user block rate

## External Integration Requirements

### Meta Business Manager Setup Steps
1. Create Business Manager account at business.facebook.com
2. Add business details and verify
3. Create WhatsApp Business account
4. Register phone number
5. Complete business verification
6. Set up two-factor authentication
7. Add payment method

### WhatsApp Cloud API Setup Steps
1. Create app in Meta Developer Console
2. Add WhatsApp product to app
3. Generate system user access token
4. Configure webhook URL
5. Subscribe to webhook events (messages, message_status)
6. Verify webhook
7. Test API connection
8. Submit templates for approval

### Required Meta Credentials
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`

### Template Approval Guidelines
- Keep content concise and clear
- Use appropriate category (UTILITY for notifications)
- Provide realistic example values
- Follow variable naming conventions
- Avoid promotional language in utility templates
- Allow 24-48 hours for approval
- Be prepared to revise based on feedback
