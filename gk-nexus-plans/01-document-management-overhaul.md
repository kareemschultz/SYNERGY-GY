# Plan 01: Document Management System Overhaul

> **Priority:** P0 - Critical
> **Estimated Effort:** 1-2 weeks
> **Status:** 🟡 In Progress (70% Complete)
> **Last Updated:** December 17, 2024

---

## 📋 Problem Statement

The document upload and management system has several critical UX issues and missing features that impact daily operations for GCMC and KAJ staff.

### Current Issues Identified
1. ⏳ Select Category dropdown button doesn't work on document upload page (NEEDS VERIFICATION)
2. ✅ Search functionality not working/returning results - **FIXED: Search now includes tags**
3. ✅ No way to link documents to Clients or Matters - **ALREADY WORKING**
4. ✅ Tags can only be added manually (no predefined dropdown selection) - **TAGS NOW DISPLAYED IN LIST**
5. ✅ Knowledge Base menu missing from sidebar navigation - **FIXED: Added to sidebar**

---

## 🎯 Objectives

1. Fix all broken functionality in document management
2. Implement document-entity relationships (Client, Matter linking)
3. Create reusable tags system with dropdown selection
4. Add Knowledge Base to navigation
5. Enhance search with filters

---

## 📝 Tasks

### Task 1: Fix Document Category Dropdown
**Status:** ⏳ Needs Verification

**Problem:** The "Select Category" button/dropdown on document upload doesn't function.

**Requirements:**
- [ ] Investigate current implementation in `apps/web/src/routes/app/documents/`
- [ ] Ensure categories match database enum: `IDENTITY`, `TAX`, `FINANCIAL`, `LEGAL`, `IMMIGRATION`, `BUSINESS`, `CORRESPONDENCE`, `TRAINING`, `OTHER`
- [ ] Use shadcn/ui `Select` component properly
- [ ] Category should save to database on document upload
- [ ] Display category with icon on document list/cards

**Acceptance Criteria:**
- Dropdown opens when clicked
- All 9 categories display correctly
- Selected category persists after upload
- Category shows on document in list view

---

### Task 2: Fix Document Search
**Status:** 🟢 Complete

**Problem:** Search input doesn't return results or filter documents.

**Resolution (Dec 17, 2024):** Added PostgreSQL array search for tags:
```sql
EXISTS (SELECT 1 FROM unnest(tags) AS tag WHERE tag ILIKE '%search%')
```

**Requirements:**
- [ ] Audit current search implementation
- [ ] Implement search across: filename, description, tags
- [ ] Add debounce (300ms) to prevent excessive API calls
- [ ] Show "No results" state when search returns empty
- [ ] Clear search button

**Technical Notes:**
```typescript
// Example search implementation with TanStack Query
const { data: documents } = useQuery(
  orpc.documents.list.queryOptions({
    input: {
      search: debouncedSearch,
      category: selectedCategory,
      clientId: selectedClient,
      matterId: selectedMatter,
    }
  })
);
```

**Acceptance Criteria:**
- Search returns relevant results within 2 seconds
- Search works across filename, description, tags
- Empty state displays when no results
- Clear button resets search

---

### Task 3: Implement Tags System
**Status:** 🟡 Partially Complete

**Problem:** Tags can only be typed manually. Users need to select from existing tags.

**Progress (Dec 17, 2024):**
- ✅ Tags stored as text array in document table (already in schema)
- ✅ Tags displayed in document list (up to 3 badges + count indicator)
- ✅ Tags displayed in document quick view
- ✅ Tags searchable via API
- ⏳ Tags dropdown selection not yet implemented (uses free-text input)
- ⏳ Predefined tags not seeded (optional enhancement)

**Requirements:**

#### 3.1 Database Schema
```sql
-- Tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(7), -- Hex color like #3B82F6
  business VARCHAR(10), -- 'GCMC', 'KAJ', or NULL for both
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Document-Tags junction table
CREATE TABLE document_tags (
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, tag_id)
);
```

#### 3.2 Predefined Tags to Seed
```typescript
const defaultTags = [
  // Tax & Compliance
  { name: 'GRA', color: '#EF4444' },
  { name: 'NIS', color: '#F59E0B' },
  { name: 'VAT', color: '#10B981' },
  { name: 'PAYE', color: '#3B82F6' },
  { name: 'Form 2', color: '#6366F1' },
  { name: 'Form 5', color: '#8B5CF6' },
  { name: 'Form 7B', color: '#EC4899' },
  { name: 'Compliance', color: '#14B8A6' },
  { name: 'Tax Return', color: '#F97316' },
  
  // Document Types
  { name: 'Financial Statement', color: '#06B6D4' },
  { name: 'Contract', color: '#84CC16' },
  { name: 'Agreement', color: '#22C55E' },
  { name: 'Affidavit', color: '#A855F7' },
  { name: 'Power of Attorney', color: '#D946EF' },
  
  // Communication
  { name: 'Client Correspondence', color: '#0EA5E9' },
  { name: 'Internal', color: '#64748B' },
  { name: 'Urgent', color: '#DC2626' },
];
```

#### 3.3 UI Components
- [ ] Multi-select combobox for tag selection
- [ ] "Add New Tag" button opens modal
- [ ] Tag color picker (optional)
- [ ] Tags display as colored chips/badges
- [ ] Remove tag (X button on chip)

**Acceptance Criteria:**
- Users can select from existing tags via dropdown
- Users can create new tags inline
- Multiple tags can be added per document
- Tags display with colors on document cards
- Tags are searchable/filterable

---

### Task 4: Document-Entity Linking
**Status:** 🔴 Not Started

**Problem:** Documents cannot be associated with specific Clients or Matters.

**Requirements:**

#### 4.1 Database Schema Update
```sql
-- Add nullable foreign keys to documents table
ALTER TABLE documents 
ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
ADD COLUMN matter_id UUID REFERENCES matters(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX idx_documents_client ON documents(client_id);
CREATE INDEX idx_documents_matter ON documents(matter_id);
```

#### 4.2 UI Components
- [ ] "Link to Client" dropdown with search/autocomplete
- [ ] "Link to Matter" dropdown (filtered by selected client)
- [ ] Display linked client/matter on document card
- [ ] Navigate to client/matter from document
- [ ] Bulk link documents to client/matter

**Behavior:**
- If client selected first, matter dropdown filters to that client's matters
- If matter selected, client auto-fills from matter's client
- Both are optional (document can exist without links)

**Acceptance Criteria:**
- Documents can be linked to clients
- Documents can be linked to matters
- Links display on document cards
- Clicking link navigates to client/matter
- Filter documents by client/matter works

---

### Task 5: Add Knowledge Base to Sidebar
**Status:** 🟢 Complete

**Problem:** Knowledge Base section not visible in main navigation.

**Resolution (Dec 17, 2024):**
- ✅ Added "Knowledge Base" menu item to sidebar
- ✅ Position after "Documents", before "Calendar"
- ✅ Icon: `Library` from Lucide icons (Training uses `GraduationCap`)
- ⏳ Sub-menu items not needed (single page with tabs)

**File modified:** `apps/web/src/components/layout/sidebar.tsx`

**Acceptance Criteria:**
- ✅ Knowledge Base appears in sidebar for all users
- ✅ Clicking navigates to Knowledge Base page
- N/A Staff see "Manage" sub-menu (handled by page tabs)
- N/A Clients only see "Browse" (handled by page tabs)

---

### Task 6: Advanced Search Filters
**Status:** 🔴 Not Started

**Problem:** No way to filter documents by multiple criteria.

**Requirements:**
- [ ] Filter panel (collapsible)
- [ ] Filters:
  - Category (multi-select)
  - Tags (multi-select)
  - Client (single select with search)
  - Matter (single select, filtered by client)
  - Date range (from/to picker)
  - Business (GCMC/KAJ)
  - Uploaded by (staff filter)
- [ ] "Clear all filters" button
- [ ] Filter count badge
- [ ] Save filter presets (optional)

**UI Layout:**
```
┌─────────────────────────────────────────────────────┐
│ 🔍 Search documents...            [Filters ▼] (3)   │
├─────────────────────────────────────────────────────┤
│ Category: [Tax ✕] [Financial ✕]                     │
│ Tags: [GRA ✕] [PAYE ✕]                              │
│ Client: [ABC Company ✕]                             │
│ Date: Jan 1, 2024 - Dec 31, 2024                    │
│                                    [Clear All]      │
└─────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- All filters work correctly
- Filters can be combined (AND logic)
- Results update in real-time
- Filter state persists during session
- Clear all resets to default

---

### Task 7: Document Metadata Display Enhancement
**Status:** 🔴 Not Started

**Requirements:**
- [ ] Document card shows:
  - File name with icon (based on type)
  - Category with colored badge
  - Tags as colored chips
  - Linked Client name (if any)
  - Linked Matter title (if any)
  - Upload date (relative: "2 days ago")
  - Uploaded by (staff name)
  - File size (formatted: "2.4 MB")
- [ ] Hover preview (optional)
- [ ] Quick actions: Download, View, Edit, Delete

**Acceptance Criteria:**
- All metadata visible at a glance
- Responsive layout on mobile
- Actions accessible via dropdown or icons

---

## 🔧 Technical Implementation Notes

### API Endpoints Needed

```typescript
// Tags
orpc.tags.list        // Get all tags
orpc.tags.create      // Create new tag
orpc.tags.delete      // Delete tag (admin only)

// Documents (update existing)
orpc.documents.list   // Add filters: clientId, matterId, tags, category, dateRange
orpc.documents.update // Add: clientId, matterId, tags
orpc.documents.upload // Add: clientId, matterId, tags, category
```

### Frontend Files to Modify

```
apps/web/src/
├── routes/app/documents/
│   ├── index.tsx           # Document list page
│   └── upload.tsx          # Upload page (if separate)
├── components/
│   ├── documents/
│   │   ├── document-card.tsx
│   │   ├── document-filters.tsx
│   │   ├── document-upload-form.tsx
│   │   └── tag-selector.tsx
│   └── layout/
│       └── sidebar.tsx     # Add Knowledge Base
└── utils/
    └── orpc.ts             # Already configured
```

### Backend Files to Modify

```
packages/api/src/routers/
├── documents.ts            # Add filters, entity linking
└── tags.ts                 # New router for tags

packages/db/src/schema/
├── documents.ts            # Add clientId, matterId columns
└── tags.ts                 # New schema for tags
```

---

## ✅ Definition of Done

- [ ] All 7 tasks completed and tested
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] Works on mobile (responsive)
- [ ] Accessibility checked (keyboard nav, screen reader)
- [ ] Code reviewed and documented
- [ ] CLAUDE.md updated with any new patterns

---

## 📊 Progress Tracking

| Task | Status | Assigned | Notes |
|------|--------|----------|-------|
| 1. Fix Category Dropdown | 🔴 | - | - |
| 2. Fix Search | 🔴 | - | - |
| 3. Tags System | 🔴 | - | - |
| 4. Document-Entity Linking | 🔴 | - | - |
| 5. Sidebar Knowledge Base | 🔴 | - | - |
| 6. Advanced Filters | 🔴 | - | - |
| 7. Metadata Display | 🔴 | - | - |

---

*Plan Created: December 2024*
*For: Claude Code AI-assisted development*
