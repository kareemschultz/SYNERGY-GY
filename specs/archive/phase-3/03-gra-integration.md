# GRA Integration

**Status:** Future
**Phase:** 3
**Priority:** High
**Estimated Effort:** 4-6 weeks

## Overview

Integration with Guyana Revenue Authority (GRA) for electronic tax filing, TIN verification, and payment confirmation. Note: API availability may be limited; manual workflows may be needed.

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| GRA-FR-01 | TIN verification | Must |
| GRA-FR-02 | PAYE filing submission | Should |
| GRA-FR-03 | VAT return submission | Should |
| GRA-FR-04 | Filing status tracking | Must |
| GRA-FR-05 | Payment confirmation | Should |
| GRA-FR-06 | Filing history | Must |
| GRA-FR-07 | Deadline calendar sync | Should |
| GRA-FR-08 | Error handling & retry | Must |
| GRA-FR-09 | Submission receipts | Must |
| GRA-FR-10 | Bulk filing | Could |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| GRA-NFR-01 | TIN verification time | < 10 seconds |
| GRA-NFR-02 | Filing submission confirm | < 5 minutes |
| GRA-NFR-03 | Data accuracy | 100% |

## GRA Context

### Current State (Research Needed)
- GRA website: www.gra.gov.gy
- Electronic filing portal exists
- API availability unclear
- Manual processes may be primary

### Potential Integration Points
1. **TIN Verification** - Validate TIN numbers
2. **PAYE Filing** - Monthly employer returns
3. **VAT Returns** - Quarterly/monthly VAT
4. **Corporate Tax** - Annual returns
5. **Payment Integration** - Track payments

## Database Schema

### Tables

#### `graSubmission`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clientId | uuid | Client FK |
| matterId | uuid | Matter FK |
| type | enum | PAYE, VAT, CORPORATE, WITHHOLDING |
| period | varchar(20) | Tax period (e.g., 2024-Q1) |
| submissionDate | date | When submitted |
| method | enum | API, MANUAL, PORTAL |
| status | enum | DRAFT, SUBMITTED, ACCEPTED, REJECTED, PENDING |
| graReference | varchar(100) | GRA reference number |
| filingData | jsonb | Submission data |
| responseData | jsonb | GRA response |
| submittedById | uuid | Staff FK |
| submittedAt | timestamp | Submission time |
| confirmedAt | timestamp | Confirmation time |
| notes | text | Staff notes |

#### `graTinVerification`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| tin | varchar(50) | TIN number |
| clientId | uuid | Client FK |
| isValid | boolean | Verification result |
| entityName | varchar(255) | Registered name |
| entityType | varchar(50) | Business type |
| status | varchar(50) | TIN status |
| verifiedAt | timestamp | Verification time |
| responseData | jsonb | Full response |

#### `graDeadline`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| type | enum | Filing type |
| period | varchar(20) | Tax period |
| dueDate | date | Filing deadline |
| description | text | Deadline details |
| isRecurring | boolean | Recurring deadline |

## Filing Types

### PAYE (Pay As You Earn)
- **Frequency**: Monthly
- **Due Date**: 14th of following month
- **Data Required**:
  - Employee count
  - Gross salaries
  - Tax deducted
  - NIS contributions

### VAT (Value Added Tax)
- **Frequency**: Monthly or Quarterly
- **Due Date**: 21st after period end
- **Data Required**:
  - Output tax (sales)
  - Input tax (purchases)
  - Net VAT payable

### Corporate Tax
- **Frequency**: Annually
- **Due Date**: 3 months after year end
- **Data Required**:
  - Taxable income
  - Deductions
  - Tax payable

### Withholding Tax
- **Frequency**: Monthly
- **Due Date**: 14th of following month
- **Data Required**:
  - Payment type
  - Gross amount
  - Tax withheld

## API Endpoints

### Submissions: `/gra`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/submissions` | List submissions |
| GET | `/submissions/:id` | Single submission |
| POST | `/submit` | Submit filing |
| GET | `/status/:id` | Check status |
| POST | `/retry` | Retry failed |

### TIN: `/gra/tin`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/verify` | Verify TIN |
| GET | `/history` | Verification history |

### Deadlines: `/gra/deadlines`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/upcoming` | Upcoming deadlines |
| GET | `/calendar` | Calendar data |

## UI Components

### GRA Dashboard
- Upcoming filing deadlines
- Recent submissions
- Status overview
- Quick actions

### Filing Form
- Client/period selection
- Data entry fields
- Validation
- Submit button

### Submission Detail
- Status timeline
- Filing data
- GRA response
- Receipt download

### TIN Verification Widget
- Input field
- Verify button
- Result display

## Implementation Approach

### Scenario A: GRA API Available
1. Register for API access
2. Implement authentication
3. Build submission flows
4. Handle responses
5. Track status

### Scenario B: Manual with Tracking
1. Generate filing documents
2. Track manual submissions
3. Record GRA references
4. Status tracking
5. Reminder system

### Hybrid Approach (Likely)
- Some features via API
- Others manual with tracking
- Document generation for portal upload

## Implementation Plan

### Week 1-2: Research & Foundation
- [ ] Research GRA API availability
- [ ] Contact GRA IT department
- [ ] Design schema
- [ ] TIN verification (if available)

### Week 3-4: Filing System
- [ ] Filing form UI
- [ ] Data validation
- [ ] Document generation
- [ ] Submission tracking

### Week 5-6: Integration & Polish
- [ ] API integration (if available)
- [ ] Status tracking
- [ ] Deadline sync
- [ ] Testing

## GRA Filing Calendar

| Filing | Period | Due Date |
|--------|--------|----------|
| PAYE | Monthly | 14th next month |
| VAT (Monthly) | Monthly | 21st next month |
| VAT (Quarterly) | Quarterly | 21st after quarter |
| Corporate Tax | Annually | Mar 31 (Dec year-end) |
| Withholding Tax | Monthly | 14th next month |
| Annual Return | Annually | Jun 30 |

## Business Rules

1. **Data Validation**: Validate before submission
2. **Audit Trail**: Log all submissions
3. **Receipts**: Store all confirmations
4. **Deadlines**: Alert before due dates
5. **Error Recovery**: Retry mechanism

## Dependencies

- Client management (TIN storage)
- Matter tracking (filing matters)
- Document storage (receipts)
- GRA API access (TBD)

## Risks

| Risk | Mitigation |
|------|------------|
| API not available | Manual workflow with tracking |
| API changes | Abstraction layer |
| Authentication issues | Fallback to manual |
| Submission failures | Retry mechanism, manual backup |

## Success Criteria

- [ ] TIN verification available
- [ ] Filing tracking implemented
- [ ] Zero missed deadlines
- [ ] Electronic submission (if API available)

---

## Implementation Requirements

### Core Functionality

#### GRA API Integration (Conditional)
- **API Discovery Phase**
  - Research GRA API availability and documentation
  - Contact GRA IT department for access
  - Obtain API credentials if available
  - Document API endpoints and authentication
  - Create abstraction layer for future API integration

- **TIN Verification Service**
  - API integration (if available) or manual verification workflow
  - TIN format validation (Guyanese format)
  - Entity name matching
  - Cache verification results
  - Verification history tracking

- **Filing Submission System**
  - API submission (if available) or manual tracking workflow
  - Generate filing documents in required format
  - Digital signature implementation (if required)
  - Submission receipt generation
  - Status polling and updates

#### Database Implementation
- **Schema Creation**
  - Implement all tables in Drizzle schema
  - Add indexes for TIN, submission date, filing type
  - Foreign key relationships to clients and matters
  - Compound indexes for reporting queries

- **Queries**
  - Upcoming deadlines by type and period
  - Submission history with filtering
  - Filing compliance reports
  - TIN verification lookups
  - Aging analysis for pending filings

#### API Endpoints
- **Submission Management**
  - Create draft submission
  - Submit to GRA (API or manual tracking)
  - Check submission status
  - Retrieve submission history
  - Download receipts and confirmations

- **TIN Operations**
  - Verify TIN number
  - Retrieve verification history
  - Bulk TIN verification
  - Update cached verification data

- **Deadline Management**
  - Retrieve GRA filing calendar
  - Sync deadlines to deadline module
  - Calculate upcoming deadlines
  - Deadline compliance tracking

### UI Components

#### GRA Dashboard
- **Overview Panel**
  - Upcoming deadlines (next 30 days)
  - Pending submissions
  - Recent submission status
  - Compliance score/metrics
  - Quick action buttons

- **Deadline Calendar**
  - Monthly view of filing deadlines
  - Color-coded by type
  - Completion status indicators
  - Click to create submission

#### Filing Form Interface
- **Submission Form**
  - Client/TIN selection
  - Filing type selector
  - Period selection (monthly/quarterly/annual)
  - Data entry fields (type-specific)
  - Validation rules
  - Attachment upload
  - Submit/save draft buttons

- **PAYE Filing Form**
  - Number of employees
  - Total gross salaries
  - PAYE tax deducted
  - NIS contributions
  - Period selection

- **VAT Filing Form**
  - Output tax (sales)
  - Input tax (purchases)
  - Net VAT payable/refundable
  - Zero-rated sales
  - Exempt sales

#### Submission Detail View
- **Status Timeline**
  - Draft created
  - Submitted
  - Acknowledged
  - Accepted/Rejected
  - Payment confirmed

- **Filing Data Display**
  - All submitted data
  - Calculated totals
  - Attached documents
  - GRA response

- **Actions**
  - Download receipt
  - Print summary
  - Amend submission (if allowed)
  - Record payment

#### TIN Verification Widget
- **Input Section**
  - TIN number input
  - Client selector (optional)
  - Verify button

- **Results Display**
  - Verification status (valid/invalid)
  - Entity name
  - Entity type
  - Registration status
  - Last verified date

### Automated Triggers

#### Deadline Notifications
- **Advance Reminders**
  - 14 days before deadline
  - 7 days before deadline
  - 2 days before deadline
  - Day of deadline

- **Integration with Deadline Module**
  - Create deadline records for GRA filings
  - Link to client matters
  - Assign to responsible staff
  - Update status on submission

#### Filing Automation
- **Recurring Deadline Creation**
  - Monthly PAYE deadlines
  - Monthly/Quarterly VAT deadlines
  - Annual corporate tax deadlines
  - Annual returns

- **Status Updates**
  - Email notification on submission
  - Notification on GRA response
  - Alert on rejection
  - Payment reminder

### External Integration Requirements

#### GRA API Integration (If Available)
- **Authentication**
  - API key or OAuth implementation
  - Certificate-based authentication (if required)
  - Secure credential storage
  - Token refresh mechanism

- **Data Formats**
  - XML/JSON payload formats
  - Field validation rules
  - Required vs optional fields
  - Date format requirements

- **Response Handling**
  - Parse GRA responses
  - Extract reference numbers
  - Handle error codes
  - Store confirmation data

#### Manual Workflow (Fallback)
- **Document Generation**
  - PDF forms pre-filled with data
  - Print-ready format
  - Filing checklist
  - Submission cover sheet

- **Manual Tracking**
  - Record manual submission
  - Manual GRA reference entry
  - Manual status updates
  - Receipt upload

### Security Considerations

#### Data Protection
- **Sensitive Tax Information**
  - Encrypt TIN numbers at rest
  - Secure transmission (HTTPS/TLS)
  - Access control for tax data
  - Audit logging for all access

- **Financial Data**
  - Encryption of filing amounts
  - Transaction integrity
  - Tamper detection
  - Backup and recovery

#### Compliance
- **Tax Confidentiality**
  - Role-based access control
  - Client data segregation
  - Staff permission levels
  - Audit trail for all operations

- **Record Retention**
  - 7-year minimum retention (tax law)
  - Immutable submission records
  - Receipt archival
  - Compliance documentation

#### Digital Signatures (If Required)
- **Certificate Management**
  - Digital certificate acquisition
  - Certificate renewal tracking
  - Secure key storage
  - Signing workflow

## Acceptance Criteria

### Functional Acceptance

#### TIN Verification
- [ ] Verify valid TIN successfully
- [ ] Detect invalid TIN format
- [ ] Return entity name for valid TIN
- [ ] Cache verification results
- [ ] Display verification history
- [ ] Bulk verification of 100+ TINs
- [ ] Handle API unavailability gracefully
- [ ] Manual verification option available

#### Filing Management
- [ ] Create PAYE filing draft
- [ ] Create VAT filing draft
- [ ] Validate filing data
- [ ] Calculate totals automatically
- [ ] Submit filing (API or manual)
- [ ] Receive submission confirmation
- [ ] Store GRA reference number
- [ ] Track filing status
- [ ] Download submission receipt

#### Deadline Management
- [ ] Display upcoming GRA deadlines
- [ ] Deadlines sync with deadline module
- [ ] Create filing from deadline
- [ ] Mark deadline complete on submission
- [ ] Deadline reminders sent
- [ ] Overdue deadlines highlighted
- [ ] Deadline calendar view functional

#### Document Management
- [ ] Generate filing documents (PDF)
- [ ] Attach supporting documents
- [ ] Store submission receipts
- [ ] Download submission package
- [ ] Print filing summary

### Non-Functional Acceptance

#### Performance
- [ ] TIN verification completes in < 10 seconds
- [ ] Filing submission confirms in < 5 minutes (API)
- [ ] Deadline calendar loads in < 2 seconds
- [ ] Filing history query returns in < 3 seconds
- [ ] Document generation completes in < 10 seconds

#### Reliability
- [ ] TIN verification 99%+ accurate (if API)
- [ ] Zero data loss on submission
- [ ] Submission receipts always generated
- [ ] Graceful degradation if API unavailable
- [ ] Retry mechanism for failed submissions

#### Scalability
- [ ] Support 500+ client TINs
- [ ] Handle 200+ submissions per month
- [ ] 7-year filing history accessible
- [ ] Concurrent submissions by multiple users

#### Security
- [ ] TIN data encrypted at rest
- [ ] API credentials secured
- [ ] Access control enforced
- [ ] Audit log complete
- [ ] Backup procedures tested

### Integration Acceptance
- [ ] GRA deadlines create deadline records
- [ ] Filing completion updates matter status
- [ ] Email notifications triggered
- [ ] Activity log captures submissions
- [ ] Reports include GRA data

## Test Cases

### Unit Tests

#### TIN Service
```typescript
describe('GRATinService', () => {
  test('should validate TIN format')
  test('should verify TIN via API')
  test('should handle invalid TIN')
  test('should cache verification results')
  test('should return cached data when available')
  test('should handle API errors gracefully')
})
```

#### Filing Service
```typescript
describe('GRAFilingService', () => {
  test('should create PAYE filing')
  test('should validate filing data')
  test('should calculate totals correctly')
  test('should generate filing document')
  test('should submit via API')
  test('should handle submission errors')
  test('should track filing status')
})
```

#### Deadline Service
```typescript
describe('GRADeadlineService', () => {
  test('should calculate next PAYE deadline')
  test('should calculate next VAT deadline')
  test('should identify overdue deadlines')
  test('should sync deadlines to deadline module')
  test('should handle recurring deadlines')
})
```

### Integration Tests

#### API Endpoints
```typescript
describe('POST /gra/tin/verify', () => {
  test('should verify valid TIN')
  test('should return 400 for invalid format')
  test('should cache result')
  test('should require authentication')
})

describe('POST /gra/submit', () => {
  test('should create PAYE submission')
  test('should validate required fields')
  test('should return submission ID')
  test('should log submission')
  test('should require permissions')
})

describe('GET /gra/deadlines/upcoming', () => {
  test('should return next 30 days deadlines')
  test('should filter by type')
  test('should include completion status')
  test('should sort by date')
})
```

### E2E Tests

#### Filing Workflows
```typescript
describe('PAYE Filing Workflow', () => {
  test('should create PAYE filing for client')
  test('should enter employee and salary data')
  test('should calculate PAYE tax')
  test('should submit filing')
  test('should receive confirmation')
  test('should store GRA reference')
  test('should mark deadline complete')
})

describe('TIN Verification Workflow', () => {
  test('should verify TIN from client page')
  test('should display entity name')
  test('should save to client record')
  test('should show in verification history')
})

describe('Deadline Reminder Workflow', () => {
  test('should send reminder 7 days before')
  test('should create deadline in system')
  test('should link to client')
  test('should allow filing creation from reminder')
})
```

### Manual Test Cases

1. **TIN Verification**
   - Enter valid TIN
   - Click verify
   - Verify entity name returned
   - Check result cached
   - Test invalid TIN shows error

2. **PAYE Filing**
   - Select client with TIN
   - Choose PAYE filing type
   - Enter period (e.g., November 2024)
   - Enter 10 employees, $500,000 gross salary
   - System calculates PAYE tax
   - Submit filing
   - Verify confirmation received
   - Check GRA reference stored

3. **VAT Filing**
   - Create VAT return
   - Enter output tax $10,000
   - Enter input tax $7,000
   - System calculates net VAT $3,000
   - Submit
   - Download receipt

4. **Deadline Calendar**
   - View December 2024 calendar
   - Verify PAYE deadline on 14th
   - Verify VAT deadline on 21st
   - Click deadline to create filing
   - Complete filing
   - Verify deadline marked complete

5. **Manual Submission Tracking**
   - Create filing
   - Choose manual submission
   - Generate PDF document
   - Print and submit physically
   - Enter GRA reference manually
   - Upload scanned receipt

### Performance Test Cases

1. **Bulk TIN Verification**
   - Verify 100 TINs
   - Measure total time
   - Verify all results correct
   - Check cache performance

2. **Filing History Load**
   - Load 7 years of filings (1000+ records)
   - Measure query time
   - Test filtering performance
   - Test pagination

3. **Concurrent Submissions**
   - 5 staff submit filings simultaneously
   - Verify no conflicts
   - Check all submissions logged
   - Verify correct attribution

### Compliance Test Cases

1. **Data Retention**
   - Verify 7-year-old filings accessible
   - Test data integrity over time
   - Verify receipts preserved
   - Check audit trail complete

2. **Access Control**
   - Test role permissions
   - Verify client data segregation
   - Test unauthorized access blocked
   - Verify audit logging

3. **Data Accuracy**
   - Verify calculation accuracy
   - Test rounding rules
   - Verify totals match details
   - Test data validation rules

## External Integration Requirements

### GRA IT Department Communication
**Initial Contact:**
1. Identify GRA IT contact person
2. Request API documentation
3. Request developer/test account
4. Clarify authentication requirements
5. Understand submission formats
6. Get test environment access

**Information Needed:**
- API base URL (production and test)
- Authentication method (API key, OAuth, certificate)
- TIN verification endpoint
- Filing submission endpoints
- Status check endpoints
- Response format documentation
- Error code reference
- Rate limits and quotas
- Support contact information

### API Setup (If Available)
**Required Credentials:**
- `GRA_API_URL`
- `GRA_API_KEY` or `GRA_CLIENT_ID`/`GRA_CLIENT_SECRET`
- `GRA_CERTIFICATE_PATH` (if certificate auth)
- `GRA_ENVIRONMENT` (test/production)

**Testing Requirements:**
- Test TIN numbers for validation
- Test submission scenarios
- Error condition testing
- Performance benchmarking
- Load testing approval

### Manual Workflow Design (Fallback)
**Document Templates:**
- PAYE return form template
- VAT return form template
- Corporate tax return template
- Withholding tax form template
- Submission cover sheet

**Workflow Documentation:**
1. Generate pre-filled PDF
2. Review and validate data
3. Print document
4. Sign physically
5. Submit to GRA office
6. Obtain stamped receipt
7. Enter GRA reference in system
8. Upload scanned receipt
9. Mark as submitted

### Data Format Requirements
**TIN Format:**
- Validate against Guyanese TIN format
- Handle business vs individual TINs
- Format normalization

**Date Formats:**
- Tax periods (YYYY-MM, YYYY-QN, YYYY)
- Deadline dates (YYYY-MM-DD)
- Fiscal year handling

**Currency:**
- Guyana Dollars (GYD)
- Decimal precision (2 places)
- Rounding rules

**Filing Periods:**
- Monthly: YYYY-MM (e.g., 2024-11)
- Quarterly: YYYY-Q1/Q2/Q3/Q4
- Annual: YYYY or fiscal year end date
