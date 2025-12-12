# Document Template System Implementation

## Overview

The Document Template System enables automated document generation using pre-defined templates with dynamic placeholders. This feature allows staff to create reusable templates for letters, agreements, certificates, forms, reports, and invoices.

## Implementation Date

2025-12-11

## Changes Made

### 1. Database Schema Updates

**File**: `/packages/db/src/schema/documents.ts`

#### New Enum: `templateCategoryEnum`
```typescript
export const templateCategoryEnum = pgEnum("template_category", [
  "LETTER",      // Cover letters, confirmation letters
  "AGREEMENT",   // Service agreements, NDAs
  "CERTIFICATE", // Completion certificates, training certificates
  "FORM",        // Intake forms, checklists
  "REPORT",      // Reports and summaries
  "INVOICE",     // Invoice templates
  "OTHER",
]);
```

#### Updated Table: `documentTemplate`
- **Removed**: `templatePath` field
- **Added**:
  - `content` (text, NOT NULL) - Template content with {{placeholder}} syntax
  - `createdById` (text, FK to user.id) - Tracks who created the template
  - `category` - Now uses `templateCategoryEnum` instead of `documentCategoryEnum`
- **Modified**:
  - `placeholders` - Now has default value `[]` and is NOT NULL

#### Interface: `TemplatePlaceholder`
```typescript
export interface TemplatePlaceholder {
  key: string;        // e.g., "client.displayName"
  label: string;      // e.g., "Client Name"
  type: "text" | "date" | "number" | "currency";
  source: "client" | "matter" | "staff" | "business" | "date" | "custom";
  sourceField?: string; // Field name on the source object
}
```

### 2. API Endpoints

**File**: `/packages/api/src/routers/documents.ts`

#### New Template Endpoints

1. **`templates.list`** (staffProcedure)
   - Lists all accessible templates
   - Filters: category, business, includeInactive
   - Returns templates ordered by sortOrder and name

2. **`templates.getById`** (staffProcedure)
   - Get single template by ID
   - Returns full template details

3. **`templates.create`** (adminProcedure)
   - Create new template
   - Requires: name, category, content, placeholders
   - Optional: description, business, sortOrder

4. **`templates.update`** (adminProcedure)
   - Update existing template
   - All fields optional except ID
   - Auto-extracts placeholders from content

5. **`templates.delete`** (adminProcedure)
   - Soft delete (sets isActive to false)
   - Prevents accidental data loss

6. **`templates.preview`** (staffProcedure)
   - Preview template with sample/real data
   - Accepts: clientId, matterId, customData
   - Returns rendered content

7. **`templates.generate`** (staffProcedure)
   - Generate final document from template
   - Accepts: templateId, clientId, matterId, customData, fileName
   - Returns rendered content and suggested filename

#### Helper Function: `getPlaceholderValue`
- Extracts values from data object using dot notation
- Handles formatting based on type (date, currency, text)
- Returns placeholder label if value not found

### 3. Frontend Routes

#### `/app/documents/templates/` (index)
**File**: `/apps/web/src/routes/app/documents/templates/index.tsx`

- Lists all templates in table format
- Filters: search, category, business
- Actions: Create New, View/Edit
- Shows template name, category, business, description, created date
- Empty state with prompt to create first template

#### `/app/documents/templates/new`
**File**: `/apps/web/src/routes/app/documents/templates/new.tsx`

- Create new template form
- Fields:
  - Name (required)
  - Description (optional)
  - Category (required dropdown)
  - Business (dropdown: Both/GCMC/KAJ)
  - Content (required, with placeholder insertion)
- Live preview pane
- Auto-extracts placeholders from content on save

#### `/app/documents/templates/$templateId`
**File**: `/apps/web/src/routes/app/documents/templates/$templateId.tsx`

- View/edit existing template
- Toggle between view and edit modes
- Same fields as creation form
- Actions: Edit, Delete, Cancel
- Confirmation dialog for deletion

### 4. Components

#### `TemplateEditor`
**File**: `/apps/web/src/components/templates/template-editor.tsx`

- Textarea with monospace font for template content
- Integrated PlaceholderPicker button
- Inserts placeholders at cursor position
- Handles cursor positioning after insertion
- Help text explaining placeholder syntax

#### `PlaceholderPicker`
**File**: `/apps/web/src/components/templates/placeholder-picker.tsx`

- Popover with searchable placeholder list
- Grouped by source: Client, Matter, Staff, Business, Date
- Each placeholder shows:
  - Label (human-readable name)
  - Key (e.g., {{client.displayName}})
  - Description
- Click to insert into editor

#### `TemplatePreview`
**File**: `/apps/web/src/components/templates/template-preview.tsx`

- Live preview of template content
- Scrollable area with serif font (document-like)
- Shows raw content (placeholders not replaced in basic view)
- Loading state support

### 5. Placeholder System

**File**: `/apps/web/src/lib/template-placeholders.ts`

#### Available Placeholders

**Client Placeholders**:
- `{{client.displayName}}` - Client Name
- `{{client.email}}` - Client Email
- `{{client.phone}}` - Client Phone
- `{{client.address}}` - Client Address
- `{{client.tin}}` - Tax Identification Number
- `{{client.idNumber}}` - National ID or passport
- `{{client.clientType}}` - Type (Individual, Corporation, etc.)

**Matter Placeholders**:
- `{{matter.referenceNumber}}` - Matter Reference
- `{{matter.title}}` - Matter Title
- `{{matter.description}}` - Matter Description
- `{{matter.serviceType}}` - Service Type
- `{{matter.status}}` - Matter Status

**Staff Placeholders**:
- `{{staff.user.name}}` - Staff Name
- `{{staff.user.email}}` - Staff Email
- `{{staff.jobTitle}}` - Job Title
- `{{staff.phone}}` - Staff Phone

**Business Placeholders**:
- `{{business.GCMC.name}}` - GCMC Name
- `{{business.GCMC.address}}` - GCMC Address
- `{{business.GCMC.phone}}` - GCMC Phone
- `{{business.GCMC.email}}` - GCMC Email
- `{{business.KAJ.name}}` - KAJ Name
- `{{business.KAJ.address}}` - KAJ Address
- `{{business.KAJ.phone}}` - KAJ Phone
- `{{business.KAJ.email}}` - KAJ Email

**Date Placeholders**:
- `{{date.today}}` - Today's Date (YYYY-MM-DD)
- `{{date.todayFormatted}}` - Today's Date (January 1, 2024)

### 6. Bug Fixes

**File**: `/packages/db/src/schema/training.ts`
- Fixed incorrect import: `clients` → `client`
- Fixed references to use `client.id` instead of `clients.id`

## Database Migration

### Required Schema Changes

The following SQL migration needs to be run to update the database:

```sql
-- Add template_category enum
CREATE TYPE "public"."template_category" AS ENUM(
  'LETTER', 'AGREEMENT', 'CERTIFICATE',
  'FORM', 'REPORT', 'INVOICE', 'OTHER'
);

-- Drop old column and add new content column
ALTER TABLE "public"."document_template"
  DROP COLUMN IF EXISTS "template_path",
  ADD COLUMN "content" text NOT NULL DEFAULT '',
  ADD COLUMN "created_by_id" text REFERENCES "public"."user"("id") ON DELETE SET NULL,
  ALTER COLUMN "placeholders" SET DEFAULT '[]'::jsonb,
  ALTER COLUMN "placeholders" SET NOT NULL;

-- Change category column type
ALTER TABLE "public"."document_template"
  ADD COLUMN "category_temp" template_category;

UPDATE "public"."document_template"
  SET "category_temp" = 'OTHER';

ALTER TABLE "public"."document_template"
  DROP COLUMN "category",
  RENAME COLUMN "category_temp" TO "category";

ALTER TABLE "public"."document_template"
  ALTER COLUMN "category" SET NOT NULL;
```

### Migration Commands

1. **Generate migration**: `bun run db:generate`
2. **Apply manually** or use: `cd packages/db && npx drizzle-kit push`
   - Note: May require interactive confirmation

## File Summary

### Created Files
1. `/packages/db/src/schema/documents.ts` (modified)
2. `/packages/api/src/routers/documents.ts` (modified)
3. `/apps/web/src/routes/app/documents/templates/index.tsx`
4. `/apps/web/src/routes/app/documents/templates/new.tsx`
5. `/apps/web/src/routes/app/documents/templates/$templateId.tsx`
6. `/apps/web/src/components/templates/template-editor.tsx`
7. `/apps/web/src/components/templates/placeholder-picker.tsx`
8. `/apps/web/src/components/templates/template-preview.tsx`
9. `/apps/web/src/lib/template-placeholders.ts`
10. `/packages/db/src/schema/training.ts` (bug fix)

### Modified Files
- Database schema: `documents.ts`
- API router: `documents.ts`
- Bug fix: `training.ts`

## Usage Example

### Creating a Template

1. Navigate to `/app/documents/templates`
2. Click "New Template"
3. Fill in details:
   - Name: "Client Welcome Letter"
   - Category: "Letter"
   - Business: "Both Businesses"
4. Write content:
```
Dear {{client.displayName}},

Welcome to {{business.GCMC.name}}. We are pleased to confirm your enrollment.

Service: {{matter.title}}
Reference: {{matter.referenceNumber}}
Date: {{date.todayFormatted}}

Best regards,
{{staff.user.name}}
{{staff.jobTitle}}
```
5. Click "Create Template"

### Generating a Document

1. Select a template
2. Call `templates.generate` with:
   - `templateId`: Template ID
   - `clientId`: Client ID (optional)
   - `matterId`: Matter ID (optional)
3. System replaces placeholders with real data
4. Returns rendered content ready for download/email

## Security Considerations

- Template creation/editing: Admin only (`adminProcedure`)
- Template viewing/generation: All staff (`staffProcedure`)
- Business filtering: Automatically filters based on staff access
- Soft delete: Templates are deactivated, not permanently removed

## Future Enhancements

1. **Rich Text Editor**: Replace textarea with WYSIWYG editor
2. **Template Versioning**: Track template changes over time
3. **PDF Generation**: Convert rendered templates to PDF
4. **Email Integration**: Send generated documents via email
5. **Template Categories**: Add more specific subcategories
6. **Conditional Logic**: Support if/else in templates
7. **Custom Placeholders**: Allow users to define custom fields
8. **Template Library**: Import/export templates between systems

## Testing Checklist

- [ ] Create new template as admin
- [ ] Edit existing template
- [ ] Delete template (soft delete)
- [ ] View templates filtered by category
- [ ] View templates filtered by business
- [ ] Insert placeholders using picker
- [ ] Preview template with sample data
- [ ] Generate document with real client data
- [ ] Verify business access filtering
- [ ] Test with GCMC-only staff
- [ ] Test with KAJ-only staff
- [ ] Test with staff having access to both

## Notes

- Database migration requires manual execution or interactive confirmation
- The system uses double curly braces `{{}}` for placeholder syntax
- Placeholders use dot notation for nested properties
- Templates support all GK-Nexus entities: clients, matters, staff, business info
- Preview functionality can use real or sample data

## Related Documentation

- Database Schema: `/packages/db/src/schema/documents.ts`
- API Documentation: `/packages/api/src/routers/documents.ts`
- Design System: `/specs/design-system.md`
- Phase 2 Overview: `/specs/phase-2/00-overview.md`
