# Document Management

**Status:** ✅ Complete (UI ready, server upload deferred)
**Phase:** 1
**Priority:** High

## Overview

Digital document storage with categorization, expiration tracking, and client/matter linking. Supports upload, download, and organization of client documents.

## User Stories

### Staff
- As a staff member, I can upload documents for clients
- As a staff member, I can browse and search documents
- As a staff member, I can download documents
- As a staff member, I can see documents expiring soon

### Manager
- As a manager, I can view all documents for my business
- As a manager, I can see document statistics

### Admin
- As an admin, I can manage document templates
- As an admin, I can archive/restore documents

## Database Schema

### Tables

#### `document`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| fileName | varchar(255) | Stored filename |
| originalName | varchar(255) | Original upload name |
| mimeType | varchar(100) | File MIME type |
| fileSize | integer | Size in bytes |
| storagePath | varchar(500) | Local storage path |
| cloudBackupPath | varchar(500) | S3/R2 backup path |
| isBackedUp | boolean | Backup status |
| category | enum | Document category |
| description | text | Document description |
| clientId | uuid | Client FK |
| matterId | uuid | Matter FK (optional) |
| expirationDate | date | Document expiration |
| expirationNotified | boolean | Expiry alert sent |
| status | enum | ACTIVE, ARCHIVED |
| uploadedById | uuid | Uploader FK |
| createdAt | timestamp | Upload date |
| updatedAt | timestamp | Modified date |

#### `documentTemplate`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | varchar(255) | Template name |
| description | text | Template description |
| category | enum | Document category |
| business | enum | GCMC, KAJ, or null (both) |
| templatePath | varchar(500) | Template file path |
| placeholders | jsonb | Replaceable fields |
| isActive | boolean | Template available |

### Document Categories

| Category | Description |
|----------|-------------|
| IDENTITY | ID cards, passports, birth certificates |
| TAX | Tax returns, assessments, receipts |
| FINANCIAL | Bank statements, financial reports |
| LEGAL | Contracts, agreements, legal documents |
| IMMIGRATION | Visas, work permits, travel documents |
| BUSINESS | Registration, licenses, certificates |
| CORRESPONDENCE | Letters, emails, communications |
| TRAINING | Certificates, course materials |
| OTHER | Miscellaneous documents |

## Storage Architecture

### Local Storage (Primary)
```
/data/uploads/
├── 2024/
│   └── 12/
│       └── {clientId}/
│           └── {documentId}_{sanitized_filename}
```

### Cloud Backup (S3/R2)
- Mirrors local structure
- Hourly sync for `isBackedUp = false`
- Updates `cloudBackupPath` on success

### Upload Flow (Planned)
1. `POST /rpc/documents.getUploadUrl` - Reserve document ID
2. `POST /api/upload/:documentId` - Stream file to storage
3. `POST /rpc/documents.completeUpload` - Finalize metadata

### Download Flow (Planned)
1. `GET /rpc/documents.getDownloadUrl` - Get signed/auth URL
2. `GET /api/download/:documentId` - Stream with auth check

## API Endpoints

### Base: `/documents`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/list` | Paginated list with filters |
| GET | `/getById` | Single document |
| POST | `/create` | Create document record |
| PUT | `/update` | Update metadata |
| PUT | `/archive` | Archive document |
| PUT | `/restore` | Restore archived |
| GET | `/getExpiring` | Documents expiring in N days |
| GET | `/getByClient` | Client's documents |
| GET | `/getByMatter` | Matter's documents |
| GET | `/getStats` | Document statistics |

### Templates: `/documents/templates`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/list` | List templates |
| GET | `/getById` | Single template |
| POST | `/generate` | Generate from template (future) |

## UI Components

### Pages
- `/app/documents/` - Document browser
- `/app/documents/upload` - Upload interface

### Document Browser Features
- Filter by category, client, status
- Search by filename, description
- Grid/list view toggle
- Download action
- Archive/restore actions
- Statistics cards (total, by category, expiring)

### Upload Interface Features
- Drag-and-drop zone (react-dropzone)
- Client selection
- Matter selection (optional)
- Category selection
- Expiration date (optional)
- Description field
- Progress indicator (future)

## Business Rules

1. **Client Required**: Every document must link to a client
2. **Categories**: Helps organize and filter documents
3. **Expiration Tracking**: Alert when documents expire (30/14/7/1 days)
4. **Soft Delete**: Archive instead of delete
5. **Access Control**: Staff see only their business's documents

## File Types Supported

| Type | Extensions |
|------|------------|
| Documents | .pdf, .doc, .docx, .xls, .xlsx |
| Images | .jpg, .jpeg, .png, .gif |
| Text | .txt, .csv |

**Max file size:** 50MB (configurable)

## Dependencies

- Client table (required)
- Matter table (optional link)
- Staff table (uploader tracking)
- File storage system

## Deferred Items

- [ ] Server-side upload handler (`/api/upload/:documentId`)
- [ ] Server-side download handler (`/api/download/:documentId`)
- [ ] Cloud backup job
- [ ] Document template generation
- [ ] In-browser preview
- [ ] Thumbnail generation

## Files

| Purpose | Path |
|---------|------|
| Schema | `/packages/db/src/schema/documents.ts` |
| Router | `/packages/api/src/routers/documents.ts` |
| Browser Page | `/apps/web/src/routes/app/documents/index.tsx` |
| Upload Page | `/apps/web/src/routes/app/documents/upload.tsx` |

## Implementation Requirements

### Database Implementation
- [x] Create `document` table with all metadata fields
- [x] Create `documentTemplate` table for templates
- [x] Add indexes on `clientId`, `matterId`, `category`, `status`, `expirationDate`
- [x] Add foreign key constraints to `clientId`, `matterId`, `uploadedById`
- [x] Implement soft delete via `status` field (ARCHIVED)
- [x] Add index on `expirationDate` for expiration queries

### API Implementation
- [x] Implement `/documents/list` with pagination and filters
  - Filter by: category, client, matter, status
  - Search by: fileName, originalName, description
  - Sort by: createdAt, fileName, expirationDate
  - Return 20 items per page by default
- [x] Implement `/documents/getById` with metadata
  - Include: client, matter, uploader details
- [x] Implement `/documents/create` for metadata record
  - Validate client exists
  - Validate file size <= 50MB
  - Validate MIME type is allowed
- [x] Implement `/documents/update` for metadata updates
  - Allow updating: description, category, expirationDate
- [x] Implement `/documents/archive` and `/documents/restore`
- [x] Implement `/documents/getExpiring` for alerts
  - Return documents expiring in next N days
- [x] Implement `/documents/getByClient` and `/documents/getByMatter`
- [x] Implement `/documents/getStats` for dashboard
- [x] Implement template endpoints (list, getById)
- [ ] Implement upload handler (deferred to Phase 2)
- [ ] Implement download handler (deferred to Phase 2)
- [x] Add business-level filtering to all queries
- [x] Add authorization checks to all mutations

### Frontend Implementation
- [x] Create document browser page
  - Category filter dropdown
  - Client filter (autocomplete)
  - Status filter (active/archived)
  - Search by filename
  - Grid/list view toggle
  - Statistics cards (total, by category, expiring)
  - Pagination controls
- [x] Create upload interface
  - Drag-and-drop zone (react-dropzone)
  - Client selector (required)
  - Matter selector (optional, filtered by client)
  - Category dropdown
  - Description textarea
  - Expiration date picker (optional)
  - File validation (type, size)
  - Upload button with loading state
- [x] Implement document cards with actions
  - Show filename, category badge, upload date
  - Download button (disabled until server handler implemented)
  - Archive/restore button
  - View details link
- [x] Add loading states and error handling
- [x] Implement expiration warnings (< 30 days)

### Validation Rules
- [x] Client is required for all documents
- [x] File size must be <= 50MB
- [x] MIME type must be in allowed list
- [x] Category is required
- [x] Expiration date must be in future if provided
- [x] Only active clients can have documents uploaded
- [ ] File upload validates actual file content (deferred)

## Acceptance Criteria

### Functional Requirements
- [ ] User can browse documents with filters and search
- [ ] User can filter by category, client, status
- [ ] User can view document metadata and details
- [ ] User can see documents expiring soon (30 days warning)
- [ ] User can archive and restore documents
- [ ] User can update document metadata (description, category, expiration)
- [ ] User can only access documents within their assigned businesses
- [ ] Manager can see all documents for their business
- [ ] Admin can manage documents across both businesses
- [ ] Upload UI is functional (creates records, awaiting server handler)
- [ ] Download button is present (disabled until server handler)

### Technical Requirements
- [ ] All API endpoints return proper HTTP status codes
- [ ] API responses include proper error messages
- [ ] Forms show validation errors inline
- [ ] File size validation works (50MB limit)
- [ ] MIME type validation works
- [ ] Expiration queries perform efficiently (indexed)
- [ ] Foreign key constraints prevent orphaned documents
- [ ] Business filtering prevents data leakage
- [ ] Document statistics are accurate

### User Experience
- [ ] Document list loads quickly with skeleton loaders
- [ ] Grid/list view toggle works smoothly
- [ ] Upload interface provides clear feedback
- [ ] File type/size errors show immediately
- [ ] Expiring documents have visual indicators (red/amber badges)
- [ ] Success messages confirm actions
- [ ] Mobile layout is usable and responsive
- [ ] Document categories have consistent color coding

## Test Cases

### Unit Tests (API Layer)
```typescript
describe('Document API', () => {
  test('list documents with pagination')
  test('list filters by category correctly')
  test('list filters by client correctly')
  test('list filters by status correctly')
  test('search by filename returns matches')
  test('getById returns document with relations')
  test('getById returns 404 for non-existent document')
  test('create validates required fields')
  test('create validates file size')
  test('create validates MIME type')
  test('update allows metadata changes')
  test('update prevents changing uploaded file')
  test('archive sets status to ARCHIVED')
  test('restore sets status to ACTIVE')
  test('getExpiring returns documents within N days')
  test('getByClient returns client documents')
  test('getByMatter returns matter documents')
  test('getStats returns accurate counts')
  test('business filtering prevents cross-business access')
})

describe('Document Template API', () => {
  test('list returns templates')
  test('list filters by business')
  test('getById returns template details')
})
```

### Integration Tests (E2E)
```typescript
describe('Document Management Flow', () => {
  test('browse documents and apply filters')
  test('search for document by filename')
  test('view document details')
  test('update document metadata')
  test('archive document')
  test('restore archived document')
  test('filter documents by category')
  test('view expiring documents')
  test('staff cannot access other business documents')
})

describe('Document Upload Flow (Metadata)', () => {
  test('create document record with valid data')
  test('validate file size exceeds limit')
  test('validate invalid MIME type rejected')
  test('validate client is required')
  test('validate expiration date in past rejected')
})
```

### Manual Test Scenarios
1. **Browse Documents**
   - Navigate to documents page
   - Verify statistics cards show correct counts
   - Toggle between grid and list view
   - Filter by IDENTITY category
   - Filter by specific client
   - Search by filename
   - Combine filters
   - Verify pagination works

2. **Upload Document (Metadata)**
   - Click "Upload Document"
   - Select client from dropdown
   - Select matter (optional)
   - Select category (TAX)
   - Enter description
   - Set expiration date (1 year from now)
   - Verify validation for required fields
   - Submit and verify success message
   - Note: Actual file upload deferred to Phase 2

3. **Document Management**
   - Open document details
   - Edit description
   - Change category
   - Update expiration date
   - Save changes
   - Verify updates reflected

4. **Archive and Restore**
   - Find active document
   - Click archive button
   - Verify status changes to ARCHIVED
   - Filter by archived status
   - Click restore button
   - Verify status back to ACTIVE

5. **Expiration Tracking**
   - View documents expiring in 30 days
   - Verify warning badge shows
   - Create document with expiration in 29 days
   - Verify appears in expiring list
   - Verify color coding (red for <7 days, amber for <30 days)

6. **Access Control**
   - Login as GCMC staff
   - Verify can only see GCMC client documents
   - Try accessing KAJ document by URL
   - Verify access denied
   - Login as admin
   - Verify can see documents from both businesses
