# API Reference

**Framework:** Hono + oRPC
**Location:** `/packages/api/src/routers/`
**Type Safety:** Full TypeScript end-to-end

## Overview

The API uses oRPC for type-safe RPC-style endpoints. All endpoints return typed responses and use zod for input validation.

## Authentication

### Procedures

| Procedure | Description | Usage |
|-----------|-------------|-------|
| `publicProcedure` | No auth required | Health checks |
| `protectedProcedure` | Requires logged-in user | General endpoints |
| `staffProcedure` | Requires staff profile | Most operations |
| `adminProcedure` | Requires manager/owner role | Admin operations |

### Access Helpers

```typescript
// Get businesses user has access to
function getAccessibleBusinesses(staff: Staff): string[] {
  if (staff.role === "Owner") return ["GCMC", "KAJ"];
  return staff.businesses;
}
```

## Router Index

```typescript
// /packages/api/src/routers/index.ts
export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  privateData: protectedProcedure.handler(...),
  clients: clientsRouter,
  matters: mattersRouter,
  documents: documentsRouter,
  deadlines: deadlinesRouter,
  dashboard: dashboardRouter,
};
```

---

## Clients Router

**Path:** `/packages/api/src/routers/clients.ts`

### Endpoints

#### `clients.list`
List clients with pagination and filters.

**Input:**
```typescript
{
  page?: number;       // Default: 1
  limit?: number;      // Default: 20
  search?: string;     // Search displayName, email, phone
  type?: ClientType;   // Filter by client type
  business?: Business; // Filter by business
  status?: Status;     // Filter by status
}
```

**Output:**
```typescript
{
  clients: Client[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

#### `clients.getById`
Get single client with relations.

**Input:** `{ id: string }`

**Output:**
```typescript
{
  ...client,
  contacts: ClientContact[];
  communications: ClientCommunication[];
  matters: Matter[];
  documents: Document[];
}
```

#### `clients.create`
Create new client.

**Input:**
```typescript
{
  type: ClientType;
  displayName: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  email?: string;
  phone?: string;
  address?: string;
  tinNumber?: string;
  businesses: Business[];
  // ... other fields
}
```

#### `clients.update`
Update client.

**Input:** `{ id: string, ...fields }`

#### `clients.search`
Quick search for autocomplete.

**Input:** `{ query: string, limit?: number }`

**Output:** `Client[]` (limited fields)

### Nested Routers

#### `clients.contacts`
- `list({ clientId })` - List contacts
- `create({ clientId, name, email, phone, relationship })` - Add contact
- `update({ id, ...fields })` - Update contact
- `delete({ id })` - Remove contact

#### `clients.communications`
- `list({ clientId, limit? })` - List communications
- `create({ clientId, type, direction, subject, summary })` - Log communication

---

## Matters Router

**Path:** `/packages/api/src/routers/matters.ts`

### Endpoints

#### `matters.list`
List matters with filters.

**Input:**
```typescript
{
  page?: number;
  limit?: number;
  status?: MatterStatus;
  business?: Business;
  clientId?: string;
  assignedStaffId?: string;
}
```

#### `matters.getById`
Get matter with checklist, notes.

#### `matters.create`
Create matter (auto-generates reference number).

**Input:**
```typescript
{
  clientId: string;
  serviceTypeId?: string;
  business: Business;
  title: string;
  description?: string;
  dueDate?: string;
  assignedStaffId?: string;
  estimatedFee?: number;
  priority?: Priority;
}
```

#### `matters.update`
Update matter fields.

#### `matters.updateStatus`
Change matter status.

**Input:** `{ id: string, status: MatterStatus }`

#### `matters.getServiceTypes`
List service types.

**Input:** `{ business?: Business }`

**Output:** `ServiceType[]`

### Nested Routers

#### `matters.checklist`
- `list({ matterId })` - List items
- `addItem({ matterId, item })` - Add item
- `toggleItem({ id })` - Toggle completion
- `deleteItem({ id })` - Remove item

#### `matters.notes`
- `list({ matterId })` - List notes
- `create({ matterId, content, isInternal? })` - Add note

---

## Documents Router

**Path:** `/packages/api/src/routers/documents.ts`

### Endpoints

#### `documents.list`
List documents with filters.

**Input:**
```typescript
{
  page?: number;
  limit?: number;
  clientId?: string;
  matterId?: string;
  category?: DocumentCategory;
  status?: "ACTIVE" | "ARCHIVED";
}
```

#### `documents.getById`
Get document metadata.

#### `documents.create`
Create document record (metadata only).

**Input:**
```typescript
{
  fileName: string;
  originalName: string;
  mimeType?: string;
  fileSize?: number;
  category: DocumentCategory;
  description?: string;
  clientId: string;
  matterId?: string;
  expirationDate?: string;
}
```

#### `documents.update`
Update metadata.

#### `documents.archive`
Archive document (soft delete).

#### `documents.restore`
Restore archived document.

#### `documents.getExpiring`
Get documents expiring soon.

**Input:** `{ days: number }`

#### `documents.getStats`
Document statistics.

**Output:**
```typescript
{
  total: number;
  byCategory: Record<string, number>;
  expiringSoon: number;
}
```

---

## Deadlines Router

**Path:** `/packages/api/src/routers/deadlines.ts`

### Endpoints

#### `deadlines.list`
List deadlines with filters.

#### `deadlines.getById`
Get single deadline.

#### `deadlines.create`
Create deadline.

**Input:**
```typescript
{
  title: string;
  description?: string;
  type: DeadlineType;
  clientId?: string;
  matterId?: string;
  business?: Business;
  dueDate: string;
  recurrencePattern?: RecurrencePattern;
  recurrenceEndDate?: string;
  priority?: Priority;
}
```

#### `deadlines.update`
Update deadline.

#### `deadlines.delete`
Delete deadline.

#### `deadlines.complete`
Mark deadline complete.

**Input:** `{ id: string }`

#### `deadlines.uncomplete`
Unmark deadline.

#### `deadlines.getCalendarData`
Get deadlines for calendar view.

**Input:**
```typescript
{
  startDate: string;
  endDate: string;
  business?: Business;
}
```

**Output:** `Deadline[]`

#### `deadlines.getUpcoming`
Get upcoming deadlines.

**Input:** `{ days?: number, limit?: number }`

#### `deadlines.getOverdue`
Get overdue deadlines.

#### `deadlines.getStats`
Deadline statistics.

**Output:**
```typescript
{
  overdue: number;
  dueThisWeek: number;
  completedThisMonth: number;
  totalPending: number;
}
```

---

## Dashboard Router

**Path:** `/packages/api/src/routers/dashboard.ts`

### Endpoints

#### `dashboard.getStats`
Overall statistics.

**Output:**
```typescript
{
  activeClients: number;
  openMatters: number;
  totalDocuments: number;
  upcomingDeadlines: number;
  overdueDeadlines: number;
}
```

#### `dashboard.getMattersByStatus`
Matters grouped by status.

**Output:** `Record<MatterStatus, number>`

#### `dashboard.getRecentMatters`
Recent matters.

**Input:** `{ limit?: number }`

#### `dashboard.getUpcomingDeadlines`
Next deadlines.

**Input:** `{ limit?: number }`

#### `dashboard.getRecentClients`
Recent clients.

**Input:** `{ limit?: number }`

#### `dashboard.getMattersByBusiness`
Matters by business.

**Output:** `Record<Business, number>`

---

## Client Usage

### Web Client Setup

```typescript
// /apps/web/src/utils/orpc.ts
import { createORPCClient } from "@orpc/client";
import type { AppRouter } from "@SYNERGY-GY/api";

export const client = createORPCClient<AppRouter>({
  baseURL: "/api/rpc",
});

export const queryClient = new QueryClient();
```

### Usage with TanStack Query

```typescript
import { useQuery, useMutation } from "@tanstack/react-query";
import { client, queryClient } from "@/utils/orpc";

// Query
const { data, isLoading } = useQuery({
  queryKey: ["clients", page],
  queryFn: () => client.clients.list({ page }),
});

// Mutation
const createMutation = useMutation({
  mutationFn: (data) => client.clients.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["clients"] });
  },
});
```

---

## Error Handling

### Standard Error Format

```typescript
{
  code: "NOT_FOUND" | "FORBIDDEN" | "BAD_REQUEST" | "INTERNAL_ERROR",
  message: string,
  details?: unknown
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NOT_FOUND` | 404 | Resource not found |
| `FORBIDDEN` | 403 | Access denied |
| `BAD_REQUEST` | 400 | Invalid input |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `INTERNAL_ERROR` | 500 | Server error |
