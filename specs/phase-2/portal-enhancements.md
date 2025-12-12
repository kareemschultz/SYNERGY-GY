# Portal Enhancements Specification

**Status**: Draft
**Priority**: MEDIUM
**Phase**: Phase 2
**Created**: 2025-12-12
**Last Updated**: 2025-12-12

---

## Overview

Portal Enhancements improve the client-facing portal with better document organization, matter-linked documents, resources section, enhanced navigation, and performance optimizations. These improvements increase portal usability and client satisfaction.

### Current Portal Features

**Existing Pages**:
- Dashboard: Overview of matters, documents, appointments
- Matters: List and detail views
- Documents: Basic list with download
- Financials: Invoices and payments
- Appointments: Schedule and view
- Profile: Personal information

**Gaps**:
- Documents not grouped (flat list, hard to navigate with many docs)
- No matter-linked document view
- No resources or help section
- Limited filtering and search
- Performance issues with 50+ documents
- Mobile experience needs improvement

---

## Goals & Objectives

1. **Improve Document Organization**: Group by matter, category, or service
2. **Enhance Findability**: Better search, filters, and sorting
3. **Add Resources**: Forms, guides, FAQs accessible to clients
4. **Optimize Performance**: Fast load times with 100+ documents
5. **Mobile Responsive**: Excellent experience on phones/tablets
6. **Increase Engagement**: Higher portal usage through better UX

---

## User Stories

**PE-1: Group Documents by Matter**
> As a **client**, I want to **see documents grouped by my matters**, so that **I can find work-permit docs vs tax docs easily**.

**PE-2: Filter Documents**
> As a **client**, I want to **filter documents by type or status**, so that **I can quickly find what I need**.

**PE-3: Access Resources**
> As a **client**, I want to **download government forms from the portal**, so that **I don't have to search agency websites**.

**PE-4: View Matter Documents**
> As a **client**, I want to **see all documents for a specific matter**, so that **I have full context**.

**PE-5: Mobile Upload**
> As a **client**, I want to **upload documents from my phone**, so that **I can submit docs immediately after scanning**.

---

## Technical Requirements

### Functional Requirements

**FR-1: Document Grouping**
- Group by: Matter, Category, Service, or All (flat list)
- Collapsible groups with document counts
- Default: Group by Matter

**FR-2: Advanced Filtering**
- Filter by: Matter, Category, Date Range, Required/Optional, Expiring
- Search by: Document name, description
- Sort by: Date (newest/oldest), Name (A-Z), Size

**FR-3: Matter-Linked Documents**
- Matter detail page shows related documents
- Document detail shows associated matter
- Quick navigation between matter and its documents

**FR-4: Resources Section**
- Browse knowledge base items (client-accessible only)
- Categories: Government Forms, Help Guides, FAQs
- Search across resources
- Download tracking

**FR-5: Performance**
- Virtual scrolling for long document lists
- Lazy loading of images/previews
- Pagination (50 items per page)
- Caching of frequently accessed data

**FR-6: Mobile Enhancements**
- Touch-friendly interface
- Camera integration for document scanning
- Responsive grid layouts
- Bottom navigation for key actions

---

## UI/UX Design

### 1. Enhanced Documents Page

**Location**: `/apps/web/src/routes/portal/documents.tsx`

```
┌─ My Documents ─────────────────────────────────────────┐
│                                                         │
│ [Search documents...]          [🔍]  [⚙️ Filters]      │
│                                                         │
│ Group by: [By Matter ▼]   Sort: [Newest First ▼]      │
│                                                         │
│ ┌─ Work Permit Application (WP-2024-001) ─────────────┐│
│ │ 5 documents                            [↓ Download All││
│ │                                                      ││
│ │ ✅ passport.pdf              2.1 MB    Nov 15, 2024 ││
│ │    Immigration · Approved                [Download] ││
│ │                                                      ││
│ │ ✅ photos.jpg                 0.8 MB    Nov 15, 2024││
│ │    Immigration · Approved                [Download] ││
│ │                                                      ││
│ │ ✅ police-clearance.pdf      1.5 MB    Nov 12, 2024││
│ │    Immigration · Pending Review          [Download] ││
│ │                                                      ││
│ │ ⏳ medical-certificate.pdf   1.2 MB    Nov 18, 2024││
│ │    Immigration · Under Review           [Download] ││
│ │                                                      ││
│ │ ⚠️  employment-contract.docx  0.5 MB    Nov 20, 2024││
│ │    Legal · Expires in 14 days           [Download] ││
│ └──────────────────────────────────────────────────────┘│
│                                                         │
│ ┌─ Tax Return 2024 (TAX-2024-012) ────────────────────┐│
│ │ 7 documents                            [↓ Download All││
│ │                                                      ││
│ │ ✅ tin-certificate.pdf       0.6 MB    Nov 01, 2024││
│ │    Tax · Approved                        [Download] ││
│ │ ... (collapsed, click to expand)                    ││
│ └──────────────────────────────────────────────────────┘│
│                                                         │
│ ┌─ Unassigned Documents (2) ───────────────────────────┐│
│ │ ✅ proof-of-address.pdf      1.0 MB    Oct 28, 2024││
│ │    Identity · Approved                   [Download] ││
│ └──────────────────────────────────────────────────────┘│
│                                                         │
│ [+ Upload Document]                                     │
└─────────────────────────────────────────────────────────┘
```

### 2. Document Filters Panel

**Slide-out from right**

```
┌─ Filters ──────────────────────────────────────────────┐
│                                                         │
│ Matter                                                  │
│ ☐ Work Permit Application (5)                         │
│ ☐ Tax Return 2024 (7)                                 │
│ ☐ Company Incorporation (3)                           │
│ ☐ Unassigned (2)                                      │
│                                                         │
│ Category                                                │
│ ☐ Immigration (5)                                      │
│ ☐ Tax (7)                                              │
│ ☐ Legal (2)                                            │
│ ☐ Identity (3)                                         │
│ ☐ Financial (2)                                        │
│                                                         │
│ Status                                                  │
│ ☐ Approved (12)                                        │
│ ☐ Pending Review (3)                                   │
│ ☐ Under Review (2)                                     │
│ ☐ Expiring Soon (1)                                    │
│                                                         │
│ Date Range                                              │
│ From: [Nov 01, 2024 ▼]                                │
│ To:   [Dec 12, 2024 ▼]                                │
│                                                         │
│ [Clear All]                         [Apply Filters]    │
└─────────────────────────────────────────────────────────┘
```

### 3. Matter Detail with Documents

**Location**: `/apps/web/src/routes/portal/matters/$matter-id.tsx`

```
┌─ Matter: Work Permit Application ──────────────────────┐
│                                                         │
│ Reference: WP-2024-001                                  │
│ Status: In Progress                                     │
│ Assigned Staff: Jane Smith                              │
│                                                         │
│ Description:                                            │
│ Work permit application for employment at ABC Company  │
│ as Senior Software Engineer.                            │
│                                                         │
│ ┌─ Related Documents (5) ──────────────────────────────┐│
│ │                                           [Upload]   ││
│ │                                                      ││
│ │ ✅ passport.pdf              Nov 15, 2024 [Download]││
│ │ ✅ photos.jpg                Nov 15, 2024 [Download]││
│ │ ✅ police-clearance.pdf      Nov 12, 2024 [Download]││
│ │ ⏳ medical-certificate.pdf   Nov 18, 2024 [Download]││
│ │ ⚠️  employment-contract.docx  Nov 20, 2024 [Download]││
│ │                                                      ││
│ │ [View All Documents →]                               ││
│ └──────────────────────────────────────────────────────┘│
│                                                         │
│ ┌─ Checklist (3/5) ────────────────────────────────────┐│
│ │ ✅ Submit application form                           ││
│ │ ✅ Upload supporting documents                       ││
│ │ ✅ Pay government fees                               ││
│ │ ⏳ Ministry review (in progress)                     ││
│ │ ⏳ Approval letter (pending)                         ││
│ └──────────────────────────────────────────────────────┘│
│                                                         │
│ ┌─ Notes (2) ───────────────────────────────────────────┐│
│ │ Nov 20: Medical certificate received - Jane Smith   ││
│ │ Nov 15: Application submitted to Ministry - Jane    ││
│ └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### 4. Resources Section (NEW)

**Location**: `/apps/web/src/routes/portal/resources.tsx`

```
┌─ Resources & Help ─────────────────────────────────────┐
│                                                         │
│ [Search resources...]                          [🔍]    │
│                                                         │
│ ┏━ Government Forms ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓│
│ ┃                                                    ┃│
│ ┃ 📄 TIN Registration Application                   ┃│
│ ┃    Guyana Revenue Authority                        ┃│
│ ┃    Required for: Tax Services                      ┃│
│ ┃    [Download PDF]                                  ┃│
│ ┃                                                    ┃│
│ ┃ 📄 NIS Employee Registration (E2)                 ┃│
│ ┃    National Insurance Scheme                       ┃│
│ ┃    Required for: Employment                        ┃│
│ ┃    [Download PDF]                                  ┃│
│ ┃                                                    ┃│
│ ┃ 📄 Work Permit Application Form                   ┃│
│ ┃    Ministry of Home Affairs                        ┃│
│ ┃    Required for: Immigration Services              ┃│
│ ┃    [Download PDF]                                  ┃│
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛│
│                                                         │
│ ┏━ Help Guides ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓│
│ ┃                                                    ┃│
│ ┃ 📖 Getting Started with Portal                    ┃│
│ ┃    Learn the basics of using your client portal   ┃│
│ ┃    [Read Guide]                                    ┃│
│ ┃                                                    ┃│
│ ┃ 📖 How to Upload Documents                        ┃│
│ ┃    Step-by-step guide for document uploads        ┃│
│ ┃    [Read Guide]                                    ┃│
│ ┃                                                    ┃│
│ ┃ 📖 Understanding Tax Documents                    ┃│
│ ┃    What documents you need for tax services       ┃│
│ ┃    [Read Guide]                                    ┃│
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛│
│                                                         │
│ ┏━ Frequently Asked Questions ━━━━━━━━━━━━━━━━━━━━━┓│
│ ┃                                                    ┃│
│ ┃ ❓ How long does a work permit take?              ┃│
│ ┃ ❓ What documents do I need for tax filing?       ┃│
│ ┃ ❓ How do I request an appointment?               ┃│
│ ┃ ❓ Can I upload documents from my phone?          ┃│
│ ┃                                                    ┃│
│ ┃ [View All FAQs]                                   ┃│
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛│
└─────────────────────────────────────────────────────────┘
```

### 5. Mobile Document Upload

**Mobile-optimized upload flow**

```
┌─────────────────────────────────┐
│ Upload Document                 │
├─────────────────────────────────┤
│                                 │
│ ┌─────────────────────────────┐│
│ │                             ││
│ │     📷 Take Photo           ││
│ │                             ││
│ └─────────────────────────────┘│
│                                 │
│ ┌─────────────────────────────┐│
│ │                             ││
│ │     📁 Choose from Gallery  ││
│ │                             ││
│ └─────────────────────────────┘│
│                                 │
│ ┌─────────────────────────────┐│
│ │                             ││
│ │     📄 Browse Files         ││
│ │                             ││
│ └─────────────────────────────┘│
│                                 │
│ After selection:                │
│                                 │
│ Document Details                │
│ Category: [Immigration ▼]      │
│ Matter:   [WP-2024-001 ▼]      │
│ Description:                    │
│ ┌─────────────────────────────┐│
│ │ Passport (all pages)        ││
│ └─────────────────────────────┘│
│                                 │
│ [Cancel]          [Upload]     │
└─────────────────────────────────┘
```

---

## Performance Optimizations

### 1. Virtual Scrolling

**Problem**: Loading 100+ documents at once causes lag.

**Solution**: Implement virtual scrolling using `@tanstack/react-virtual`.
```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

const rowVirtualizer = useVirtualizer({
  count: documents.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 80, // Approximate row height
  overscan: 5, // Render 5 extra items off-screen
})
```

### 2. Lazy Loading

**Images/Previews**: Load thumbnails only when visible in viewport.
```typescript
<img
  src={doc.thumbnailUrl}
  loading="lazy"
  alt={doc.fileName}
/>
```

### 3. Caching Strategy

**React Query Configuration**:
```typescript
const { data: documents } = useQuery({
  queryKey: ['portal', 'documents', clientId],
  queryFn: () => orpc.documents.getByService.query(),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
})
```

### 4. Pagination

**API Level**:
```typescript
// Return paginated results
getDocuments: portalProcedure
  .input(z.object({
    page: z.number().default(1),
    limit: z.number().default(50),
  }))
  .query(async ({ input }) => {
    const offset = (input.page - 1) * input.limit
    // Query with LIMIT and OFFSET
  })
```

---

## Mobile Responsiveness

### Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile-Specific Features

1. **Bottom Navigation**: Key actions accessible with thumb
2. **Swipe Gestures**: Swipe to delete, swipe to download
3. **Camera Integration**: Direct document scanning
4. **Touch-Optimized**: Larger tap targets (min 44x44px)
5. **Collapsible Sections**: Conserve screen space

---

## Success Metrics

- **Document Findability**: 50% reduction in time to find documents
- **Portal Engagement**: 40% increase in portal logins per month
- **Mobile Usage**: 30% of uploads from mobile devices
- **Resources Usage**: 100+ resource downloads per month
- **Performance**: Page load < 2 seconds even with 100+ documents

---

**Version**: 1.0
**Next Review**: After implementation
**Related**: [Document Management](./document-management-system.md), [Knowledge Base](./knowledge-base-system.md)
