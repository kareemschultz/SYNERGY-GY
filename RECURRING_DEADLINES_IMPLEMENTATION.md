# Recurring Deadlines Implementation

## Overview

This document describes the implementation of the Recurring Deadlines system for GK-Nexus, which extends the existing deadline/calendar module to support recurring tax deadlines, regulatory filings, and periodic reminders.

## Implementation Date

December 11, 2025

## Features Implemented

### 1. Database Schema (Already Existed)

The deadline schema in `/packages/db/src/schema/deadlines.ts` already included:

- `recurrencePattern` enum: NONE, DAILY, WEEKLY, MONTHLY, QUARTERLY, ANNUALLY
- `recurrenceEndDate`: Optional end date for the recurrence series
- `parentDeadlineId`: Self-reference to track recurring instances

### 2. API Router Enhancements

File: `/packages/api/src/routers/deadlines.ts`

#### New Helper Functions

**`calculateNextOccurrence(currentDate: Date, pattern: string): Date | null`**
- Calculates the next occurrence date based on recurrence pattern
- Supports all pattern types: DAILY, WEEKLY, MONTHLY, QUARTERLY, ANNUALLY

**`generateRecurringInstances(parentId, parentDeadline, monthsAhead = 12)`**
- Generates future instances of a recurring deadline
- Default: generates next 12 months of instances
- Creates reminders for each instance
- Safety limit: max 200 instances
- Instances have `recurrencePattern: "NONE"` and link to parent via `parentDeadlineId`

#### Enhanced Procedures

**`create` (Modified)**
- Automatically generates recurring instances when `recurrencePattern !== "NONE"`
- Creates parent deadline + initial instances in one transaction

**`complete` (Enhanced)**
- When completing a recurring instance, automatically generates the next occurrence
- Only generates if within `recurrenceEndDate` bounds
- Prevents duplicate instances

#### New Procedures

**`getRecurrencePattern({ id })`**
- Returns recurrence information for a deadline
- Distinguishes between parent deadlines and instances
- Returns: `{ isRecurring, isInstance, parentId, pattern, endDate }`

**`updateRecurringSeries({ parentId, ...updates })`**
- Updates parent deadline and all future incomplete instances
- Allows changing: title, description, type, assignedStaffId, priority, recurrenceEndDate
- Preserves completed instances unchanged

**`generateMoreInstances({ parentId, monthsAhead = 6 })`**
- Manually trigger generation of additional instances
- Useful for extending far-future deadlines

**`getRecurringInstances({ parentId })`**
- Fetches all instances of a recurring deadline
- Ordered by due date
- Includes client and matter relations

**`getGuyanaTemplates()`**
- Returns pre-configured templates for common Guyana deadlines
- Templates included:
  1. Monthly PAYE Returns (14th of each month)
  2. Quarterly VAT Returns
  3. Annual Income Tax Returns (April 30)
  4. Monthly NIS Contributions (15th of each month)
  5. Work Permit Renewal (annual)
  6. Company Annual Return (annual)

### 3. Frontend Enhancements

#### Deadline Creation Form

File: `/apps/web/src/routes/app/calendar/new.tsx`

**Template Selection Section**
- Shows Guyana tax templates in collapsible card
- Click to load template with pre-filled values
- Templates include suggested due dates (e.g., 14th for PAYE, April 30 for income tax)
- Visual indicators with Sparkles icon and badges

**Enhanced Schedule Section**
- Added visual icons (Calendar, Repeat)
- Clear labels for recurrence pattern and end date
- Disabled end date field when pattern is "NONE"
- Help text explaining recurring behavior
- Alert shown when recurrence is active explaining auto-generation

**New Functions**
- `loadTemplate(template)`: Applies template values to form
- Fetches templates via `client.deadlines.getGuyanaTemplates()`

#### Calendar View

File: `/apps/web/src/routes/app/calendar/index.tsx`

**Visual Indicators**
- Repeat icon (🔄) shown on recurring deadlines in calendar cells
- Repeat icon shown on parent deadlines and instances in sidebar
- Applied to both calendar grid items and deadline cards

**Enhanced DeadlineItem Component**
- Detects recurring deadlines by checking `recurrencePattern !== "NONE"` or `parentDeadlineId`
- Shows Repeat icon next to deadline title
- Supports recurring-specific props in type definition

## Business Logic

### Instance Generation Strategy

1. **On Creation**: When a recurring deadline is created, instances are generated for the next 12 months
2. **On Completion**: When an instance is completed, the next single occurrence is generated
3. **Manual Generation**: Staff can trigger `generateMoreInstances` to extend the series

### Recurrence Patterns

- **MONTHLY**: Same day each month (e.g., 14th of every month)
- **QUARTERLY**: Every 3 months from start date
- **ANNUALLY**: Same date each year
- **WEEKLY**: Every 7 days
- **DAILY**: Every day (use sparingly)

### End Date Handling

- If `recurrenceEndDate` is set, no instances generated past that date
- If not set, generates up to 2 years ahead (max)
- Effective end date is min(recurrenceEndDate, now + monthsAhead)

## Guyana Tax Deadline Templates

Pre-built templates help KAJ staff quickly create common recurring deadlines:

1. **Monthly PAYE Returns**
   - Type: FILING
   - Pattern: MONTHLY
   - Suggested: 14th of each month
   - Priority: HIGH
   - Business: KAJ

2. **Quarterly VAT Returns**
   - Type: FILING
   - Pattern: QUARTERLY
   - Priority: HIGH
   - Business: KAJ

3. **Annual Income Tax Returns**
   - Type: FILING
   - Pattern: ANNUALLY
   - Suggested: April 30
   - Priority: URGENT
   - Business: KAJ

4. **Monthly NIS Contributions**
   - Type: PAYMENT
   - Pattern: MONTHLY
   - Suggested: 15th of each month
   - Priority: HIGH
   - Business: KAJ

5. **Work Permit Renewal**
   - Type: RENEWAL
   - Pattern: ANNUALLY
   - Priority: URGENT
   - Business: GCMC

6. **Company Annual Return**
   - Type: FILING
   - Pattern: ANNUALLY
   - Priority: HIGH
   - Business: GCMC

## Usage Examples

### Creating a Recurring Deadline

1. Navigate to Calendar → New Deadline
2. Click a template (e.g., "Monthly PAYE Returns") or configure manually
3. Set the first due date
4. Select recurrence pattern (e.g., MONTHLY)
5. Optionally set recurrence end date
6. Save - instances automatically generated

### Completing Recurring Instances

1. View deadline in calendar
2. Click complete button
3. System automatically:
   - Marks current instance complete
   - Generates next occurrence (if within end date)
   - Creates reminders for next instance

### Updating a Recurring Series

Use the `updateRecurringSeries` API endpoint to:
- Change title for all future instances
- Reassign to different staff member
- Update priority
- Extend or shorten end date

**Note**: Completed instances are never modified

## Technical Details

### Type Definitions

```typescript
// Recurrence Pattern
type RecurrencePattern = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUALLY";

// Parent Deadline
{
  id: string;
  recurrencePattern: RecurrencePattern; // not "NONE"
  recurrenceEndDate: string | null;
  parentDeadlineId: null;
  // ... other deadline fields
}

// Instance (Generated)
{
  id: string;
  recurrencePattern: "NONE";
  recurrenceEndDate: null;
  parentDeadlineId: string; // links to parent
  // ... other fields copied from parent
}
```

### Database Indexes

Already present in schema:
- `deadline_parent_id_idx` on `parentDeadlineId`
- `deadline_due_date_idx` on `dueDate`
- `deadline_is_completed_idx` on `isCompleted`

These indexes optimize queries for:
- Finding instances of a parent
- Calendar date range queries
- Filtering incomplete instances

## Future Enhancements

Potential improvements for future phases:

1. **Edit Instance vs Edit Series Dialog**
   - When editing a recurring instance, ask: "Edit this instance only" or "Edit entire series"
   - Currently: manual API calls needed

2. **Skip Occurrence**
   - Ability to skip a single occurrence without deleting
   - Add `isSkipped` flag to instances

3. **Custom Recurrence Rules**
   - "Every 2nd Tuesday of the month"
   - "Last business day of quarter"
   - Requires more complex date calculation

4. **Bulk Instance Management**
   - Delete all future instances
   - Regenerate instances with new pattern

5. **Recurrence Exceptions**
   - Mark specific dates as exceptions (e.g., holidays)
   - Auto-skip or reschedule

## Testing Recommendations

### Manual Testing Checklist

- [ ] Create monthly PAYE deadline from template
- [ ] Verify 12 instances generated
- [ ] Complete first instance
- [ ] Verify 13th instance auto-created
- [ ] Update recurring series title
- [ ] Verify only future incomplete instances updated
- [ ] Create recurring deadline with end date
- [ ] Verify instances stop at end date
- [ ] Test quarterly pattern (3-month intervals)
- [ ] Test annual pattern (yearly recurrence)
- [ ] View recurring deadlines in calendar with Repeat icon

### Edge Cases

- Completing last instance before end date (no new instance created)
- Creating recurring deadline in the past (instances from today forward)
- Deleting parent deadline (cascades to instances via DB)
- Very short recurrence end date (only 1-2 instances)

## Files Modified

### API Layer
- `/packages/api/src/routers/deadlines.ts` (enhanced)

### Frontend
- `/apps/web/src/routes/app/calendar/new.tsx` (enhanced)
- `/apps/web/src/routes/app/calendar/index.tsx` (enhanced)

### Schema (No Changes)
- `/packages/db/src/schema/deadlines.ts` (already supported recurrence)

## Related Documentation

- Phase 1 Overview: `/specs/phase-1/00-overview.md`
- Calendar Module Spec: (should be created/updated)
- API Documentation: (auto-generated from oRPC)

## Change Log Entry

Add to `/CHANGELOG.md` under `[Unreleased]`:

```markdown
### Added
- Recurring deadline support for monthly, quarterly, and annual patterns
- Auto-generation of recurring deadline instances (up to 12 months ahead)
- Automatic next instance creation when recurring instance completed
- Pre-built Guyana tax deadline templates (PAYE, VAT, Income Tax, NIS, etc.)
- Visual indicators (Repeat icon) for recurring deadlines in calendar
- API endpoints: `getRecurrencePattern`, `updateRecurringSeries`, `generateMoreInstances`, `getRecurringInstances`, `getGuyanaTemplates`
- Template selection UI in deadline creation form with quick-load functionality

### Enhanced
- Deadline creation now auto-generates instances for recurring patterns
- Deadline completion handler generates next occurrence for recurring series
- Calendar view shows recurring indicators on deadlines
```

## Support

For questions or issues related to recurring deadlines:
1. Check this implementation doc
2. Review API router code with inline comments
3. Test with Guyana templates first
4. Verify database has proper recurrence fields
