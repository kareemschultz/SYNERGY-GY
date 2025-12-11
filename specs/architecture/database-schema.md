# Database Schema

**Database:** PostgreSQL
**ORM:** Drizzle ORM
**Schema Location:** `/packages/db/src/schema/`

## Overview

The database consists of 19+ tables organized into logical groups supporting client management, matter tracking, documents, deadlines, and system administration.

## Schema Files

| File | Description |
|------|-------------|
| `core.ts` | Enums, staff, and shared types |
| `clients.ts` | Client management tables |
| `services.ts` | Matter and service type tables |
| `documents.ts` | Document storage tables |
| `deadlines.ts` | Deadline and reminder tables |
| `activity.ts` | Audit logging |

## Enums

### businessEnum
```typescript
export const businessEnum = pgEnum("business", ["GCMC", "KAJ"]);
```

### clientTypeEnum
```typescript
export const clientTypeEnum = pgEnum("client_type", [
  "INDIVIDUAL",
  "SMALL_BUSINESS",
  "CORPORATION",
  "NGO",
  "COOP",
  "FOREIGN_NATIONAL",
  "INVESTOR"
]);
```

### clientStatusEnum
```typescript
export const clientStatusEnum = pgEnum("client_status", [
  "ACTIVE",
  "INACTIVE",
  "ARCHIVED"
]);
```

### matterStatusEnum
```typescript
export const matterStatusEnum = pgEnum("matter_status", [
  "NEW",
  "IN_PROGRESS",
  "PENDING_CLIENT",
  "SUBMITTED",
  "COMPLETE",
  "CANCELLED"
]);
```

### priorityEnum
```typescript
export const priorityEnum = pgEnum("priority", [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT"
]);
```

### documentCategoryEnum
```typescript
export const documentCategoryEnum = pgEnum("document_category", [
  "IDENTITY",
  "TAX",
  "FINANCIAL",
  "LEGAL",
  "IMMIGRATION",
  "BUSINESS",
  "CORRESPONDENCE",
  "TRAINING",
  "OTHER"
]);
```

### deadlineTypeEnum
```typescript
export const deadlineTypeEnum = pgEnum("deadline_type", [
  "FILING",
  "RENEWAL",
  "PAYMENT",
  "SUBMISSION",
  "MEETING",
  "FOLLOWUP",
  "OTHER"
]);
```

### recurrencePatternEnum
```typescript
export const recurrencePatternEnum = pgEnum("recurrence_pattern", [
  "NONE",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "ANNUALLY"
]);
```

### communicationTypeEnum
```typescript
export const communicationTypeEnum = pgEnum("communication_type", [
  "PHONE",
  "EMAIL",
  "IN_PERSON",
  "WHATSAPP"
]);
```

### communicationDirectionEnum
```typescript
export const communicationDirectionEnum = pgEnum("communication_direction", [
  "INBOUND",
  "OUTBOUND"
]);
```

## Tables

### staff
User-staff association with role-based access.

```typescript
export const staff = pgTable("staff", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => user.id),
  role: varchar("role", { length: 50 }).notNull(),
  businesses: text("businesses").array().notNull(),
  phone: varchar("phone", { length: 50 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

**Roles:**
- Owner
- GCMC_Manager
- KAJ_Manager
- Staff_GCMC
- Staff_KAJ
- Staff_Both
- Receptionist

### client
Primary client entity.

```typescript
export const client = pgTable("client", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: clientTypeEnum("type").notNull(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  dateOfBirth: date("date_of_birth"),
  nationality: varchar("nationality", { length: 50 }),
  businessName: varchar("business_name", { length: 255 }),
  registrationNumber: varchar("registration_number", { length: 50 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 50 }).default("Guyana"),
  tinNumber: varchar("tin_number", { length: 50 }),
  nationalId: varchar("national_id", { length: 50 }),
  passportNumber: varchar("passport_number", { length: 50 }),
  businesses: text("businesses").array().notNull(),
  status: clientStatusEnum("status").default("ACTIVE"),
  primaryStaffId: uuid("primary_staff_id").references(() => staff.id),
  notes: text("notes"),
  createdById: uuid("created_by_id").references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### clientContact
Additional contacts for clients.

```typescript
export const clientContact = pgTable("client_contact", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => client.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  relationship: varchar("relationship", { length: 100 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### clientLink
Relationships between clients.

```typescript
export const clientLink = pgTable("client_link", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => client.id).notNull(),
  linkedClientId: uuid("linked_client_id").references(() => client.id).notNull(),
  linkType: varchar("link_type", { length: 50 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### clientCommunication
Communication log.

```typescript
export const clientCommunication = pgTable("client_communication", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => client.id).notNull(),
  type: communicationTypeEnum("type").notNull(),
  direction: communicationDirectionEnum("direction").notNull(),
  subject: varchar("subject", { length: 255 }),
  summary: text("summary"),
  staffId: uuid("staff_id").references(() => staff.id),
  communicatedAt: timestamp("communicated_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### serviceType
Catalog of available services.

```typescript
export const serviceType = pgTable("service_type", {
  id: uuid("id").primaryKey().defaultRandom(),
  business: businessEnum("business").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  defaultChecklistItems: jsonb("default_checklist_items"),
  estimatedDays: integer("estimated_days"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### matter
Service request/case tracking.

```typescript
export const matter = pgTable("matter", {
  id: uuid("id").primaryKey().defaultRandom(),
  referenceNumber: varchar("reference_number", { length: 20 }).unique().notNull(),
  clientId: uuid("client_id").references(() => client.id).notNull(),
  serviceTypeId: uuid("service_type_id").references(() => serviceType.id),
  business: businessEnum("business").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: matterStatusEnum("status").default("NEW"),
  startDate: date("start_date"),
  dueDate: date("due_date"),
  completedDate: date("completed_date"),
  assignedStaffId: uuid("assigned_staff_id").references(() => staff.id),
  estimatedFee: decimal("estimated_fee", { precision: 10, scale: 2 }),
  actualFee: decimal("actual_fee", { precision: 10, scale: 2 }),
  isPaid: boolean("is_paid").default(false),
  priority: priorityEnum("priority").default("NORMAL"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### matterChecklist
Checklist items for matters.

```typescript
export const matterChecklist = pgTable("matter_checklist", {
  id: uuid("id").primaryKey().defaultRandom(),
  matterId: uuid("matter_id").references(() => matter.id).notNull(),
  item: varchar("item", { length: 255 }).notNull(),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  completedById: uuid("completed_by_id").references(() => staff.id),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### matterNote
Notes on matters.

```typescript
export const matterNote = pgTable("matter_note", {
  id: uuid("id").primaryKey().defaultRandom(),
  matterId: uuid("matter_id").references(() => matter.id).notNull(),
  content: text("content").notNull(),
  isInternal: boolean("is_internal").default(true),
  createdById: uuid("created_by_id").references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### document
Document storage.

```typescript
export const document = pgTable("document", {
  id: uuid("id").primaryKey().defaultRandom(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  fileSize: integer("file_size"),
  storagePath: varchar("storage_path", { length: 500 }),
  cloudBackupPath: varchar("cloud_backup_path", { length: 500 }),
  isBackedUp: boolean("is_backed_up").default(false),
  category: documentCategoryEnum("category").notNull(),
  description: text("description"),
  clientId: uuid("client_id").references(() => client.id).notNull(),
  matterId: uuid("matter_id").references(() => matter.id),
  expirationDate: date("expiration_date"),
  expirationNotified: boolean("expiration_notified").default(false),
  status: varchar("status", { length: 20 }).default("ACTIVE"),
  uploadedById: uuid("uploaded_by_id").references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### deadline
Deadline tracking.

```typescript
export const deadline = pgTable("deadline", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: deadlineTypeEnum("type").notNull(),
  clientId: uuid("client_id").references(() => client.id),
  matterId: uuid("matter_id").references(() => matter.id),
  business: businessEnum("business"),
  dueDate: timestamp("due_date").notNull(),
  recurrencePattern: recurrencePatternEnum("recurrence_pattern").default("NONE"),
  recurrenceEndDate: date("recurrence_end_date"),
  parentDeadlineId: uuid("parent_deadline_id"),
  assignedStaffId: uuid("assigned_staff_id").references(() => staff.id),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  completedById: uuid("completed_by_id").references(() => staff.id),
  priority: priorityEnum("priority").default("NORMAL"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### deadlineReminder
Reminder schedule.

```typescript
export const deadlineReminder = pgTable("deadline_reminder", {
  id: uuid("id").primaryKey().defaultRandom(),
  deadlineId: uuid("deadline_id").references(() => deadline.id).notNull(),
  daysBefore: integer("days_before").notNull(),
  isSent: boolean("is_sent").default(false),
  sentAt: timestamp("sent_at"),
});
```

### activityLog
Audit trail.

```typescript
export const activityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  staffId: uuid("staff_id").references(() => staff.id),
  action: varchar("action", { length: 50 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: uuid("entity_id"),
  description: text("description"),
  metadata: jsonb("metadata"),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

## Relations

```typescript
// Client relations
export const clientRelations = relations(client, ({ one, many }) => ({
  primaryStaff: one(staff, { fields: [client.primaryStaffId], references: [staff.id] }),
  createdBy: one(staff, { fields: [client.createdById], references: [staff.id] }),
  contacts: many(clientContact),
  communications: many(clientCommunication),
  matters: many(matter),
  documents: many(document),
  deadlines: many(deadline),
}));

// Matter relations
export const matterRelations = relations(matter, ({ one, many }) => ({
  client: one(client, { fields: [matter.clientId], references: [client.id] }),
  serviceType: one(serviceType, { fields: [matter.serviceTypeId], references: [serviceType.id] }),
  assignedStaff: one(staff, { fields: [matter.assignedStaffId], references: [staff.id] }),
  checklist: many(matterChecklist),
  notes: many(matterNote),
  documents: many(document),
  deadlines: many(deadline),
}));
```

## Indexes

Recommended indexes for performance:

```sql
-- Client lookups
CREATE INDEX idx_client_display_name ON client(display_name);
CREATE INDEX idx_client_email ON client(email);
CREATE INDEX idx_client_tin ON client(tin_number);
CREATE INDEX idx_client_businesses ON client USING GIN(businesses);

-- Matter lookups
CREATE INDEX idx_matter_reference ON matter(reference_number);
CREATE INDEX idx_matter_client ON matter(client_id);
CREATE INDEX idx_matter_status ON matter(status);
CREATE INDEX idx_matter_business ON matter(business);

-- Deadline lookups
CREATE INDEX idx_deadline_due_date ON deadline(due_date);
CREATE INDEX idx_deadline_client ON deadline(client_id);
CREATE INDEX idx_deadline_completed ON deadline(is_completed);

-- Document lookups
CREATE INDEX idx_document_client ON document(client_id);
CREATE INDEX idx_document_matter ON document(matter_id);
CREATE INDEX idx_document_category ON document(category);
```

## Migrations

Drizzle manages schema changes:

```bash
# Push schema to database
bun run db:push

# Generate migration files
bun run db:generate

# Run migrations
bun run db:migrate

# Open Drizzle Studio
bun run db:studio
```
