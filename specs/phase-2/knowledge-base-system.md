# Knowledge Base System Specification

**Status**: Sprint 1 Complete (Database & API) - UI & Content Pending
**Priority**: HIGH
**Phase**: Phase 2
**Created**: 2025-12-12
**Last Updated**: 2025-12-12

## Implementation Status

### ✅ Sprint 1: Database & API (COMPLETED - December 12, 2024)
- Knowledge base schema with 2 tables (`knowledgeBaseItem`, `knowledgeBaseDownload`)
- 9 API endpoints (list, download, autoFill, create, update, delete)
- Multi-type support (AGENCY_FORM, LETTER_TEMPLATE, GUIDE, CHECKLIST)
- Access control with staff-only filtering
- Download tracking by user type

### ⏳ Sprint 3-4: UI & Content (PENDING)
- Staff KB browser interface
- Admin KB management page
- Client portal resources section
- Initial 45 KB items (forms, templates, guides)
- Auto-fill PDF generation integration

---

## Overview

The Knowledge Base System provides a centralized repository for Guyanese government agency forms, auto-fill document templates, letter templates, and help guides. It serves both staff (internal knowledge management) and clients (self-service resources) with appropriate access controls.

### Purpose

- **Centralize Forms**: Store all GRA, NIS, Immigration, and DCRA forms in one searchable location
- **Enable Auto-Fill**: Generate pre-filled government forms using client/matter data
- **Provide Templates**: Offer letter templates for common scenarios (engagement letters, support letters, etc.)
- **Support Users**: Provide guides for using the platform (staff procedures, client how-tos)
- **Track Usage**: Monitor which forms are most popular and identify gaps

### Current State vs Proposed

**Current**: No centralized knowledge base. Forms stored in file system, shared via email, or staff visit agency websites manually.

**Proposed**: Comprehensive KB with 45+ initial items, searchable interface, auto-fill capabilities, download tracking, and client-accessible resources section in portal.

---

## Goals & Objectives

1. **Reduce Search Time**: Staff find forms in <30 seconds vs 5-10 minutes currently
2. **Enable Auto-Fill**: 80% of government forms can be auto-filled from system data
3. **Improve Accuracy**: Pre-filled forms reduce data entry errors by 90%
4. **Support Self-Service**: Clients can download forms and guides independently
5. **Maintain Currency**: KB admin can update forms when agencies release new versions

---

## User Stories

### Staff Stories

**KB-1: Find Government Forms**
> As a **staff member**, I want to **quickly find the latest GRA tax form**, so that **I can complete client filings without searching online**.

**KB-2: Auto-Fill Client Data**
> As a **staff member**, I want to **generate a pre-filled work permit application**, so that **I save time on data entry and reduce errors**.

**KB-3: Access Letter Templates**
> As a **staff member**, I want to **generate an engagement letter with client details**, so that **I can send professional correspondence quickly**.

**KB-4: Browse by Category**
> As a **staff member**, I want to **browse all NIS forms**, so that **I can see what's available for a specific agency**.

### Client Stories

**KB-5: Download Required Forms**
> As a **client**, I want to **download forms I need from the portal**, so that **I can prepare documents before my appointment**.

**KB-6: Access Help Guides**
> As a **client**, I want to **view a guide on uploading documents**, so that **I can use the portal effectively**.

### Admin Stories

**KB-7: Add New Forms**
> As an **admin**, I want to **upload new government forms**, so that **the KB stays current with agency updates**.

**KB-8: Link to Templates**
> As an **admin**, I want to **link a form to a document template**, so that **staff can auto-fill it with client data**.

---

## Technical Requirements

### Functional Requirements

**FR-1: KB Item Types**
- AGENCY_FORM: Government forms (PDF downloads)
- LETTER_TEMPLATE: Business letter templates (auto-fill capable)
- GUIDE: Help documentation (markdown content)
- CHECKLIST: Process checklists (markdown content)

**FR-2: Categories**
- GRA (Guyana Revenue Authority)
- NIS (National Insurance Scheme)
- IMMIGRATION (Ministry of Home Affairs)
- DCRA (Deeds & Commercial Registries)
- GENERAL (Cross-agency or internal)
- TRAINING (GCMC specific)
- INTERNAL (Staff-only procedures)

**FR-3: Access Control**
- Staff-only items (internal procedures, advanced guides)
- Client-accessible items (public forms, basic guides)
- Business-specific items (GCMC only, KAJ only, or both)

**FR-4: Search & Discovery**
- Full-text search across title, description, tags
- Filter by type, category, business
- Featured items displayed prominently
- Recent downloads tracking

**FR-5: Auto-Fill Integration**
- Link KB items to existing document templates
- Auto-fill with client, matter, staff, and business data
- Preview before download
- Generate as PDF or DOCX

**FR-6: Download Tracking**
- Log every download (who, when, what)
- Analytics: most popular forms, download trends
- Client vs staff download tracking

---

## Database Schema

### `knowledgeBaseItem` Table

**Location**: `/packages/db/src/schema/knowledge-base.ts` (NEW)

```typescript
export const knowledgeBaseItem = pgTable("knowledge_base_item", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Classification
  type: text("type", { enum: ["AGENCY_FORM", "LETTER_TEMPLATE", "GUIDE", "CHECKLIST"] }).notNull(),
  category: text("category", {
    enum: ["GRA", "NIS", "IMMIGRATION", "DCRA", "GENERAL", "TRAINING", "INTERNAL"]
  }).notNull(),
  business: businessEnum("business"), // null = both businesses

  // Content
  title: text("title").notNull(),
  description: text("description").notNull(),
  shortDescription: text("short_description"),

  // File-based (for AGENCY_FORM)
  fileName: text("file_name"),
  storagePath: text("storage_path"),
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),

  // Content-based (for GUIDE, CHECKLIST)
  content: text("content"), // Markdown

  // Auto-fill
  supportsAutoFill: boolean("supports_auto_fill").default(false),
  templateId: uuid("template_id").references(() => documentTemplate.id),

  // Metadata
  relatedServices: text("related_services").array(), // Service codes
  requiredFor: text("required_for").array(), // Scenarios
  agencyUrl: text("agency_url"), // Official source
  governmentFees: text("government_fees"),

  // Access & Display
  isActive: boolean("is_active").default(true),
  isStaffOnly: boolean("is_staff_only").default(true),
  isFeatured: boolean("is_featured").default(false),
  sortOrder: integer("sort_order").default(0),

  // Audit
  createdById: uuid("created_by_id").notNull().references(() => user.id),
  lastUpdatedById: uuid("last_updated_by_id").references(() => user.id),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### `knowledgeBaseDownload` Table

```typescript
export const knowledgeBaseDownload = pgTable("knowledge_base_download", {
  id: uuid("id").defaultRandom().primaryKey(),
  knowledgeBaseItemId: uuid("knowledge_base_item_id")
    .notNull()
    .references(() => knowledgeBaseItem.id, { onDelete: "cascade" }),

  downloadedById: uuid("downloaded_by_id").notNull(), // user.id or portalUser.id
  downloadedByType: text("downloaded_by_type", { enum: ["STAFF", "CLIENT"] }).notNull(),
  clientId: uuid("client_id").references(() => client.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## API Endpoints

### Knowledge Base Router

**New File**: `/packages/api/src/routers/knowledge-base.ts`

```typescript
export const knowledgeBaseRouter = router({
  // List with filters
  list: publicProcedure
    .input(z.object({
      type: z.enum(["AGENCY_FORM", "LETTER_TEMPLATE", "GUIDE", "CHECKLIST"]).optional(),
      category: z.enum(["GRA", "NIS", "IMMIGRATION", "DCRA", "GENERAL", "TRAINING", "INTERNAL"]).optional(),
      business: z.enum(["GCMC", "KAJ"]).optional(),
      search: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input, context }) => {
      // Apply filters
      // If not staff, only return isStaffOnly=false
      // Return paginated results
    }),

  // Get single item
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, context }) => {
      // Return item with download URL if file-based
    }),

  // Download (log + stream/redirect)
  download: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, context }) => {
      // 1. Log download in knowledgeBaseDownload
      // 2. Generate signed URL or stream file
      // 3. Return download URL
    }),

  // Auto-fill form
  autoFill: staffProcedure
    .input(z.object({
      id: z.string().uuid(),
      clientId: z.string().uuid().optional(),
      matterId: z.string().uuid().optional(),
      format: z.enum(["PDF", "DOCX"]).default("PDF"),
    }))
    .mutation(async ({ input, context }) => {
      // 1. Get KB item + linked template
      // 2. Fetch client/matter data
      // 3. Call documents.templates.generate
      // 4. Return generated content/URL
    }),

  // Admin: Create
  create: adminProcedure
    .input(z.object({
      type: z.enum(["AGENCY_FORM", "LETTER_TEMPLATE", "GUIDE", "CHECKLIST"]),
      category: z.enum(["GRA", "NIS", "IMMIGRATION", "DCRA", "GENERAL", "TRAINING", "INTERNAL"]),
      business: z.enum(["GCMC", "KAJ"]).nullable(),
      title: z.string().min(3),
      description: z.string().min(10),
      shortDescription: z.string().optional(),
      content: z.string().optional(), // For guides
      supportsAutoFill: z.boolean().default(false),
      templateId: z.string().uuid().optional(),
      relatedServices: z.array(z.string()).default([]),
      requiredFor: z.array(z.string()).default([]),
      agencyUrl: z.string().url().optional(),
      governmentFees: z.string().optional(),
      isStaffOnly: z.boolean().default(true),
      isFeatured: z.boolean().default(false),
    }))
    .mutation(async ({ input, context }) => {
      // Create KB item
      // If file upload, handle separately via multipart
    }),

  // Admin: Update
  update: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
      // ... all fields optional
    }))
    .mutation(async ({ input, context }) => {
      // Update, increment version
    }),

  // Admin: Delete (soft)
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, context }) => {
      // Set isActive = false
    }),

  // Analytics
  getStats: adminProcedure
    .query(async ({ context }) => {
      // Return download counts, popular items, etc.
    }),
});
```

---

## UI/UX Design

### 1. Staff KB Browser

**Location**: `/apps/web/src/routes/app/knowledge-base/index.tsx`

```
┌─────────────────────────────────────────────────────────┐
│ Knowledge Base                              [Manage KB] │
├──────────────┬──────────────────────────────────────────┤
│ Filters      │ Forms, Templates & Guides        🔍Search │
│              │                                           │
│ Type         │ ┌─ Featured ─────────────────────────┐  │
│ ☑ All        │ │ 📄 Work Permit Application         │  │
│ ☐ Forms      │ │    IMMIGRATION · Most Downloaded   │  │
│ ☐ Templates  │ │    [Download] [Auto-Fill]          │  │
│ ☐ Guides     │ └────────────────────────────────────┘  │
│              │                                           │
│ Category     │ ┌─ GRA Forms ─────────────────────────┐ │
│ ☐ GRA        │ │ 📄 Individual Income Tax Return     │ │
│ ☐ NIS        │ │    Form 1 · GRA · Auto-fill ready   │ │
│ ☐ Immigration│ │    [Download] [Auto-Fill]           │ │
│ ☐ DCRA       │ │                                      │ │
│ ☐ General    │ │ 📄 PAYE Monthly Return              │ │
│              │ │    Form 5 · GRA · Auto-fill ready   │ │
│ Business     │ │    [Download] [Auto-Fill]           │ │
│ ☐ GCMC       │ └──────────────────────────────────────┘│
│ ☐ KAJ        │                                           │
│ ☐ Both       │ ┌─ NIS Forms ────────────────────────┐  │
│              │ │ 📄 E1 - Employer Registration      │  │
│ [Reset]      │ │    NIS · PDF Download              │  │
│              │ │    [Download]                       │  │
│              │ │                                      │  │
│              │ │ 📄 F200F2 - Contribution Schedule │  │
│              │ │    NIS · PDF Download              │  │
│              │ │    [Download]                       │  │
│              │ └──────────────────────────────────────┘│
│              │                                           │
│              │ Page 1 of 3            [1] [2] [3] [→]   │
└──────────────┴──────────────────────────────────────────┘
```

### 2. Auto-Fill Modal

**Triggered from**: KB item with `supportsAutoFill: true`

```
┌─ Auto-Fill: Work Permit Application ─────────────────┐
│                                                       │
│ Select Client & Matter:                              │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Client: [John Doe ▼]                            │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Matter (optional): [WP-2024-001 ▼]              │ │
│ └─────────────────────────────────────────────────┘ │
│                                                       │
│ Data to be filled:                                    │
│ • Applicant Name: John Doe                           │
│ • Passport Number: G1234567                          │
│ • Employer: ABC Company Ltd                          │
│ • Position: Senior Engineer                          │
│ • TIN: 123456789                                     │
│ • Address: 123 Main St, Georgetown                   │
│                                                       │
│ Output Format:                                        │
│ ◉ PDF (Recommended)    ○ Microsoft Word              │
│                                                       │
│ ⚠️  Generated documents are marked as DRAFT.         │
│    Review before submission to government agencies.  │
│                                                       │
│ [Cancel]                       [Preview] [Generate]  │
└───────────────────────────────────────────────────────┘
```

### 3. Admin KB Management

**Location**: `/apps/web/src/routes/app/admin/knowledge-base.tsx`

```
┌─────────────────────────────────────────────────────────┐
│ Manage Knowledge Base                      [+ Add Item] │
├─────────────────────────────────────────────────────────┤
│ [Search...]  Type: [All ▼]  Category: [All ▼]          │
│                                                          │
│ Title                      Type     Category  Actions   │
│ ─────────────────────────────────────────────────────── │
│ Individual Income Tax...   FORM     GRA       ✏️ 🗑️     │
│ Work Permit Application    FORM     IMMIGRATION ✏️ 🗑️   │
│ Training Engagement Letter TEMPLATE GENERAL   ✏️ 🗑️     │
│ Client Onboarding Guide    GUIDE    INTERNAL  ✏️ 🗑️     │
│ E1 Employer Registration   FORM     NIS       ✏️ 🗑️     │
│                                                          │
│ Showing 5 of 45 items                       Page 1 of 9 │
└─────────────────────────────────────────────────────────┘
```

### 4. Client Portal Resources

**Location**: `/apps/web/src/routes/portal/resources.tsx`

```
┌─────────────────────────────────────────────────────────┐
│ Resources & Forms                                        │
├─────────────────────────────────────────────────────────┤
│ [Search...]                                              │
│                                                          │
│ ┌─ Government Forms ─────────────────────────────────┐ │
│ │                                                      │ │
│ │ 📄 TIN Registration Application                     │ │
│ │    Guyana Revenue Authority                          │ │
│ │    [Download PDF]                                    │ │
│ │                                                      │ │
│ │ 📄 NIS Employee Registration (E2)                   │ │
│ │    National Insurance Scheme                         │ │
│ │    [Download PDF]                                    │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─ Help Guides ──────────────────────────────────────┐ │
│ │                                                      │ │
│ │ 📖 Getting Started with Portal                      │ │
│ │    Learn how to navigate and use the portal          │ │
│ │    [Read Guide]                                      │ │
│ │                                                      │ │
│ │ 📖 How to Upload Documents                          │ │
│ │    Step-by-step guide for document uploads           │ │
│ │    [Read Guide]                                      │ │
│ └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Initial Data: 45 KB Items

### GRA Forms (8 items)
1. Individual Income Tax Return (Form 1) - AGENCY_FORM
2. Corporate Income Tax Return - AGENCY_FORM
3. PAYE Monthly Return (Form 5) - AGENCY_FORM
4. VAT Return Form - AGENCY_FORM
5. TIN Registration Application - AGENCY_FORM
6. Tax Compliance Certificate Request - AGENCY_FORM
7. Withholding Tax Return - AGENCY_FORM
8. Property Tax Return - AGENCY_FORM

### NIS Forms (6 items)
1. E1 - Employer Registration - AGENCY_FORM
2. E2 - Employee Registration - AGENCY_FORM
3. F200F2 - Monthly Contribution Schedule - AGENCY_FORM
4. NIS Pension Application - AGENCY_FORM
5. Registration Card Application - AGENCY_FORM
6. NIS Benefit Claim Form - AGENCY_FORM

### Immigration Forms (5 items)
1. Work Permit Application - AGENCY_FORM
2. Business Visa Application - AGENCY_FORM
3. Citizenship Application - AGENCY_FORM
4. Passport Renewal Form - AGENCY_FORM
5. Visa Extension Application - AGENCY_FORM

### DCRA Forms (4 items)
1. Business Name Registration - AGENCY_FORM
2. Company Incorporation Form - AGENCY_FORM
3. Business Renewal Form - AGENCY_FORM
4. Change of Company Details - AGENCY_FORM

### Letter Templates (10 items)
1. Training Enrollment Confirmation - LETTER_TEMPLATE, GCMC
2. Training Completion Certificate - LETTER_TEMPLATE, GCMC
3. Work Permit Support Letter - LETTER_TEMPLATE, GCMC
4. Tax Engagement Letter - LETTER_TEMPLATE, KAJ
5. Audit Engagement Letter - LETTER_TEMPLATE, KAJ
6. Compliance Certificate Request Letter - LETTER_TEMPLATE, KAJ
7. Client Welcome Letter - LETTER_TEMPLATE, Both
8. Document Request Letter - LETTER_TEMPLATE, Both
9. Appointment Confirmation Letter - LETTER_TEMPLATE, Both
10. Service Completion Letter - LETTER_TEMPLATE, Both

### Staff Guides (6 items - staff-only)
1. Client Onboarding Process - GUIDE, INTERNAL
2. Document Management Best Practices - GUIDE, INTERNAL
3. Using Form Auto-Fill - GUIDE, INTERNAL
4. Impersonation Safety Guidelines - GUIDE, INTERNAL
5. Knowledge Base Management - GUIDE, INTERNAL
6. Portal Administration - GUIDE, INTERNAL

### Client Guides (6 items - client-accessible)
1. Getting Started with Portal - GUIDE, GENERAL
2. How to Upload Documents - GUIDE, GENERAL
3. Understanding Tax Documents - GUIDE, GENERAL
4. Requesting Appointments - GUIDE, GENERAL
5. Viewing Your Matters - GUIDE, GENERAL
6. Managing Your Profile - GUIDE, GENERAL

**Total: 45 items**

---

## Security Considerations

1. **Access Control**: Staff-only items strictly enforced via middleware
2. **File Validation**: Size limits (10MB), type whitelist for uploads
3. **Download Security**: Signed URLs with 15-min expiry
4. **Audit Trail**: All downloads logged with user/client context
5. **Version Control**: Track changes to forms for compliance

---

## Success Metrics

- **Adoption**: 80% of staff use KB weekly within 3 months
- **Efficiency**: 50% reduction in time to find forms
- **Accuracy**: 90% reduction in data entry errors via auto-fill
- **Downloads**: 100+ downloads per week across all categories
- **Client Usage**: 30% of portal users download at least 1 resource

---

## Open Questions

1. Should we support multi-language forms (English + other)?
2. How often should we audit forms for agency updates?
3. Should clients be able to upload their own resources?
4. Integration with document OCR for data extraction?

---

**Version**: 1.0
**Next Review**: After implementation
**References**: [Document Management System Spec](./document-management-system.md), [GCMC Services](../business-rules/gcmc-services.md), [KAJ Services](../business-rules/kaj-services.md)
