# Authentication & Authorization System

**Library:** Better-Auth
**Location:** `/packages/auth/`

## Overview

The authentication system uses Better-Auth with role-based access control (RBAC) implemented through a staff profile system.

## Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────▶│  Better-    │────▶│   Session   │
│   Login     │     │   Auth      │     │   Created   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Staff     │
                    │   Profile   │
                    │   Loaded    │
                    └─────────────┘
```

## User Model

### Better-Auth User
```typescript
// Created by Better-Auth
interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Staff Profile
```typescript
// Extended profile for app
interface Staff {
  id: string;
  userId: string;        // Links to Better-Auth user
  role: StaffRole;
  businesses: Business[];
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Roles & Permissions

### Role Hierarchy

```
Owner
  └── Full access to both businesses
  └── Can manage all staff
  └── All administrative functions

GCMC_Manager
  └── Full access to GCMC
  └── Can manage GCMC staff
  └── GCMC administrative functions

KAJ_Manager
  └── Full access to KAJ
  └── Can manage KAJ staff
  └── KAJ administrative functions

Staff_GCMC
  └── Standard access to GCMC
  └── CRUD on assigned clients/matters

Staff_KAJ
  └── Standard access to KAJ
  └── CRUD on assigned clients/matters

Staff_Both
  └── Standard access to both
  └── CRUD on assigned clients/matters

Receptionist
  └── Read access
  └── Create clients
  └── Basic operations
```

### Permission Matrix

| Action | Owner | Manager | Staff | Receptionist |
|--------|-------|---------|-------|--------------|
| View all clients | ✅ | ✅ (own business) | ✅ (own business) | ✅ (own business) |
| Create client | ✅ | ✅ | ✅ | ✅ |
| Edit any client | ✅ | ✅ | ❌ | ❌ |
| Delete client | ✅ | ✅ | ❌ | ❌ |
| View all matters | ✅ | ✅ | ✅ | ✅ |
| Create matter | ✅ | ✅ | ✅ | ❌ |
| Edit any matter | ✅ | ✅ | ❌ | ❌ |
| Manage staff | ✅ | ✅ (own business) | ❌ | ❌ |
| View reports | ✅ | ✅ | ❌ | ❌ |
| System settings | ✅ | ❌ | ❌ | ❌ |

## Business Access Control

### Filtering Data by Business

```typescript
function getAccessibleBusinesses(staff: Staff): string[] {
  if (staff.role === "Owner") {
    return ["GCMC", "KAJ"];
  }
  return staff.businesses;
}

// Usage in queries
const accessibleBusinesses = getAccessibleBusinesses(context.staff);
const businessFilter = sql`${client.businesses} && ARRAY[${sql.join(accessibleBusinesses)}]::text[]`;
```

### Business-Specific Procedures

```typescript
// GCMC only
export const gcmcProcedure = staffProcedure.use(
  requireBusiness("GCMC")
);

// KAJ only
export const kajProcedure = staffProcedure.use(
  requireBusiness("KAJ")
);
```

## API Middleware

### Procedure Types

```typescript
// Public - no auth
export const publicProcedure = o.procedure();

// Protected - requires user session
export const protectedProcedure = o.procedure().use(
  o.middleware(async ({ context, next }) => {
    if (!context.session) {
      throw new ORPCError("UNAUTHORIZED");
    }
    return next({ context });
  })
);

// Staff - requires staff profile
export const staffProcedure = protectedProcedure.use(
  o.middleware(async ({ context, next }) => {
    const staff = await getStaffByUserId(context.session.user.id);
    if (!staff || !staff.isActive) {
      throw new ORPCError("FORBIDDEN", "Staff profile required");
    }
    return next({ context: { ...context, staff } });
  })
);

// Admin - requires manager or owner role
export const adminProcedure = staffProcedure.use(
  o.middleware(async ({ context, next }) => {
    const adminRoles = ["Owner", "GCMC_Manager", "KAJ_Manager"];
    if (!adminRoles.includes(context.staff.role)) {
      throw new ORPCError("FORBIDDEN", "Admin access required");
    }
    return next({ context });
  })
);
```

## Session Management

### Session Config
```typescript
// Better-Auth configuration
export const auth = betterAuth({
  database: drizzleAdapter(db),
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,     // 1 day
  },
  // ... other config
});
```

### Getting Session

```typescript
// Server-side
const session = await auth.api.getSession({
  headers: request.headers,
});

// Client-side
import { authClient } from "@/lib/auth-client";
const session = await authClient.getSession();
```

## Staff Profile Creation

### On User Registration/First Login

```typescript
// Create staff profile after user creation
async function createStaffProfile(userId: string, role: string, businesses: string[]) {
  const [staff] = await db.insert(staffTable).values({
    userId,
    role,
    businesses,
    isActive: true,
  }).returning();
  return staff;
}
```

### Admin Staff Management

```typescript
// Admin can update staff
router.staff.update = adminProcedure
  .input(z.object({
    id: z.string(),
    role: z.string().optional(),
    businesses: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  }))
  .handler(async ({ input, context }) => {
    // Verify admin has access to manage this staff
    // Update staff profile
  });
```

## Frontend Auth Components

### Auth Client Setup

```typescript
// /apps/web/src/lib/auth-client.ts
import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL,
});
```

### Protected Routes

```typescript
// TanStack Router auth guard
export const Route = createFileRoute("/app")({
  beforeLoad: async ({ context }) => {
    const session = await authClient.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
  },
});
```

### Auth Context

```typescript
// Provide session to app
function AuthProvider({ children }) {
  const { data: session, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: () => authClient.getSession(),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!session) return <Navigate to="/login" />;

  return (
    <AuthContext.Provider value={{ session }}>
      {children}
    </AuthContext.Provider>
  );
}
```

## Security Considerations

1. **Session Storage**: HTTP-only cookies
2. **CSRF Protection**: Built into Better-Auth
3. **Password Hashing**: Argon2 by default
4. **Rate Limiting**: Implemented on auth endpoints
5. **Token Refresh**: Automatic session extension
6. **Logout**: Invalidates session server-side

## Activity Logging

All significant actions are logged:

```typescript
async function logActivity(
  staffId: string,
  action: string,
  entityType: string,
  entityId: string,
  description?: string,
  metadata?: Record<string, unknown>
) {
  await db.insert(activityLog).values({
    staffId,
    action,
    entityType,
    entityId,
    description,
    metadata,
    createdAt: new Date(),
  });
}
```
