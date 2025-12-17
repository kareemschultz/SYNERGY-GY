# Document Management V2 - Tags System Implementation

> **Implementation Date:** December 17, 2024
> **Status:** Complete
> **Related Plan:** [01-document-management-overhaul.md](../../gk-nexus-plans/01-document-management-overhaul.md)

---

## Overview

This spec documents the implementation of tags display and search functionality for the document management system. The tags were already stored in the database but were not being displayed or searchable.

## Changes Made

### 1. API Changes (`packages/api/src/routers/documents.ts`)

**Search Filter Enhancement:**
```typescript
// Before: Search only covered filename and description
if (input.search) {
  const searchTerm = `%${input.search}%`;
  conditions.push(
    or(
      ilike(document.originalName, searchTerm),
      ilike(document.description, searchTerm)
    )
  );
}

// After: Search now includes tags using PostgreSQL array search
if (input.search) {
  const searchTerm = `%${input.search}%`;
  conditions.push(
    or(
      ilike(document.originalName, searchTerm),
      ilike(document.description, searchTerm),
      sql`EXISTS (SELECT 1 FROM unnest(${document.tags}) AS tag WHERE tag ILIKE ${searchTerm})`
    )
  );
}
```

### 2. Frontend Type Updates (`apps/web/src/routes/app/documents/index.tsx`)

**DocumentType Interface:**
```typescript
// Added tags field to type
type DocumentType = {
  id: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  category: string;
  description?: string | null;
  tags?: string[] | null;  // NEW
  status: string;
  createdAt: string;
  expirationDate?: string | null;
  client?: { id: string; displayName: string } | null;
  matter?: { id: string; title: string; referenceNumber: string } | null;
  uploadedBy?: { id: string; name: string } | null;
};
```

### 3. Tags Display in Document Table

**Location:** `apps/web/src/routes/app/documents/index.tsx`

- Added `Tags` column header after `Category`
- Added tags cell displaying up to 3 tag badges
- Shows "+N" indicator if more than 3 tags
- Updated colspan from 8 to 9 for loading/empty states

**Display Logic:**
```tsx
<TableCell>
  {doc.tags && doc.tags.length > 0 ? (
    <div className="flex flex-wrap gap-1">
      {doc.tags.slice(0, 3).map((tag) => (
        <Badge
          className="bg-slate-100 text-slate-700 text-xs dark:bg-slate-800 dark:text-slate-300"
          key={tag}
          variant="secondary"
        >
          {tag}
        </Badge>
      ))}
      {doc.tags.length > 3 && (
        <Badge className="bg-slate-100 text-slate-500 text-xs" variant="secondary">
          +{doc.tags.length - 3}
        </Badge>
      )}
    </div>
  ) : (
    <span className="text-muted-foreground">-</span>
  )}
</TableCell>
```

### 4. Tags Display in Quick View (`apps/web/src/components/documents/document-quick-view.tsx`)

**Type Update:**
```typescript
type Document = {
  // ... existing fields
  tags?: string[] | null;  // NEW
  // ...
};
```

**Display Component:**
```tsx
{/* Tags */}
{document.tags && document.tags.length > 0 && (
  <div className="flex items-start gap-3">
    <Tag className="mt-0.5 h-4 w-4 text-muted-foreground" />
    <div className="flex-1">
      <p className="mb-1 text-muted-foreground text-xs">Tags</p>
      <div className="flex flex-wrap gap-1">
        {document.tags.map((tag) => (
          <Badge
            className="bg-slate-100 text-slate-700 text-xs dark:bg-slate-800 dark:text-slate-300"
            key={tag}
            variant="secondary"
          >
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  </div>
)}
```

### 5. Sidebar Navigation Update (`apps/web/src/components/layout/sidebar.tsx`)

**Added Knowledge Base:**
```typescript
{
  title: "Knowledge Base",
  href: "/app/knowledge-base",
  icon: Library,  // New import from lucide-react
},
```

**Position:** After Documents, before Calendar

**Icon Changes:**
- Knowledge Base: `Library` icon
- Training: Changed from `BookOpen` to `GraduationCap`

---

## Database Schema (Unchanged)

The database schema already supported tags as a text array:

```sql
-- packages/db/src/schema/documents.ts line 72
tags: text("tags").array()
```

Tags are stored directly on the document table, not in a separate junction table.

---

## API Endpoints (Unchanged Structure)

Tags are already:
- Accepted on document create/update
- Stored in the database
- Now: Returned in list queries (direct column)
- Now: Searchable via the list endpoint

---

## Future Enhancements (Not Implemented)

1. **Tag Dropdown Selection** - Currently tags are free-text input in upload wizard
2. **Predefined Tags** - Seed common tags (GRA, NIS, VAT, PAYE, etc.)
3. **Tag Colors** - Map specific tags to colors for visual distinction
4. **Tag Management UI** - Admin page to manage predefined tags

---

## Testing Notes

1. Search for a document by tag name - should appear in results
2. View document list - tags column should show badges
3. Open document quick view - tags section should display
4. Knowledge Base should appear in sidebar after Documents

---

## Files Modified

| File | Change |
|------|--------|
| `packages/api/src/routers/documents.ts` | Added tags to search filter |
| `apps/web/src/routes/app/documents/index.tsx` | Added tags type, column, and display |
| `apps/web/src/components/documents/document-quick-view.tsx` | Added tags display |
| `apps/web/src/components/layout/sidebar.tsx` | Added Knowledge Base, changed Training icon |
