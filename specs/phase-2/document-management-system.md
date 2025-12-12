# Document Management System Specification

**Status**: Sprint 1 Complete (Database & API) - UI Pending
**Priority**: HIGH
**Phase**: Phase 2
**Created**: 2025-12-12
**Last Updated**: 2025-12-12

## Implementation Status

### ✅ Sprint 1: Database & API (COMPLETED - December 12, 2024)
- Database schema changes implemented
- Client service selection tracking table created
- API endpoints for document fulfillment tracking
- Document linking to service requirements

### ⏳ Sprint 2-7: UI Integration (PENDING)
- Wizard document upload step
- Client documents tab
- Portal document enhancements
- Matter-linked document views

---

## Table of Contents

1. [Overview](#overview)
2. [Goals & Objectives](#goals--objectives)
3. [User Stories](#user-stories)
4. [Technical Requirements](#technical-requirements)
5. [Database Schema Changes](#database-schema-changes)
6. [API Endpoints](#api-endpoints)
7. [UI/UX Design](#uiux-design)
8. [Workflows](#workflows)
9. [Security Considerations](#security-considerations)
10. [Testing Strategy](#testing-strategy)
11. [Success Metrics](#success-metrics)
12. [Open Questions](#open-questions)

---

## Overview

The Document Management System enhancement integrates document upload capabilities into the client onboarding wizard, tracks service-based document requirements, and provides comprehensive document organization across staff and client interfaces. This system ensures that all required documents for GCMC and KAJ services are collected, tracked, and easily accessible.

### Current State

**Existing Infrastructure**:
- Document upload page at `/app/documents/upload` with category, expiration, client/matter linking
- Document schema with full metadata (category, description, tags, expiration, associations)
- Document storage with local filesystem and cloud backup capability
- Document template system with 60+ placeholders
- Basic document listing by client and matter

**Gaps**:
- No integration with client onboarding wizard
- No tracking of required vs uploaded documents
- No service-based document requirements
- Limited document organization on client detail page
- Portal documents page needs better organization

### Proposed Solution

1. **Optional Document Upload Step** in onboarding wizard (Step 7)
2. **Service-Based Requirement Tracking** via new `clientServiceSelection` table
3. **Post-Onboarding Collection Workflow** for missing documents
4. **Enhanced Document Display** with service grouping and fulfillment progress
5. **Client Documents Tab** on staff-side client detail page
6. **Matter-Linked Document Views** on both staff and portal sides

---

## Goals & Objectives

### Primary Goals

1. **Streamline Onboarding**: Allow document upload during client onboarding to reduce back-and-forth
2. **Track Requirements**: Know exactly which documents are required vs uploaded for each service
3. **Improve Organization**: Group and display documents by service, matter, and category
4. **Increase Completion**: Provide clear progress indicators to encourage document submission
5. **Enhance Accessibility**: Make documents easily findable from client detail, matters, and portal

### Success Criteria

- ✅ 50%+ of clients upload at least 1 document during onboarding within 3 months
- ✅ Staff can see document fulfillment progress at a glance
- ✅ Average time to collect all required documents decreases by 30%
- ✅ Document retrieval time decreases (fewer "where is X document?" questions)
- ✅ Client satisfaction with document process increases

---

## User Stories

### Staff User Stories

**US-1: Document Upload During Onboarding**
> As a **staff member**, I want to **upload documents during client onboarding**, so that **I can complete the full client setup in one session**.

**Acceptance Criteria**:
- When I reach Step 7 of onboarding, I see a list of required documents based on selected services
- I can drag-and-drop or click to upload multiple files
- I can categorize each upload and add descriptions
- I can skip this step and return later
- Uploaded documents are automatically linked to the client and their service selections

**US-2: View Document Fulfillment Progress**
> As a **staff member**, I want to **see which required documents are missing for a client**, so that **I know what to request from them**.

**Acceptance Criteria**:
- On client detail page, I see a progress bar showing "5 of 12 documents uploaded"
- I can view requirements grouped by service (Immigration: 3/5, Tax: 2/7)
- Missing documents are highlighted in red
- I can click "Collect Documents" to start collection workflow

**US-3: Post-Onboarding Document Collection**
> As a **staff member**, I want to **systematically collect missing documents after onboarding**, so that **I can ensure compliance and service delivery**.

**Acceptance Criteria**:
- I can navigate to "Collect Documents" page for a client
- I see service-grouped upload zones for each missing document
- I can upload directly or request from client via portal
- Progress updates automatically as documents are uploaded
- I receive notifications when all documents for a service are complete

**US-4: Organize Documents by Service**
> As a **staff member**, I want to **view client documents grouped by service**, so that **I can quickly find documents related to a specific matter**.

**Acceptance Criteria**:
- On client documents tab, I can toggle between "By Service", "All", and "Expiring" views
- Service groups show requirements vs uploads (e.g., "Immigration: 5/5 ✓")
- I can expand/collapse each service group
- Documents are color-coded by status (complete, missing, expiring)

**US-5: Track Document Expiration**
> As a **staff member**, I want to **see which documents are expiring soon**, so that **I can proactively request renewals**.

**Acceptance Criteria**:
- Documents tab shows "Expiring Soon" view
- Expiring documents (30 days) are highlighted with warning badges
- I can filter by expiration timeframe (7 days, 30 days, 90 days)
- Automated reminders are sent for documents expiring in 14 days

### Client User Stories

**US-6: View My Documents**
> As a **client**, I want to **see all my documents in the portal**, so that **I know what has been uploaded**.

**Acceptance Criteria**:
- Portal documents page shows all my documents
- I can group by Matter, Category, or All
- I can see document status (Approved, Pending Review, etc.)
- I can download documents easily

**US-7: Upload Documents via Portal**
> As a **client**, I want to **upload documents through the portal**, so that **I don't have to email or visit the office**.

**Acceptance Criteria**:
- Portal shows which documents are required
- I can upload directly from the portal
- I receive confirmation when upload succeeds
- Staff are notified of new uploads

---

## Technical Requirements

### Functional Requirements

**FR-1: Service Selection Persistence**
- Selected services from onboarding wizard must be persisted to database
- Each service selection must include document requirements from service catalog
- Service selections must support lifecycle states (INTERESTED → ACTIVE → COMPLETED)

**FR-2: Document Requirement Tracking**
- System must derive required documents from selected services
- Must track which required documents have been uploaded
- Must calculate fulfillment percentage (uploaded / required)

**FR-3: Wizard Integration**
- Step 7 must be added to onboarding wizard (total 7 steps)
- Step must be optional (skip button prominent)
- Uploaded documents must be linked to service requirements
- Wizard localStorage must persist document uploads

**FR-4: Document Organization**
- Documents must be viewable by Service, Category, Matter, and All
- Expiring documents must be filterable (30, 60, 90 days)
- Document counts and fulfillment stats must be displayed

**FR-5: Validation Rules**
- File size limit: 10MB per file
- Supported formats: PDF, DOCX, DOC, JPG, PNG, GIF, XLSX, XLS, TXT
- Required metadata: category, description (min 10 chars)
- Document names must be unique per client

### Non-Functional Requirements

**NFR-1: Performance**
- Document upload must complete within 5 seconds for 10MB files
- Fulfillment progress calculation must complete in <500ms
- Document list must load in <1 second for clients with 100+ documents

**NFR-2: Usability**
- Document upload UI must support drag-and-drop
- Progress indicators must be visible during upload
- Error messages must be clear and actionable
- Mobile-responsive for portal upload

**NFR-3: Security**
- Document access must be scoped by client ID
- Staff must only see documents for their assigned businesses (GCMC/KAJ)
- Download URLs must be signed and expire after 15 minutes
- All uploads must be virus-scanned (future enhancement)

**NFR-4: Reliability**
- Failed uploads must be resumable
- System must handle concurrent uploads gracefully
- Database transactions must ensure consistency

---

## Database Schema Changes

### New Table: `clientServiceSelection`

**Purpose**: Track services selected during onboarding with document requirements and upload status.

**Location**: `/packages/db/src/schema/clients.ts`

```typescript
export const clientServiceSelection = pgTable("client_service_selection", {
  // Primary Key
  id: uuid("id").defaultRandom().primaryKey(),

  // Foreign Keys
  clientId: uuid("client_id")
    .notNull()
    .references(() => client.id, { onDelete: "cascade" }),

  // Service Information
  business: businessEnum("business").notNull(), // GCMC or KAJ
  serviceCode: text("service_code").notNull(), // e.g., "GCMC_TRAINING_HR"
  serviceName: text("service_name").notNull(),

  // Document Requirements
  requiredDocuments: jsonb("required_documents").$type<string[]>().default([]),
  // Array of document names: ["TIN Certificate", "National ID", "Passport"]

  uploadedDocuments: jsonb("uploaded_documents")
    .$type<{
      documentId: string;
      fileName: string;
      uploadedAt: string;
      requirementName: string;
    }[]>()
    .default([]),

  // Lifecycle
  status: text("status", {
    enum: ["INTERESTED", "ACTIVE", "COMPLETED", "INACTIVE"],
  })
    .notNull()
    .default("INTERESTED"),

  // Timestamps
  selectedAt: timestamp("selected_at").defaultNow().notNull(),
  activatedAt: timestamp("activated_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const clientServiceSelectionRelations = relations(
  clientServiceSelection,
  ({ one }) => ({
    client: one(client, {
      fields: [clientServiceSelection.clientId],
      references: [client.id],
    }),
  })
);

// Indexes
CREATE INDEX idx_client_service_selection_client_id ON client_service_selection(client_id);
CREATE INDEX idx_client_service_selection_status ON client_service_selection(status);
CREATE INDEX idx_client_service_selection_business ON client_service_selection(business);
```

### Migration Strategy

1. **Generate Migration**: `bun run db:generate`
2. **Review SQL**: Check generated migration for correctness
3. **Run Migration**: `bun run db:migrate`
4. **Verify**: Query table to ensure structure is correct

**No data migration needed** - this is a new feature with no existing data.

---

## API Endpoints

### Client Services Router

**New File**: `/packages/api/src/routers/client-services.ts`

```typescript
import { z } from "zod";
import { adminProcedure, publicProcedure, staffProcedure } from "../procedures";
import { router } from "../trpc";

export const clientServicesRouter = router({
  // Save service selections from wizard
  saveSelections: staffProcedure
    .input(
      z.object({
        clientId: z.string().uuid(),
        gcmcServices: z.array(z.string()),
        kajServices: z.array(z.string()),
      })
    )
    .mutation(async ({ input, context }) => {
      const { clientId, gcmcServices, kajServices } = input;
      const { db, user } = context;

      // Fetch service definitions from serviceCatalog
      const allServiceCodes = [...gcmcServices, ...kajServices];
      const services = await db.query.serviceCatalog.findMany({
        where: (table, { inArray }) =>
          inArray(table.code, allServiceCodes),
      });

      // Create clientServiceSelection records
      const selections = [];
      for (const serviceCode of allServiceCodes) {
        const service = services.find((s) => s.code === serviceCode);
        if (!service) continue;

        const business = gcmcServices.includes(serviceCode) ? "GCMC" : "KAJ";

        const selection = await db
          .insert(clientServiceSelection)
          .values({
            clientId,
            business,
            serviceCode,
            serviceName: service.name,
            requiredDocuments: service.documentRequirements || [],
            status: "INTERESTED",
          })
          .returning();

        selections.push(selection[0]);
      }

      return selections;
    }),

  // Get all service selections for a client
  getByClient: staffProcedure
    .input(z.object({ clientId: z.string().uuid() }))
    .query(async ({ input, context }) => {
      const { clientId } = input;
      const { db } = context;

      const selections = await db.query.clientServiceSelection.findMany({
        where: (table, { eq }) => eq(table.clientId, clientId),
        orderBy: (table, { desc }) => [desc(table.selectedAt)],
      });

      // Calculate fulfillment percentage for each
      return selections.map((sel) => ({
        ...sel,
        requiredCount: sel.requiredDocuments.length,
        uploadedCount: sel.uploadedDocuments.length,
        fulfillmentPercentage:
          sel.requiredDocuments.length > 0
            ? Math.round(
                (sel.uploadedDocuments.length / sel.requiredDocuments.length) *
                  100
              )
            : 100,
      }));
    }),

  // Update service status
  updateStatus: staffProcedure
    .input(
      z.object({
        selectionId: z.string().uuid(),
        status: z.enum(["INTERESTED", "ACTIVE", "COMPLETED", "INACTIVE"]),
      })
    )
    .mutation(async ({ input, context }) => {
      const { selectionId, status } = input;
      const { db } = context;

      const updates: any = { status, updatedAt: new Date() };

      if (status === "ACTIVE" && !selection.activatedAt) {
        updates.activatedAt = new Date();
      }
      if (status === "COMPLETED" && !selection.completedAt) {
        updates.completedAt = new Date();
      }

      return db
        .update(clientServiceSelection)
        .set(updates)
        .where(eq(clientServiceSelection.id, selectionId))
        .returning();
    }),

  // Link uploaded document to service requirement
  linkDocument: staffProcedure
    .input(
      z.object({
        selectionId: z.string().uuid(),
        documentId: z.string().uuid(),
        requirementName: z.string(),
      })
    )
    .mutation(async ({ input, context }) => {
      const { selectionId, documentId, requirementName } = input;
      const { db } = context;

      // Get current selection
      const selection = await db.query.clientServiceSelection.findFirst({
        where: (table, { eq }) => eq(table.id, selectionId),
      });

      if (!selection) {
        throw new Error("Service selection not found");
      }

      // Get document details
      const document = await db.query.document.findFirst({
        where: (table, { eq }) => eq(table.id, documentId),
      });

      if (!document) {
        throw new Error("Document not found");
      }

      // Add to uploadedDocuments array
      const uploaded = selection.uploadedDocuments || [];
      uploaded.push({
        documentId: document.id,
        fileName: document.originalName,
        uploadedAt: new Date().toISOString(),
        requirementName,
      });

      return db
        .update(clientServiceSelection)
        .set({
          uploadedDocuments: uploaded,
          updatedAt: new Date(),
        })
        .where(eq(clientServiceSelection.id, selectionId))
        .returning();
    }),

  // Get document fulfillment progress
  getFulfillmentProgress: staffProcedure
    .input(z.object({ clientId: z.string().uuid() }))
    .query(async ({ input, context }) => {
      const { clientId } = input;
      const { db } = context;

      const selections = await db.query.clientServiceSelection.findMany({
        where: (table, { eq }) => eq(table.clientId, clientId),
      });

      let totalRequired = 0;
      let totalUploaded = 0;
      const byService: any[] = [];

      for (const sel of selections) {
        const required = sel.requiredDocuments.length;
        const uploaded = sel.uploadedDocuments.length;
        totalRequired += required;
        totalUploaded += uploaded;

        byService.push({
          selectionId: sel.id,
          serviceName: sel.serviceName,
          business: sel.business,
          required,
          uploaded,
          percentage: required > 0 ? Math.round((uploaded / required) * 100) : 100,
          status: sel.status,
        });
      }

      return {
        total: totalRequired,
        uploaded: totalUploaded,
        percentage: totalRequired > 0 ? Math.round((totalUploaded / totalRequired) * 100) : 0,
        byService,
      };
    }),
});
```

### Document Router Enhancements

**File**: `/packages/api/src/routers/documents.ts`

**Add to existing router**:

```typescript
// Get document fulfillment status by service
getFulfillmentStatus: staffProcedure
  .input(z.object({ clientId: z.string().uuid() }))
  .query(async ({ input, context }) => {
    const { clientId } = input;
    const { db } = context;

    // Get service selections with requirements
    const selections = await db.query.clientServiceSelection.findMany({
      where: (table, { eq }) => eq(table.clientId, clientId),
    });

    // Get all client documents
    const documents = await db.query.document.findMany({
      where: (table, { eq, and }) =>
        and(
          eq(table.clientId, clientId),
          eq(table.status, "ACTIVE")
        ),
    });

    // Build fulfillment map
    return selections.map((sel) => ({
      selectionId: sel.id,
      serviceName: sel.serviceName,
      business: sel.business,
      requiredDocuments: sel.requiredDocuments,
      uploadedDocuments: sel.uploadedDocuments,
      missingDocuments: sel.requiredDocuments.filter(
        (req) => !sel.uploadedDocuments.some((up) => up.requirementName === req)
      ),
      allDocuments: documents.filter((doc) =>
        sel.uploadedDocuments.some((up) => up.documentId === doc.id)
      ),
    }));
  }),
```

---

## UI/UX Design

### 1. Onboarding Wizard - Step 7: Documents (Optional)

**Location**: `/apps/web/src/components/wizards/client-onboarding/step-documents.tsx`

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ Step 7: Upload Documents (Optional)                     │
│ Upload required documents based on selected services    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Document Upload Progress                                │
│ ████████░░░░░░░░░░░░ 8 of 12 documents uploaded (67%)   │
│                                                          │
│ ┌─ Immigration Services (3 of 5 documents) ───────────┐ │
│ │ ✅ Valid Passport (all pages)                        │ │
│ │ ✅ Passport Photos (4 copies)                        │ │
│ │ ✅ Police Clearance Certificate                      │ │
│ │ ⚠️  Medical Certificate [Upload]                     │ │
│ │ ⚠️  Employment Contract  [Upload]                    │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─ Tax Services (5 of 7 documents) ─────────────────┐ │
│ │ ✅ TIN Certificate                                   │ │
│ │ ✅ National ID                                       │ │
│ │ ✅ Proof of Address                                  │ │
│ │ ✅ Bank Statements (3 months)                        │ │
│ │ ✅ Previous Tax Returns                              │ │
│ │ ⚠️  Income Receipts      [Upload]                    │ │
│ │ ⚠️  Expense Receipts     [Upload]                    │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ℹ️  You can skip this step and upload documents later  │
│    from the client detail page.                         │
│                                                          │
│ [< Previous]  [Skip for Now]  [Next >]  [Save & Finish] │
└─────────────────────────────────────────────────────────┘
```

**Upload Zone Interaction**:
```
┌─ Click or drag files here ───────────────┐
│                                           │
│         📁 Drop files here                │
│            or click to browse             │
│                                           │
│   Accepted: PDF, DOCX, JPG, PNG          │
│   Max size: 10MB per file                │
│                                           │
└───────────────────────────────────────────┘

After upload:
┌─ passport.pdf ──────────────────── [×] ──┐
│ Category: Immigration                     │
│ Description: Passport (all pages)         │
│ Linked to: Work Permit requirement        │
└───────────────────────────────────────────┘
```

### 2. Post-Onboarding Document Collection

**Location**: `/apps/web/src/routes/app/clients/$client-id/documents/collect.tsx`

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ Collect Required Documents for [Client Name]            │
│ 8 of 12 documents uploaded (67%)                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Overall Progress                                         │
│ ████████████████░░░░░░░░░░░░ 67%                        │
│                                                          │
│ ┏━ Immigration Services ━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ Status: 3 of 5 documents (60%)                      ┃ │
│ ┃ ████████████░░░░░░░░░░ 60%                          ┃ │
│ ┃                                                      ┃ │
│ ┃ Missing Documents:                                  ┃ │
│ ┃ • Medical Certificate        [Upload] [Request]    ┃ │
│ ┃ • Employment Contract         [Upload] [Request]    ┃ │
│ ┃                                                      ┃ │
│ ┃ Uploaded Documents:                                 ┃ │
│ ┃ ✅ Valid Passport (all pages)   [View] [Remove]    ┃ │
│ ┃ ✅ Passport Photos (4 copies)   [View] [Remove]    ┃ │
│ ┃ ✅ Police Clearance Certificate [View] [Remove]    ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                                          │
│ ┏━ Tax Services ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ Status: 5 of 7 documents (71%)                      ┃ │
│ ┃ ██████████████░░░░░░░░ 71%                          ┃ │
│ ┃                                                      ┃ │
│ ┃ Missing Documents:                                  ┃ │
│ ┃ • Income Receipts            [Upload] [Request]    ┃ │
│ ┃ • Expense Receipts           [Upload] [Request]    ┃ │
│ ┃                                                      ┃ │
│ ┃ Uploaded Documents: (collapsed)                     ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                                          │
│ [Mark All Complete] [Send Reminder Email]               │
└─────────────────────────────────────────────────────────┘
```

### 3. Client Detail - Documents Tab

**Location**: `/apps/web/src/routes/app/clients/$client-id.tsx` → Documents Tab

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ [Overview] [Matters] [Documents] [Activity]             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Document Fulfillment                                     │
│ ████████████████░░░░░░░░░░░░ 8 of 12 uploaded (67%)    │
│                                                          │
│ [By Service ▼] [All Documents] [Expiring Soon]          │
│                                                          │
│ [Search documents...]                    [Upload]       │
│                                                          │
│ ┌─ Immigration Services (3/5) ───────────────────────┐  │
│ │ ✅ passport.pdf         Immigration    2024-11-15  │  │
│ │ ✅ photos.jpg           Immigration    2024-11-15  │  │
│ │ ✅ police-clearance.pdf Immigration    2024-11-10  │  │
│ │ ⚠️  Medical Certificate (missing)                   │  │
│ │ ⚠️  Employment Contract (missing)                   │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                          │
│ ┌─ Tax Services (5/7) ─────────────────────────────┐  │
│ │ ✅ tin-certificate.pdf  Tax          2024-11-01  │  │
│ │ ✅ national-id.pdf      Identity     2024-11-01  │  │
│ │ ✅ proof-of-address.pdf Identity     2024-11-01  │  │
│ │ ✅ bank-statements.pdf  Financial    2024-11-05  │  │
│ │ ✅ previous-returns.pdf Tax          2024-11-05  │  │
│ │ ⚠️  Income Receipts (missing)                       │  │
│ │ ⚠️  Expense Receipts (missing)                      │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                          │
│ [Collect Missing Documents →]                           │
└─────────────────────────────────────────────────────────┘
```

---

## Workflows

### Workflow 1: Document Upload During Onboarding

```
┌──────────┐
│  Staff   │
│  starts  │
│onboarding│
└────┬─────┘
     │
     ▼
┌──────────────────┐
│ Step 1-6 complete│
│ (client info,    │
│  services, etc.) │
└────┬─────────────┘
     │
     ▼
┌────────────────────────────────┐
│ Step 7: Documents (Optional)    │
│ • Show required docs based on  │
│   selected services            │
│ • Allow drag-and-drop upload   │
│ • Link uploads to requirements │
│ • OR skip and do later         │
└────┬───────────────────────────┘
     │
     ├─ [Skip] ─────────────────┐
     │                           ▼
     │                    ┌──────────────┐
     │                    │ Client saved │
     │                    │ No docs yet  │
     │                    └──────────────┘
     │
     ├─ [Upload] ───────────────┐
     │                           ▼
     │                    ┌──────────────────┐
     │                    │ For each upload: │
     │                    │ 1. Create doc    │
     │                    │ 2. Upload file   │
     │                    │ 3. Link to req   │
     │                    └─────┬────────────┘
     ▼                          │
┌──────────────────┐            │
│ Save client      │◄───────────┘
│ Save services    │
│ (with doc links) │
└────┬─────────────┘
     │
     ▼
┌───────────────────┐
│ Redirect to       │
│ client detail page│
└───────────────────┘
```

### Workflow 2: Post-Onboarding Document Collection

```
┌──────────┐
│  Staff   │
│ navigates│
│ to client│
└────┬─────┘
     │
     ▼
┌──────────────────┐
│ Client detail    │
│ Documents tab    │
│ shows progress:  │
│ "8 of 12 docs"   │
└────┬─────────────┘
     │
     ▼
┌────────────────────────────────┐
│ Click "Collect Documents"      │
└────┬───────────────────────────┘
     │
     ▼
┌────────────────────────────────┐
│ Collection page shows:         │
│ • Service-grouped missing docs │
│ • Upload zones for each        │
│ • Progress per service         │
└────┬───────────────────────────┘
     │
     ├─ [Upload Document] ───────┐
     │                           ▼
     │                    ┌──────────────────┐
     │                    │ 1. Select file   │
     │                    │ 2. Set category  │
     │                    │ 3. Add desc      │
     │                    │ 4. Link to req   │
     │                    └─────┬────────────┘
     │                          │
     │                          ▼
     │                    ┌──────────────────┐
     │                    │ API: prepareUpload│
     │                    │ → POST /api/upload│
     │                    │ → linkDocument    │
     │                    └─────┬────────────┘
     │                          │
     │◄─────────────────────────┘
     │ (Progress updates)
     │
     ├─ [Request from Client] ──┐
     │                           ▼
     │                    ┌──────────────────┐
     │                    │ Send portal      │
     │                    │ notification     │
     │                    │ Client uploads   │
     │                    │ via portal       │
     │                    └──────────────────┘
     │
     ▼
┌────────────────────────────────┐
│ When all docs uploaded:        │
│ • Service status → ACTIVE      │
│ • Progress shows 100%          │
│ • Staff can proceed with work  │
└────────────────────────────────┘
```

### Workflow 3: Client Portal Document Upload

```
┌──────────┐
│  Client  │
│  logs in │
│ to portal│
└────┬─────┘
     │
     ▼
┌────────────────────────────────┐
│ Portal Dashboard shows:        │
│ "3 documents required"         │
│ [Upload Documents →]           │
└────┬───────────────────────────┘
     │
     ▼
┌────────────────────────────────┐
│ Documents page shows:          │
│ • Required documents (red)     │
│ • Uploaded documents (green)   │
│ • [Upload] button              │
└────┬───────────────────────────┘
     │
     ▼
┌────────────────────────────────┐
│ Upload dialog:                 │
│ 1. Select file                 │
│ 2. Choose category             │
│ 3. Add description             │
│ 4. Submit                      │
└────┬───────────────────────────┘
     │
     ▼
┌────────────────────────────────┐
│ API processes upload:          │
│ • Create document record       │
│ • Upload to storage            │
│ • Notify staff                 │
│ • Update fulfillment progress  │
└────┬───────────────────────────┘
     │
     ▼
┌────────────────────────────────┐
│ Success notification:          │
│ "Document uploaded! Staff will │
│  review it shortly."           │
└────────────────────────────────┘
```

---

## Security Considerations

### Access Control

**SC-1: Client-Scoped Access**
- Documents must only be accessible to:
  - The client who owns them
  - Staff assigned to that client
  - Staff with same business assignment (GCMC/KAJ)
- API must verify clientId in all document queries

**SC-2: Business-Based Filtering**
- Staff with GCMC role can only see GCMC client documents
- Staff with KAJ role can only see KAJ client documents
- Owners and managers can see all

**SC-3: Portal Access**
- Portal users can only access their own documents
- No cross-client document access possible
- Download URLs must be client-verified

### File Security

**SC-4: Upload Validation**
- File size: Max 10MB
- File types: Whitelist only (PDF, DOCX, JPG, PNG, GIF, XLSX, XLS, TXT)
- MIME type validation (not just extension)
- Future: Virus scanning with ClamAV or similar

**SC-5: Storage Security**
- Files stored outside web root
- Filenames UUID-based (not original names)
- No direct file system access
- Signed download URLs (15 min expiry)

**SC-6: Transmission Security**
- All uploads over HTTPS
- Signed URLs for downloads
- No file contents in API responses
- Stream files, don't load into memory

### Audit Logging

**SC-7: Document Actions Logged**
- All uploads (who, when, client, file)
- All downloads (who, when, document)
- All deletions/archives
- Service-document links

**SC-8: Activity Tracking**
- Portal document uploads tracked
- Staff document actions tracked
- Failed upload attempts logged

---

## Testing Strategy

### Unit Tests

**UT-1: Service Selection Persistence**
```typescript
describe("clientServicesRouter.saveSelections", () => {
  it("creates service selections from wizard data", async () => {
    const result = await caller.saveSelections({
      clientId: "client-123",
      gcmcServices: ["GCMC_TRAINING_HR", "GCMC_PARALEGAL_AFFIDAVIT"],
      kajServices: ["KAJ_TAX_INDIVIDUAL"],
    });

    expect(result).toHaveLength(3);
    expect(result[0].business).toBe("GCMC");
    expect(result[0].requiredDocuments).toBeArrayOfSize(5);
  });
});
```

**UT-2: Document Fulfillment Calculation**
```typescript
describe("getFulfillmentProgress", () => {
  it("calculates progress correctly", async () => {
    const result = await caller.getFulfillmentProgress({
      clientId: "client-123",
    });

    expect(result.total).toBe(12);
    expect(result.uploaded).toBe(8);
    expect(result.percentage).toBe(67);
    expect(result.byService).toHaveLength(2);
  });
});
```

### Integration Tests

**IT-1: Wizard to Database Flow**
```typescript
it("persists services and documents from wizard", async () => {
  // 1. Create client via wizard
  const client = await createClientMutation({
    ...clientData,
    gcmcServices: ["GCMC_IMMIGRATION_WORK_PERMIT"],
    documents: {
      uploads: [
        { file: passportFile, category: "IMMIGRATION", description: "Passport" },
      ],
    },
  });

  // 2. Verify service selection created
  const selections = await db.query.clientServiceSelection.findMany({
    where: eq(clientServiceSelection.clientId, client.id),
  });
  expect(selections).toHaveLength(1);

  // 3. Verify document uploaded and linked
  const docs = await db.query.document.findMany({
    where: eq(document.clientId, client.id),
  });
  expect(docs).toHaveLength(1);
  expect(selections[0].uploadedDocuments).toContain(docs[0].id);
});
```

### E2E Tests (Playwright)

**E2E-1: Complete Onboarding with Documents**
```typescript
test("staff can onboard client with documents", async ({ page }) => {
  await page.goto("/app/clients/onboard");

  // Step 1-6: Fill client info
  await fillOnboardingSteps(page);

  // Step 7: Upload documents
  await page.waitForSelector("text=Upload Documents");
  await page.setInputFiles('input[type="file"]', "test-files/passport.pdf");
  await page.selectOption('select[name="category"]', "IMMIGRATION");
  await page.fill('textarea[name="description"]', "Passport all pages");

  await page.click("text=Save & Finish");

  // Verify redirect to client detail
  await page.waitForURL(/\/app\/clients\/[a-z0-9-]+/);

  // Verify document uploaded
  await page.click("text=Documents");
  await expect(page.locator("text=passport.pdf")).toBeVisible();
  await expect(page.locator("text=1 of 5 documents")).toBeVisible();
});
```

**E2E-2: Post-Onboarding Collection**
```typescript
test("staff can collect missing documents", async ({ page, context }) => {
  // Setup: Client with missing documents
  const client = await createClientWithMissingDocs();

  await page.goto(`/app/clients/${client.id}`);
  await page.click("text=Documents");
  await page.click("text=Collect Documents");

  // Should show missing docs
  await expect(page.locator("text=Immigration: 3 of 5")).toBeVisible();
  await expect(page.locator("text=Medical Certificate (missing)")).toBeVisible();

  // Upload missing document
  await page.click("text=Medical Certificate >> button:has-text('Upload')");
  await page.setInputFiles('input[type="file"]', "test-files/medical.pdf");
  await page.click("text=Upload");

  // Verify progress updated
  await expect(page.locator("text=Immigration: 4 of 5")).toBeVisible();
});
```

---

## Success Metrics

### Key Performance Indicators

**KPI-1: Onboarding Efficiency**
- **Target**: 50% of clients upload ≥1 document during onboarding within 3 months
- **Measurement**: `COUNT(DISTINCT clientId FROM clientServiceSelection WHERE uploadedDocuments.length > 0) / COUNT(DISTINCT clientId FROM client)`

**KPI-2: Document Collection Time**
- **Target**: Average time to collect all required documents decreases by 30%
- **Baseline**: 14 days (current average via manual process)
- **Target**: 10 days
- **Measurement**: `AVG(completedAt - selectedAt) FROM clientServiceSelection WHERE status = 'COMPLETED'`

**KPI-3: Document Fulfillment Rate**
- **Target**: 80% of clients have all required documents within 30 days
- **Measurement**: `COUNT(clients with 100% fulfillment) / COUNT(total clients with services)`

**KPI-4: Staff Efficiency**
- **Target**: 40% reduction in "where is X document?" inquiries
- **Measurement**: Track support tickets/emails mentioning documents

**KPI-5: Client Satisfaction**
- **Target**: 4.5/5 satisfaction rating on document upload process
- **Measurement**: Post-interaction survey

### Analytics Dashboard

Track the following metrics weekly:

1. **Upload Rates**:
   - Documents uploaded per week
   - % uploaded during onboarding vs post
   - Average documents per client

2. **Fulfillment Tracking**:
   - Clients by fulfillment % (0-25%, 26-50%, 51-75%, 76-100%)
   - Most commonly missing documents
   - Average time to 100% fulfillment

3. **Portal Usage**:
   - % clients who upload via portal
   - Portal upload success rate
   - Most active upload times

---

## Open Questions

### Technical Questions

**OQ-1: Resumable Uploads?**
- Should we implement resumable uploads for large files?
- **Decision needed**: Start without, add if users report issues

**OQ-2: Virus Scanning?**
- When should we add virus scanning?
- **Options**: Phase 3, use ClamAV or external service

**OQ-3: OCR for PDFs?**
- Should we extract text from PDFs for search?
- **Decision**: Phase 3 enhancement

### Business Questions

**OQ-4: Document Expiration Notifications?**
- How far in advance should we notify? (14 days, 30 days?)
- Who gets notified? (Staff, client, both?)
- **Decision needed**: Survey staff preferences

**OQ-5: Required vs Optional Documents?**
- Should some documents be marked as "required" vs "optional"?
- **Decision**: All documents from service catalog are required, but can mark individual docs as optional in future

**OQ-6: Document Approval Workflow?**
- Should staff approve/reject uploaded documents?
- **Decision**: Phase 3 - add approval states (PENDING, APPROVED, REJECTED)

### UX Questions

**OQ-7: Mobile Upload?**
- How critical is mobile document upload in portal?
- **Decision**: Phase 2 - ensure mobile-responsive, test with real clients

**OQ-8: Bulk Upload?**
- Should we support uploading multiple files at once?
- **Decision**: Yes - already supported via drag-and-drop multiple files

**OQ-9: Document Templates/Examples?**
- Should we show example documents or templates?
- **Decision**: Phase 3 - link to knowledge base forms

---

## Implementation Checklist

- [ ] Database schema created and migrated
- [ ] API router implemented with all endpoints
- [ ] Wizard Step 7 component created
- [ ] Post-onboarding collection page created
- [ ] Client documents tab added to client detail
- [ ] Document fulfillment progress component
- [ ] Portal documents page enhanced
- [ ] Matter-linked document views added
- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests written
- [ ] E2E tests written (critical paths)
- [ ] Security audit completed
- [ ] Performance tested (10MB uploads <5s)
- [ ] Mobile responsiveness verified
- [ ] Documentation updated
- [ ] Staff training materials created
- [ ] Deployment to staging
- [ ] User acceptance testing
- [ ] Production deployment
- [ ] Analytics dashboard configured
- [ ] Monitor KPIs for 30 days

---

## References

- [CLAUDE.md](/CLAUDE.md) - Project coding standards and guidelines
- [Phase 1 Overview](/specs/phase-1/00-overview.md) - Completed features
- [Phase 2 Overview](/specs/phase-2/00-overview.md) - Current phase goals
- [Document Requirements](/specs/document-requirements.md) - Service-specific document requirements
- [GCMC Services](/specs/business-rules/gcmc-services.md) - GCMC service catalog
- [KAJ Services](/specs/business-rules/kaj-services.md) - KAJ service catalog
- [Wizard System Spec](/specs/phase-2/08-wizard-system.md) - Wizard architecture

---

**Document Version**: 1.0
**Next Review**: After implementation
**Owner**: Development Team
**Stakeholders**: Staff, Clients, Management
