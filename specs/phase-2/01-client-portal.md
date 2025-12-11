# Client Portal

**Status:** Planned
**Phase:** 2
**Priority:** High
**Estimated Effort:** 4-6 weeks

## Overview

Self-service portal allowing clients to view their matters, download documents, upload requested files, and communicate with staff.

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| CP-FR-01 | Client can register/login with email | Must |
| CP-FR-02 | Client can view their matter status | Must |
| CP-FR-03 | Client can download their documents | Must |
| CP-FR-04 | Client can upload requested documents | Must |
| CP-FR-05 | Client receives email notifications | Should |
| CP-FR-06 | Client can send messages to staff | Should |
| CP-FR-07 | Client can view invoices | Could |
| CP-FR-08 | Client can make online payments | Could |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| CP-NFR-01 | Page load time | < 2 seconds |
| CP-NFR-02 | Concurrent users | 100+ |
| CP-NFR-03 | Mobile responsive | Yes |
| CP-NFR-04 | Session timeout | 30 minutes |
| CP-NFR-05 | Upload size limit | 10MB |

## User Stories

### Client
- As a client, I want to check my matter status without calling
- As a client, I want to download documents I've submitted
- As a client, I want to upload documents when requested
- As a client, I want to see what's needed from me

### Staff
- As a staff member, I want to send portal invites to clients
- As a staff member, I want to request documents through portal
- As a staff member, I want to see when clients upload files

## Database Schema

### New Tables

#### `portalUser`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clientId | uuid | Client FK (required) |
| email | varchar(255) | Login email |
| passwordHash | varchar(255) | Hashed password |
| isActive | boolean | Account status |
| lastLoginAt | timestamp | Last login time |
| invitedById | uuid | Staff who invited |
| invitedAt | timestamp | Invite date |
| createdAt | timestamp | Created date |

#### `portalSession`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| portalUserId | uuid | Portal user FK |
| token | varchar(255) | Session token |
| expiresAt | timestamp | Expiration |
| ipAddress | varchar(50) | Login IP |
| userAgent | text | Browser info |

#### `documentRequest`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clientId | uuid | Client FK |
| matterId | uuid | Matter FK |
| title | varchar(255) | Request title |
| description | text | What's needed |
| dueDate | date | Deadline |
| status | enum | PENDING, UPLOADED, EXPIRED |
| documentId | uuid | Uploaded doc FK |
| requestedById | uuid | Staff FK |
| requestedAt | timestamp | Request date |
| uploadedAt | timestamp | Upload date |

#### `portalMessage`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clientId | uuid | Client FK |
| matterId | uuid | Matter FK (optional) |
| direction | enum | CLIENT_TO_STAFF, STAFF_TO_CLIENT |
| content | text | Message content |
| isRead | boolean | Read status |
| readAt | timestamp | When read |
| sentById | uuid | Sender (staff or portal user) |
| sentAt | timestamp | Send time |

## API Endpoints

### Portal Auth: `/portal/auth`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Activate portal account |
| POST | `/login` | Login to portal |
| POST | `/logout` | End session |
| POST | `/forgot-password` | Request reset |
| POST | `/reset-password` | Set new password |

### Portal Data: `/portal`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/me` | Current client info |
| GET | `/matters` | Client's matters |
| GET | `/matters/:id` | Single matter detail |
| GET | `/documents` | Client's documents |
| GET | `/documents/:id/download` | Download document |
| GET | `/requests` | Document requests |
| POST | `/requests/:id/upload` | Upload for request |
| GET | `/messages` | Messages |
| POST | `/messages` | Send message |

### Staff Actions: `/clients/portal`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/invite` | Send portal invite |
| POST | `/request-document` | Request document |
| GET | `/activity` | Portal activity log |

## UI Routes

### Portal Routes (New App or Subdomain)
```
/portal/
├── login                    # Login page
├── register/:token          # Registration with invite token
├── forgot-password          # Password reset request
├── reset-password/:token    # Password reset form
├── dashboard                # Client dashboard
├── matters/                 # Matters list
│   └── :id                  # Matter detail
├── documents/               # Documents list
├── requests/                # Document requests
├── messages/                # Messages
└── profile                  # Account settings
```

### Staff UI Additions
- Client detail: "Send Portal Invite" button
- Matter detail: "Request Document" button
- Dashboard: "Portal Activity" widget

## Implementation Plan

### Week 1-2: Foundation
- [ ] Create portal user schema
- [ ] Set up separate auth context
- [ ] Build login/registration pages
- [ ] Email invite system

### Week 3-4: Core Features
- [ ] Dashboard with matter summary
- [ ] Matter detail view (read-only)
- [ ] Document list and download
- [ ] Document request/upload

### Week 5-6: Polish & Security
- [ ] Messaging system
- [ ] Email notifications
- [ ] Security review
- [ ] Testing
- [ ] Documentation

## Security Considerations

1. **Separate Auth Context**: Portal users don't get staff access
2. **Data Isolation**: Clients see only their own data
3. **Upload Validation**: File type/size restrictions
4. **Rate Limiting**: Prevent abuse
5. **Session Security**: Shorter timeout, secure cookies
6. **Audit Logging**: Track all portal actions

## Email Templates

| Template | Trigger |
|----------|---------|
| Portal Invite | Staff sends invite |
| Welcome | Client completes registration |
| Document Request | Staff requests document |
| Upload Confirmation | Client uploads file |
| Matter Update | Status changes |

## Dependencies

- Better-Auth (extend for portal users)
- Email service (Resend)
- Phase 1 complete

## Success Criteria

- [ ] 50% of clients activate portal within 3 months
- [ ] 80% of document requests fulfilled via portal
- [ ] Reduce phone calls for status updates by 50%

---

## Implementation Requirements

### Database Setup
1. **Schema Creation**
   - Create all portal-specific tables (`portalUser`, `portalSession`, `documentRequest`, `portalMessage`)
   - Add indexes on frequently queried columns (email, clientId, status)
   - Set up foreign key constraints with proper cascade rules
   - Create database triggers for audit logging

2. **Data Migration**
   - No migration needed (new tables)
   - Ensure existing client emails are unique
   - Validate client data integrity before portal rollout

### Authentication Implementation
1. **Portal Auth System**
   - Extend Better-Auth for dual authentication contexts (staff vs portal)
   - Implement email verification flow
   - Set up password reset with secure token generation
   - Configure session timeout (30 minutes for portal users)
   - Implement rate limiting on login attempts (5 attempts per 15 minutes)

2. **Security Measures**
   - Hash passwords using bcrypt (cost factor 12)
   - Generate secure invite tokens (crypto.randomBytes)
   - Implement CSRF protection on all forms
   - Set secure HTTP-only cookies
   - Add IP address logging for sessions

### API Development
1. **Portal Auth Router** (`/portal/auth`)
   - POST `/register` - Activate account with invite token
   - POST `/login` - Authenticate and create session
   - POST `/logout` - End session and clear cookies
   - POST `/forgot-password` - Send reset email
   - POST `/reset-password` - Update password with token
   - All endpoints must validate inputs with Zod schemas

2. **Portal Data Router** (`/portal`)
   - GET `/me` - Return current client info (sanitized)
   - GET `/matters` - List client's matters with pagination
   - GET `/matters/:id` - Single matter detail with documents
   - GET `/documents` - List all client documents
   - GET `/documents/:id/download` - Stream document file
   - GET `/requests` - List pending document requests
   - POST `/requests/:id/upload` - Handle file upload
   - GET `/messages` - List messages with pagination
   - POST `/messages` - Send message to staff
   - All data must be filtered by authenticated client ID

3. **Staff Portal Router** (`/clients/portal`)
   - POST `/invite` - Generate and send portal invite
   - POST `/request-document` - Create document request
   - GET `/activity` - View portal activity logs
   - Require staff authentication and permissions

### UI Development
1. **Portal Routes** (Separate from staff app)
   - Create `/portal/*` route structure
   - Implement dedicated portal layout (different from staff)
   - Build login/registration pages
   - Implement forgot/reset password flow
   - Create portal dashboard
   - Build matter list and detail pages
   - Implement document browser
   - Create document upload interface
   - Build messaging interface
   - Add profile/settings page

2. **Staff UI Additions**
   - Add "Send Portal Invite" button to client detail page
   - Add "Request Document" button to matter detail page
   - Create portal activity widget for dashboard
   - Show portal status badge on client cards

3. **Shared Components**
   - `<PortalLayout>` - Portal page wrapper
   - `<MatterCard>` - Matter summary display
   - `<DocumentList>` - Document list with filters
   - `<FileUploader>` - Drag-and-drop upload
   - `<MessageThread>` - Message conversation
   - `<DocumentRequestCard>` - Request display

### Email Integration
1. **Email Templates**
   - Portal Invite - Include registration link with token
   - Welcome - Sent after first login
   - Document Request - Notify client of new request
   - Upload Confirmation - Confirm file received
   - Matter Update - Status change notification
   - Password Reset - Reset link with token

2. **Email Service Setup**
   - Configure Resend API key
   - Set up email sending queue
   - Implement retry logic for failures
   - Track delivery status
   - Handle bounce notifications

### File Upload System
1. **Upload Validation**
   - Check file type against whitelist (PDF, DOC, DOCX, JPG, PNG)
   - Enforce 10MB size limit
   - Scan for malware (ClamAV integration)
   - Generate unique filenames (UUID + timestamp)
   - Store metadata (original name, size, mime type)

2. **Storage Configuration**
   - Configure file storage path
   - Set proper file permissions
   - Implement file cleanup for expired requests
   - Set up backup strategy

### Security Implementation
1. **Access Control**
   - Middleware to verify portal user authentication
   - Row-level security to filter by client ID
   - Prevent cross-client data access
   - Audit log all data access attempts

2. **Rate Limiting**
   - Login attempts: 5 per 15 minutes
   - File uploads: 10 per hour
   - API requests: 100 per minute
   - Message sending: 20 per hour

3. **Data Sanitization**
   - Strip sensitive fields from responses
   - Sanitize file names
   - Validate and escape message content
   - Prevent XSS in user inputs

## Acceptance Criteria

### Authentication & Access
- [ ] Portal users can register using invite token
- [ ] Email verification required before login
- [ ] Password meets strength requirements (8+ chars, mixed case, numbers)
- [ ] Login rate limiting prevents brute force
- [ ] Password reset flow works end-to-end
- [ ] Sessions expire after 30 minutes of inactivity
- [ ] Logout clears all session data
- [ ] Portal users cannot access staff routes

### Matter Viewing
- [ ] Clients can view all their matters
- [ ] Matter list shows current status
- [ ] Matter detail displays timeline
- [ ] Associated documents are visible
- [ ] No access to other clients' matters
- [ ] Matter data is read-only for clients

### Document Management
- [ ] Clients can view all their documents
- [ ] Documents can be downloaded successfully
- [ ] Download initiates proper file stream
- [ ] File names preserved on download
- [ ] Document list paginated correctly
- [ ] Thumbnails generated for images

### Document Requests
- [ ] Staff can create document requests
- [ ] Clients see pending requests
- [ ] Upload interface is user-friendly
- [ ] File type validation enforced
- [ ] File size limit enforced (10MB)
- [ ] Upload progress displayed
- [ ] Confirmation shown on successful upload
- [ ] Staff notified of new uploads
- [ ] Request marked complete after upload

### Messaging
- [ ] Clients can send messages to staff
- [ ] Messages display in chronological order
- [ ] Unread messages highlighted
- [ ] Staff can reply to messages
- [ ] Message notifications sent via email
- [ ] Message content sanitized for XSS

### Email Notifications
- [ ] Invite emails delivered successfully
- [ ] Welcome emails sent on first login
- [ ] Document request emails sent
- [ ] Upload confirmations delivered
- [ ] Matter update emails triggered
- [ ] Password reset emails functional
- [ ] All emails have proper formatting
- [ ] Unsubscribe links present

### Performance
- [ ] Portal pages load in under 2 seconds
- [ ] Document downloads start within 1 second
- [ ] File uploads process efficiently
- [ ] API responses within 500ms (median)
- [ ] Support 100 concurrent users
- [ ] Database queries optimized with indexes

### Security
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] CSRF protection on all forms
- [ ] File uploads validated and scanned
- [ ] Passwords properly hashed
- [ ] Sessions use secure cookies
- [ ] All portal activity logged
- [ ] Rate limiting functional
- [ ] No data leakage between clients

### Mobile Responsiveness
- [ ] All portal pages mobile-friendly
- [ ] Touch-friendly interface elements
- [ ] Readable font sizes on mobile
- [ ] Upload works on mobile devices
- [ ] Navigation accessible on small screens

## Test Cases

### Unit Tests
1. **Authentication**
   - Test invite token generation and validation
   - Test password hashing and verification
   - Test session creation and validation
   - Test password reset token flow
   - Test rate limiting logic

2. **Data Access**
   - Test client ID filtering
   - Test matter retrieval for client
   - Test document access controls
   - Test cross-client access prevention

3. **File Upload**
   - Test file type validation
   - Test file size validation
   - Test filename sanitization
   - Test upload success handling
   - Test upload failure handling

### Integration Tests
1. **Registration Flow**
   - Send invite → Receive email → Register → Verify → Login

2. **Document Request Flow**
   - Staff creates request → Client receives email → Client uploads → Staff notified

3. **Messaging Flow**
   - Client sends message → Staff receives notification → Staff replies → Client sees reply

4. **Password Reset Flow**
   - Request reset → Receive email → Click link → Set new password → Login

### End-to-End Tests
1. **Complete Portal Journey**
   - Invite client → Client registers → Views matters → Downloads document → Uploads requested file → Sends message → Receives reply

2. **Security Tests**
   - Attempt to access other client data (should fail)
   - Attempt SQL injection (should fail)
   - Attempt XSS in messages (should be sanitized)
   - Attempt file upload of malicious file (should be rejected)

### Performance Tests
1. **Load Testing**
   - 100 concurrent users browsing portal
   - 50 concurrent file uploads
   - 200 requests per second to API

2. **Stress Testing**
   - 500 concurrent users
   - 100 simultaneous file uploads
   - Database query performance under load

## Dependencies from Phase 1

### Required Completions
1. **Client Management**
   - Client table and schema
   - Client CRUD operations
   - Client detail pages

2. **Matter Tracking**
   - Matter table and schema
   - Matter status management
   - Matter-client relationships

3. **Document Management**
   - Document table and schema
   - Document storage system
   - Document upload functionality
   - Document download functionality

4. **Authentication**
   - Better-Auth configured
   - Session management
   - User roles defined

5. **Activity Logging**
   - Activity table and schema
   - Logging middleware
   - Activity retrieval API

### Integration Points
- Portal users link to client records
- Portal shows matters from Phase 1
- Portal accesses documents from Phase 1
- Portal activity logs to Phase 1 activity table
- Email service from Phase 1 (if implemented)
