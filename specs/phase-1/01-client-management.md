# Client Management

**Status:** ✅ Complete
**Phase:** 1
**Priority:** High

## Overview

Unified client database serving both GCMC and KAJ businesses. Supports individuals, businesses, NGOs, and foreign nationals with comprehensive contact and communication tracking.

## User Stories

### Staff
- As a staff member, I can search for clients by name, email, or TIN
- As a staff member, I can view a client's complete profile with all related matters
- As a staff member, I can add contacts and log communications

### Manager
- As a manager, I can see all clients within my business unit
- As a manager, I can assign primary staff to clients

### Admin
- As an admin, I can manage clients across both businesses
- As an admin, I can link related clients (spouses, directors, etc.)

## Database Schema

### Tables

#### `client`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| type | enum | INDIVIDUAL, SMALL_BUSINESS, CORPORATION, NGO, COOP, FOREIGN_NATIONAL, INVESTOR |
| displayName | varchar(255) | Name for display/search |
| firstName | varchar(100) | Individual first name |
| lastName | varchar(100) | Individual last name |
| dateOfBirth | date | Individual DOB |
| nationality | varchar(50) | Country of nationality |
| businessName | varchar(255) | Business/organization name |
| registrationNumber | varchar(50) | Business registration # |
| email | varchar(255) | Primary email |
| phone | varchar(50) | Primary phone |
| address | text | Full address |
| city | varchar(100) | City |
| country | varchar(50) | Country (default: Guyana) |
| tinNumber | varchar(50) | Tax ID number |
| nationalId | varchar(50) | National ID |
| passportNumber | varchar(50) | Passport number |
| businesses | text[] | [GCMC, KAJ] |
| status | enum | ACTIVE, INACTIVE, ARCHIVED |
| primaryStaffId | uuid | Assigned staff FK |
| notes | text | Internal notes |
| createdById | uuid | Creating staff FK |
| createdAt | timestamp | Created date |
| updatedAt | timestamp | Updated date |

#### `clientContact`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clientId | uuid | Client FK |
| name | varchar(255) | Contact name |
| relationship | varchar(100) | Relationship to client |
| email | varchar(255) | Contact email |
| phone | varchar(50) | Contact phone |
| isPrimary | boolean | Primary contact flag |

#### `clientLink`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clientId | uuid | Client FK |
| linkedClientId | uuid | Linked client FK |
| linkType | varchar(50) | spouse, parent, director, shareholder, etc. |
| notes | text | Link description |

#### `clientCommunication`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clientId | uuid | Client FK |
| type | enum | PHONE, EMAIL, IN_PERSON, WHATSAPP |
| direction | enum | INBOUND, OUTBOUND |
| subject | varchar(255) | Communication subject |
| summary | text | Communication details |
| staffId | uuid | Staff who handled |
| communicatedAt | timestamp | When it occurred |

## API Endpoints

### Base: `/clients`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/list` | Paginated list with filters |
| GET | `/getById` | Single client with relations |
| POST | `/create` | Create new client |
| PUT | `/update` | Update client |
| GET | `/search` | Quick search for autocomplete |

### Contacts: `/clients/contacts`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/list` | List contacts for client |
| POST | `/create` | Add contact |
| PUT | `/update` | Update contact |
| DELETE | `/delete` | Remove contact |

### Links: `/clients/links`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/list` | List client links |
| POST | `/create` | Create link |
| DELETE | `/delete` | Remove link |

### Communications: `/clients/communications`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/list` | List communications |
| POST | `/create` | Log communication |

## UI Components

### Pages
- `/app/clients/` - Client list with search and filters
- `/app/clients/new` - New client form
- `/app/clients/$clientId` - Client detail with tabs

### Client List Features
- Search by name, email, phone, TIN
- Filter by type, business, status
- Pagination (20 per page)
- Quick actions (view, edit)

### Client Detail Tabs
- **Overview** - Basic info, status, assigned staff
- **Contacts** - Contact list with add/edit/delete
- **Matters** - Related matters list
- **Documents** - Client documents
- **Communications** - Communication log

## Business Rules

1. **Display Name**: Auto-generated from firstName + lastName for individuals, businessName for organizations
2. **Business Assignment**: Client must belong to at least one business (GCMC or KAJ)
3. **TIN Validation**: If provided, must be unique across all clients
4. **Status Transitions**: ACTIVE -> INACTIVE -> ARCHIVED (soft delete)
5. **Access Control**: Staff can only view/edit clients within their assigned businesses

## Dependencies

- Staff table for assignments
- Matter table for related matters
- Document table for client documents

## Files

| Purpose | Path |
|---------|------|
| Schema | `/packages/db/src/schema/clients.ts` |
| Router | `/packages/api/src/routers/clients.ts` |
| List Page | `/apps/web/src/routes/app/clients/index.tsx` |
| New Page | `/apps/web/src/routes/app/clients/new.tsx` |
| Detail Page | `/apps/web/src/routes/app/clients/$clientId.tsx` |

## Implementation Requirements

### Database Implementation
- [x] Create `client` table with all specified columns
- [x] Create `clientContact` table with foreign key to client
- [x] Create `clientLink` table for client relationships
- [x] Create `clientCommunication` table for logging interactions
- [x] Add indexes on `displayName`, `email`, `tinNumber`, `status`
- [x] Add index on `businesses` array column for filtering
- [x] Add foreign key constraints to `primaryStaffId`, `createdById`
- [x] Implement soft delete via `status` field (ARCHIVED)

### API Implementation
- [x] Implement `/clients/list` with pagination, search, and filters
  - Filter by: type, business, status, assignedStaff
  - Search by: displayName, email, phone, tinNumber
  - Sort by: displayName, createdAt, updatedAt
  - Return 20 items per page by default
- [x] Implement `/clients/getById` with related data
  - Include: contacts, linked clients, recent matters, recent communications
- [x] Implement `/clients/create` with validation
  - Validate required fields based on client type
  - Auto-generate displayName
  - Validate TIN uniqueness if provided
- [x] Implement `/clients/update` with partial updates
  - Prevent changing immutable fields (id, createdAt, createdById)
- [x] Implement `/clients/search` for autocomplete (fast, simple)
- [x] Implement contact CRUD endpoints
- [x] Implement client linking endpoints
- [x] Implement communication logging endpoints
- [x] Add business-level filtering to all queries
- [x] Add authorization checks to all mutations

### Frontend Implementation
- [x] Create client list page with search and filters
  - Search input with debounced API calls
  - Filter dropdowns for type, business, status
  - Pagination controls
  - Client cards/rows showing key info
  - "New Client" button
- [x] Create new client form with type-specific fields
  - Type selector determining visible fields
  - Business multi-select (GCMC/KAJ)
  - Form validation with error messages
  - Submit handler with loading state
  - Success redirect to client detail
- [x] Create client detail page with tabs
  - Overview tab: basic info, edit button, archive button
  - Contacts tab: list with add/edit/delete
  - Matters tab: related matters list with links
  - Documents tab: client documents with upload
  - Communications tab: log with add new entry
- [x] Implement client search autocomplete component
  - Used in matter creation, deadline creation
  - Shows displayName, type badge
- [x] Add loading states and error handling
- [x] Implement optimistic updates for better UX

### Validation Rules
- [x] Client type is required (enum)
- [x] At least one business must be selected
- [x] For INDIVIDUAL: firstName and lastName required
- [x] For businesses: businessName required
- [x] Email format validation
- [x] Phone format validation (flexible)
- [x] TIN must be unique if provided
- [x] Country defaults to "Guyana"
- [x] Display name auto-generated and not user-editable

## Acceptance Criteria

### Functional Requirements
- [ ] User can create new clients with all required fields
- [ ] User can search for clients by name, email, phone, or TIN
- [ ] User can filter client list by type, business, and status
- [ ] User can view complete client profile with all related data
- [ ] User can edit existing client information
- [ ] User can archive clients (soft delete)
- [ ] User can add, edit, and remove client contacts
- [ ] User can link related clients (spouses, directors, etc.)
- [ ] User can log communications with clients
- [ ] User can only access clients within their assigned businesses
- [ ] Manager can assign primary staff to clients
- [ ] Admin can manage clients across both businesses

### Technical Requirements
- [ ] All API endpoints return proper HTTP status codes
- [ ] API responses include proper error messages
- [ ] Forms show validation errors inline
- [ ] Pagination works correctly with filters
- [ ] Search is performant (< 500ms response time)
- [ ] TIN uniqueness is enforced at database level
- [ ] Foreign key constraints prevent orphaned records
- [ ] Business filtering prevents data leakage
- [ ] Optimistic updates provide instant feedback

### User Experience
- [ ] Client list loads quickly with skeleton loaders
- [ ] Forms provide helpful validation messages
- [ ] Success messages confirm actions (create, update, archive)
- [ ] Navigation between related entities is intuitive
- [ ] Mobile layout is usable and responsive
- [ ] Keyboard navigation works in forms
- [ ] Screen readers can navigate the interface

## Test Cases

### Unit Tests (API Layer)
```typescript
describe('Client API', () => {
  test('list clients with pagination')
  test('list filters by business correctly')
  test('list filters by status correctly')
  test('search returns matching clients')
  test('getById returns client with relations')
  test('getById returns 404 for non-existent client')
  test('create validates required fields')
  test('create generates displayName correctly')
  test('create enforces TIN uniqueness')
  test('update allows partial updates')
  test('update prevents changing immutable fields')
  test('business filtering prevents cross-business access')
})

describe('Client Contacts API', () => {
  test('list returns contacts for client')
  test('create adds contact to client')
  test('update modifies contact')
  test('delete removes contact')
  test('only one primary contact allowed')
})

describe('Client Links API', () => {
  test('create links two clients')
  test('list returns linked clients')
  test('delete removes link')
  test('prevents linking client to itself')
})

describe('Client Communications API', () => {
  test('create logs communication')
  test('list returns communications for client')
  test('filters by type and direction')
})
```

### Integration Tests (E2E)
```typescript
describe('Client Management Flow', () => {
  test('create individual client and view details')
  test('create business client with registration number')
  test('search for client and navigate to detail')
  test('add contact to client')
  test('link two clients as spouses')
  test('log phone communication with client')
  test('filter clients by business')
  test('archive client and verify status change')
  test('staff cannot access other business clients')
})
```

### Manual Test Scenarios
1. **Create Individual Client**
   - Fill form with firstName, lastName, email, phone
   - Select business (GCMC)
   - Submit and verify redirect to detail page
   - Verify displayName is "FirstName LastName"

2. **Create Business Client**
   - Select type: CORPORATION
   - Fill businessName, registrationNumber
   - Add TIN number
   - Select both businesses (GCMC + KAJ)
   - Submit and verify success

3. **Search and Filter**
   - Search by partial name, verify results
   - Search by email, verify exact match
   - Filter by INDIVIDUAL type
   - Filter by ACTIVE status
   - Combine filters and search

4. **Client Detail Management**
   - Navigate to client detail
   - Add new contact, verify appears in list
   - Mark contact as primary
   - Add internal note
   - Log email communication
   - Link to spouse client

5. **Access Control**
   - Login as GCMC staff
   - Verify can only see GCMC clients
   - Verify cannot access KAJ client by direct URL
   - Login as admin
   - Verify can see both GCMC and KAJ clients
