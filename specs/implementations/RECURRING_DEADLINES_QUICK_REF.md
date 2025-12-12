# Recurring Deadlines - Quick Reference

## Quick Start

### Creating a Recurring Deadline

```typescript
// Use the deadline creation API
await client.deadlines.create({
  title: "Monthly PAYE Returns",
  type: "FILING",
  business: "KAJ",
  dueDate: "2025-12-14T09:00:00", // First occurrence
  recurrencePattern: "MONTHLY",
  recurrenceEndDate: "2026-12-31", // Optional
  priority: "HIGH",
});

// Result: Parent deadline + 12 months of instances created automatically
```

### Using Templates

```typescript
// Get Guyana templates
const templates = await client.deadlines.getGuyanaTemplates();

// Load template in UI
templates.find(t => t.id === "template-monthly-paye");
// -> { title: "Monthly PAYE Returns", recurrencePattern: "MONTHLY", suggestedDueDay: 14, ... }
```

### Checking Recurrence Info

```typescript
const info = await client.deadlines.getRecurrencePattern({ id: deadlineId });

// For parent deadline:
// { isRecurring: true, isInstance: false, pattern: "MONTHLY", endDate: "2026-12-31" }

// For instance:
// { isRecurring: true, isInstance: true, parentId: "parent-id", pattern: "MONTHLY", ... }
```

### Updating Entire Series

```typescript
await client.deadlines.updateRecurringSeries({
  parentId: "parent-deadline-id",
  title: "Updated Title for All Future Instances",
  assignedStaffId: "new-staff-id",
  priority: "URGENT",
});

// Only updates parent + future incomplete instances
// Completed instances remain unchanged
```

## API Endpoints

### Core Operations

| Endpoint | Purpose |
|----------|---------|
| `create` | Creates deadline, auto-generates instances if recurring |
| `complete` | Marks complete, auto-generates next instance if recurring |
| `update` | Updates single deadline (instance or parent) |

### Recurring-Specific

| Endpoint | Purpose |
|----------|---------|
| `getRecurrencePattern` | Get recurrence info for a deadline |
| `updateRecurringSeries` | Update parent + all future instances |
| `generateMoreInstances` | Manually generate more instances |
| `getRecurringInstances` | Get all instances of a parent |
| `getGuyanaTemplates` | Get pre-built tax deadline templates |

## Recurrence Patterns

| Pattern | Frequency | Example |
|---------|-----------|---------|
| `NONE` | One-time only | Single deadline |
| `DAILY` | Every day | Daily check-in |
| `WEEKLY` | Every 7 days | Weekly meeting |
| `MONTHLY` | Same day each month | 14th of every month |
| `QUARTERLY` | Every 3 months | Jan 15, Apr 15, Jul 15, Oct 15 |
| `ANNUALLY` | Once per year | April 30 tax deadline |

## Guyana Tax Templates

| Template ID | Title | Pattern | Day | Business |
|-------------|-------|---------|-----|----------|
| `template-monthly-paye` | Monthly PAYE Returns | MONTHLY | 14th | KAJ |
| `template-quarterly-vat` | Quarterly VAT Returns | QUARTERLY | - | KAJ |
| `template-annual-income-tax` | Annual Income Tax Returns | ANNUALLY | Apr 30 | KAJ |
| `template-monthly-nis` | Monthly NIS Contributions | MONTHLY | 15th | KAJ |
| `template-work-permit-renewal` | Work Permit Renewal | ANNUALLY | - | GCMC |
| `template-company-annual-return` | Company Annual Return | ANNUALLY | - | GCMC |

## UI Components

### Calendar View Indicators

- **Repeat Icon (🔄)**: Shown on all recurring deadlines
- Applied to both parent deadlines and instances
- Visible in calendar grid and sidebar lists

### Form Template Section

- Collapsible template selector at top of new deadline form
- Click template to auto-fill form with pre-configured values
- Templates include suggested due dates

### Recurrence Settings

Located in "Schedule & Recurrence" section:
- Due Date (required)
- Time (optional)
- Recurrence Pattern (dropdown)
- Recurrence End Date (optional, disabled if pattern is NONE)
- Info alert when recurring pattern selected

## Common Workflows

### Monthly Tax Deadline

1. Go to Calendar → New Deadline
2. Click "Monthly PAYE Returns" template
3. Adjust due date if needed (defaults to 14th of current month)
4. Optionally set end date (e.g., end of year)
5. Save → 12 monthly instances created

### Completing Monthly Instance

1. View deadline in calendar
2. Click complete button
3. System automatically:
   - Marks current month complete
   - Generates next month's instance
   - Creates reminders for new instance

### Updating Future Deadlines

```typescript
// Change assigned staff for all future PAYE returns
await client.deadlines.updateRecurringSeries({
  parentId: payeParentId,
  assignedStaffId: newStaffId,
});
```

## Instance Generation Rules

| Scenario | Instances Generated |
|----------|---------------------|
| New recurring deadline created | Next 12 months from due date |
| Recurring instance completed | Next single occurrence only |
| Manual generation requested | Next N months (configurable) |
| End date reached | No more instances |

## Type Reference

```typescript
type RecurrencePattern =
  | "NONE"
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "ANNUALLY";

interface CreateDeadlineInput {
  title: string;
  description?: string;
  type: DeadlineType;
  dueDate: string; // ISO datetime
  recurrencePattern?: RecurrencePattern;
  recurrenceEndDate?: string; // ISO date
  priority?: Priority;
  clientId?: string;
  matterId?: string;
  business?: "GCMC" | "KAJ";
  assignedStaffId?: string;
}

interface RecurrenceInfo {
  isRecurring: boolean;
  isInstance: boolean;
  parentId: string | null;
  pattern: RecurrencePattern;
  endDate: string | null;
}

interface GuyanaTemplate {
  id: string;
  title: string;
  description: string;
  type: DeadlineType;
  priority: Priority;
  recurrencePattern: RecurrencePattern;
  business: "GCMC" | "KAJ";
  suggestedDueDate?: string;
  suggestedDueDay?: number;
}
```

## Database Schema

```sql
-- Parent deadline
recurrence_pattern: enum (NONE, DAILY, WEEKLY, MONTHLY, QUARTERLY, ANNUALLY)
recurrence_end_date: date (nullable)
parent_deadline_id: null

-- Instance
recurrence_pattern: NONE
recurrence_end_date: null
parent_deadline_id: UUID (references parent)
```

## Best Practices

1. **Use Templates**: Start with Guyana templates for common deadlines
2. **Set End Dates**: Avoid infinite recurrence, set reasonable end dates
3. **Complete Regularly**: Completing instances triggers next generation
4. **Update Series Carefully**: Changes affect all future instances
5. **Monitor Instance Count**: Check generated instances don't exceed needs

## Troubleshooting

**Problem**: No instances generated
- Check `recurrencePattern !== "NONE"`
- Verify due date is in future
- Check end date is after due date

**Problem**: Too many instances
- Set earlier `recurrenceEndDate`
- Default is 12 months or 2 years max

**Problem**: Completed deadline not generating next
- Ensure it's an instance (has `parentDeadlineId`)
- Check parent's end date not reached
- Verify parent still has valid recurrence pattern

## File Locations

- **API Router**: `/packages/api/src/routers/deadlines.ts`
- **Schema**: `/packages/db/src/schema/deadlines.ts`
- **New Deadline Form**: `/apps/web/src/routes/app/calendar/new.tsx`
- **Calendar View**: `/apps/web/src/routes/app/calendar/index.tsx`
- **Full Docs**: `/RECURRING_DEADLINES_IMPLEMENTATION.md`
