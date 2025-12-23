# Client Service Tracking Specification

**Status**: Sprint 1 Complete (Database & API) - Wizard Integration Pending
**Priority**: MEDIUM
**Phase**: Phase 2
**Created**: 2025-12-12
**Last Updated**: 2025-12-12

## Implementation Status

### ✅ Sprint 1: Database & API (COMPLETED - December 12, 2024)
- `clientServiceSelection` table created (16 columns, 4 indexes)
- Lifecycle status tracking (INTERESTED → ACTIVE → COMPLETED → INACTIVE)
- JSONB arrays for required/uploaded documents
- 8 API endpoints (saveSelections, getFulfillmentProgress, linkDocument, etc.)
- Document fulfillment percentage calculation
- Business-scoped filtering (GCMC/KAJ)

### ⏳ Sprint 2: Wizard Integration (PENDING)
- Update wizard types for service selection
- Modify onboarding mutation to call saveSelections
- Post-onboarding document collection page

---

## Overview

Client Service Tracking persists service selections from the onboarding wizard, tracks document requirements, and manages the lifecycle of client services from initial interest through completion. This system bridges the gap between service selection during onboarding and actual service delivery.

### Purpose

- **Persist Service Selections**: Save services chosen during wizard to database
- **Track Document Requirements**: Link each service to required documents
- **Monitor Progress**: Track service lifecycle (INTERESTED → ACTIVE → COMPLETED)
- **Enable Reporting**: Analytics on popular services, completion rates, bottlenecks
- **Support Workflows**: Trigger actions based on service status changes

### Current State vs Proposed

**Current**: Services selected in wizard are displayed in review step but NOT saved to database. Only `businesses` array (GCMC/KAJ) is stored on client record.

**Proposed**: New `clientServiceSelection` table stores each service with requirements, uploaded documents, and lifecycle status. Full tracking from onboarding through completion.

---

## Goals & Objectives

1. **Data Persistence**: 100% of service selections saved (no data loss)
2. **Document Tracking**: Clear visibility into required vs uploaded documents per service
3. **Lifecycle Management**: Track services from interest through completion
4. **Business Intelligence**: Report on most popular services, average completion times
5. **Automation**: Trigger workflows (email reminders, document requests) based on service status

---

## User Stories

**CS-1: Save Services from Wizard**
> As a **staff member**, I want **services selected during onboarding to be saved automatically**, so that **I can track what the client needs**.

**CS-2: View Service Requirements**
> As a **staff member**, I want to **see which documents are required for each service**, so that **I know what to collect**.

**CS-3: Track Service Status**
> As a **staff member**, I want to **mark services as active when work begins**, so that **I can track progress**.

**CS-4: Report on Services**
> As a **manager**, I want to **see which services are most popular**, so that **I can allocate resources appropriately**.

---

## Technical Requirements

### Functional Requirements

**FR-1: Service Selection Persistence**
- Save each service code selected in wizard
- Fetch documentRequirements from serviceCatalog
- Initialize status as INTERESTED
- Associate with client ID

**FR-2: Document Linking**
- Track uploadedDocuments array for each service
- Link documents to specific requirements (e.g., "National ID" requirement)
- Calculate fulfillment percentage

**FR-3: Lifecycle States**
```
INTERESTED   → Service selected but not yet started
ACTIVE       → Client actively working with staff on this service
COMPLETED    → Service delivered successfully
INACTIVE     → Service no longer needed (client changed mind)
```

**FR-4: Synchronization**
- Service selections must sync with serviceCatalog table
- If service catalog changes, existing selections should flag for review
- Migration strategy for legacy clients

---

## Database Schema

### `clientServiceSelection` Table

**Location**: `/packages/db/src/schema/clients.ts`

```typescript
export const clientServiceSelection = pgTable("client_service_selection", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Foreign Keys
  clientId: uuid("client_id")
    .notNull()
    .references(() => client.id, { onDelete: "cascade" }),

  // Service Information
  business: businessEnum("business").notNull(), // GCMC or KAJ
  serviceCode: text("service_code").notNull(), // From serviceCatalog.code
  serviceName: text("service_name").notNull(),

  // Document Requirements
  requiredDocuments: jsonb("required_documents")
    .$type<string[]>()
    .default([]),

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
  inactivatedAt: timestamp("inactivated_at"),

  // Metadata
  notes: text("notes"),
  estimatedCompletionDate: date("estimated_completion_date"),

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
CREATE INDEX idx_client_service_selection_service_code ON client_service_selection(service_code);
```

---

## API Endpoints

### Client Services Router

**New File**: `/packages/api/src/routers/client-services.ts`

```typescript
export const clientServicesRouter = router({
  // Save service selections from wizard
  saveSelections: staffProcedure
    .input(z.object({
      clientId: z.string().uuid(),
      gcmcServices: z.array(z.string()),
      kajServices: z.array(z.string()),
    }))
    .mutation(async ({ input, context }) => {
      // Implementation in document-management-system.md spec
    }),

  // Get all service selections for a client
  getByClient: staffProcedure
    .input(z.object({ clientId: z.string().uuid() }))
    .query(async ({ input, context }) => {
      // Return selections with fulfillment percentages
    }),

  // Update service status
  updateStatus: staffProcedure
    .input(z.object({
      selectionId: z.string().uuid(),
      status: z.enum(["INTERESTED", "ACTIVE", "COMPLETED", "INACTIVE"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, context }) => {
      // Update status and set appropriate timestamp
    }),

  // Link document to service requirement
  linkDocument: staffProcedure
    .input(z.object({
      selectionId: z.string().uuid(),
      documentId: z.string().uuid(),
      requirementName: z.string(),
    }))
    .mutation(async ({ input, context }) => {
      // Add to uploadedDocuments array
    }),

  // Get fulfillment progress
  getFulfillmentProgress: staffProcedure
    .input(z.object({ clientId: z.string().uuid() }))
    .query(async ({ input, context }) => {
      // Calculate total and per-service fulfillment
    }),

  // Analytics: Popular services
  getPopularServices: adminProcedure
    .input(z.object({
      business: z.enum(["GCMC", "KAJ"]).optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ input, context }) => {
      // Aggregate by serviceCode, count occurrences
      // Return sorted by popularity
    }),

  // Analytics: Average completion time
  getCompletionMetrics: adminProcedure
    .input(z.object({
      serviceCode: z.string().optional(),
      business: z.enum(["GCMC", "KAJ"]).optional(),
    }))
    .query(async ({ input, context }) => {
      // Calculate avg time from selectedAt to completedAt
      // Group by service code
    }),
});
```

---

## Workflows

### Workflow 1: Save Services During Onboarding

```
┌──────────┐
│  Wizard  │
│  Step 5  │
│ Services │
└────┬─────┘
     │
     ▼
User selects:
- GCMC: Training (HR), Paralegal (Affidavit)
- KAJ: Tax (Individual)
     │
     ▼
┌────────────────────────────────┐
│ Step 7: Submit Wizard          │
│ onboardingMutation calls:      │
│ 1. clients.create()            │
│ 2. clientServices.saveSelections() │
└────┬───────────────────────────┘
     │
     ▼
┌────────────────────────────────┐
│ saveSelections logic:          │
│ 1. Fetch service definitions   │
│    from serviceCatalog         │
│ 2. Extract documentRequirements│
│ 3. Create 3 records in         │
│    clientServiceSelection:     │
│    - GCMC Training             │
│    - GCMC Paralegal            │
│    - KAJ Tax                   │
│ 4. Status = INTERESTED         │
└────┬───────────────────────────┘
     │
     ▼
┌────────────────────────────────┐
│ Client created with:           │
│ • 3 service selections saved   │
│ • Required documents identified│
│ • Ready for document collection│
└────────────────────────────────┘
```

### Workflow 2: Service Lifecycle Management

```
┌─────────────┐
│ INTERESTED  │ ← Service selected in wizard
└──────┬──────┘
       │
       │ Staff marks as active when
       │ client pays deposit / work begins
       ▼
┌─────────────┐
│   ACTIVE    │ ← Work in progress
└──────┬──────┘
       │
       ├─ All documents collected?
       ├─ Matter created for this service?
       ├─ Work completed?
       │
       ▼
┌─────────────┐
│  COMPLETED  │ ← Service delivered
└──────┬──────┘
       │
       ├─ Invoice sent
       ├─ Client satisfaction survey
       └─ Analytics recorded

Alternative:
INTERESTED → INACTIVE (Client cancels)
```

### Workflow 3: Document Collection Triggered by Service

```
┌──────────────────────────┐
│ Service: Work Permit     │
│ Status: INTERESTED       │
│ Required Docs: 5         │
│ Uploaded Docs: 0         │
└─────────┬────────────────┘
          │
          ▼
Staff clicks "Collect Documents"
          │
          ▼
┌──────────────────────────┐
│ Document Collection Page │
│ Shows:                   │
│ • Passport (missing)     │
│ • Photos (missing)       │
│ • Police Clearance (miss)│
│ • Medical Cert (missing) │
│ • Employment (missing)   │
└─────────┬────────────────┘
          │
          ├─ Upload Passport ─────┐
          │                       ▼
          │             Link to service via
          │             linkDocument()
          │                       │
          │◄──────────────────────┘
          │
          ├─ Upload Photos ────────┐
          │                       ▼
          │             Link to service
          │                       │
          │◄──────────────────────┘
          │
          ▼
┌──────────────────────────┐
│ Service: Work Permit     │
│ Status: INTERESTED       │
│ Required Docs: 5         │
│ Uploaded Docs: 2         │
│ Fulfillment: 40%         │
└──────────────────────────┘
```

---

## UI Components

### Service Selection Display (Client Detail)

```
┌─ Services ─────────────────────────────────────────────┐
│                                                         │
│ GCMC Services                                           │
│ ┌─────────────────────────────────────────────────────┐│
│ │ ✅ Training: HR Management (COMPLETED)              ││
│ │    Completed: Nov 15, 2024                          ││
│ │    Documents: 5/5 (100%)                            ││
│ │    [View Details]                                   ││
│ ├─────────────────────────────────────────────────────┤│
│ │ ⏳ Paralegal: Affidavit (ACTIVE)                    ││
│ │    Started: Nov 20, 2024                            ││
│ │    Documents: 3/4 (75%)                             ││
│ │    [Collect Docs] [Mark Complete]                   ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ KAJ Services                                            │
│ ┌─────────────────────────────────────────────────────┐│
│ │ 📋 Tax: Individual Return (INTERESTED)              ││
│ │    Selected: Nov 10, 2024                           ││
│ │    Documents: 0/7 (0%)                              ││
│ │    [Activate Service] [Collect Docs]                ││
│ └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## Analytics & Reporting

### Dashboard Metrics

**1. Service Popularity (Last 30 Days)**
```
GCMC:
- Training Services: 45 selections
- Paralegal Services: 32 selections
- Business Registration: 28 selections

KAJ:
- Individual Tax Returns: 67 selections
- Compliance Certificates: 41 selections
- NIS Services: 38 selections
```

**2. Average Completion Times**
```
Service                    Avg Time    Min    Max
Work Permit               42 days     28d    65d
Individual Tax Return     12 days     5d     21d
Company Incorporation     18 days     10d    35d
Training (HR Management)  3 days      2d     5d
```

**3. Service Status Distribution**
```
INTERESTED: 45 (30%)
ACTIVE:     78 (52%)
COMPLETED:  23 (15%)
INACTIVE:   4  (3%)
```

---

## Migration Strategy

### Legacy Clients (No Service Selections)

**Problem**: Clients onboarded before this feature have no service records.

**Solution**:
1. **Manual Backfill** (staff action):
   - Add "Manage Services" button on client detail
   - Staff selects applicable services
   - System creates clientServiceSelection records with `selectedAt` = today

2. **Inference from Matters**:
   - Analyze existing matter.serviceTypeId
   - Create clientServiceSelection based on active matters
   - Mark as ACTIVE (since work already in progress)

3. **Optional Backfill**:
   - Service selections only required for new workflows
   - Legacy clients continue working without service tracking
   - Gradually migrate as clients interact with system

---

## Security Considerations

- Service selections tied to client ID (access controlled)
- Business-scoped access (GCMC staff see GCMC services only)
- Audit log for status changes
- Cannot delete service selections (archive via INACTIVE status)

---

## Success Metrics

- **Data Completeness**: 100% of new clients have service selections saved
- **Document Collection**: 30% faster with service-based tracking
- **Reporting Accuracy**: Accurate service popularity and completion metrics
- **User Adoption**: 80% of staff use service status management features

---

**Version**: 1.0
**Next Review**: After implementation
**Related**: [Document Management System](./document-management-system.md), [Service Catalog Schema](/packages/db/src/schema/service-catalog.ts)
