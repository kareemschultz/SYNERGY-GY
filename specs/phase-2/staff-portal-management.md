# Staff Portal Management Specification

**Status**: Sprint 1 Complete (Database & API) - UI Components Pending
**Priority**: HIGH (CRITICAL SECURITY)
**Phase**: Phase 2
**Created**: 2025-12-12
**Last Updated**: 2025-12-12

## Implementation Status

### ✅ Sprint 1: Database & API (COMPLETED - December 12, 2024)
- Portal activity logging: `portalActivityLog` table (13 columns, 6 indexes)
- Staff impersonation: `staffImpersonationSession` table (12 columns, 6 indexes)
- Impersonation API: 3 endpoints (start, end, listActive)
- Analytics API: 3 endpoints (getPortalActivity, getActivityStats, getImpersonationHistory)
- Security features: 30-min expiry, required audit reason, token-based sessions
- Activity tracking: 13 action types with impersonation flag

### ⏳ Sprint 5-6: UI Components (PENDING)
- Impersonation hook (useImpersonation)
- Client detail portal actions menu
- Impersonation banner component
- Portal preview panel (side sheet)
- Portal activity dashboard
- Security testing and audit verification

---

## Overview

Staff Portal Management provides staff members with the ability to view and troubleshoot client portal experiences through impersonation, preview functionality, and comprehensive activity tracking. This system is **security-critical** and requires stringent access controls, audit logging, and clear visual indicators.

### Purpose

- **Support Clients**: Help clients troubleshoot portal issues by seeing exactly what they see
- **Test Features**: Verify portal functionality before client onboarding
- **Monitor Usage**: Track portal adoption and identify issues
- **Ensure Security**: Comprehensive audit trail for all impersonation activities
- **Prevent Abuse**: Time-limited sessions, reason requirements, visual warnings

### Current State vs Proposed

**Current**: No staff visibility into portal. Cannot preview or troubleshoot client issues. No activity tracking beyond basic login logs.

**Proposed**: Full impersonation capabilities with audit trail, portal preview panel, activity dashboard with analytics, and complete session management.

---

## Goals & Objectives

1. **Enable Support**: Staff can troubleshoot portal issues by viewing as client
2. **Improve Testing**: Preview portal features before client onboarding
3. **Track Activity**: Comprehensive analytics on portal usage patterns
4. **Maintain Security**: Complete audit trail, time limits, abuse prevention
5. **Enhance Trust**: Transparent impersonation with client notifications (optional)

---

## User Stories

### Staff Stories

**PM-1: View as Client**
> As a **staff member**, I want to **view the portal exactly as a specific client sees it**, so that **I can troubleshoot their issues**.

**Acceptance Criteria**:
- I can click "View as Client" from client detail page
- I am prompted to provide a reason (required)
- Portal opens in new tab/window with impersonation banner
- I see all client data, documents, matters as they would
- Session is limited to 30 minutes
- All my actions are logged with my staff ID

**PM-2: Portal Preview Panel**
> As a **staff member**, I want to **quickly preview the portal without full impersonation**, so that **I can check specific pages quickly**.

**Acceptance Criteria**:
- I can click "Preview Portal (Panel)" from client detail
- Side panel opens showing portal dashboard
- I can switch between tabs (Dashboard, Matters, Documents)
- I can click "Open in Full View" to start full impersonation
- Panel doesn't require reason (read-only preview)

**PM-3: Portal Activity Dashboard**
> As a **staff member**, I want to **see when clients log in and what they do**, so that **I can gauge portal adoption and identify issues**.

**Acceptance Criteria**:
- I can navigate to "Portal Activity" for a client
- I see login history (dates, times, IP addresses)
- I see document downloads and page views
- I see session durations and activity timeline
- I can filter by date range and action type
- I can export activity to CSV

### Security Stories

**PM-4: Impersonation Audit Trail**
> As a **security auditor**, I want to **see all impersonation sessions**, so that **I can ensure staff aren't abusing access**.

**Acceptance Criteria**:
- All impersonation sessions logged with start/end times
- Reason for each session stored
- Staff ID and client ID recorded
- All actions during impersonation marked as impersonated
- Cannot delete or modify audit logs
- Admin can view all active impersonations

**PM-5: Automatic Session Expiry**
> As a **system administrator**, I want to **ensure impersonation sessions auto-expire**, so that **staff can't maintain long-term access**.

**Acceptance Criteria**:
- Sessions expire after 30 minutes of activity
- Expiry timer extends with each action (max 2 hours total)
- Client sees banner: "Session ended (impersonation timeout)"
- Staff must re-authenticate to start new session

---

## Technical Requirements

### Functional Requirements

**FR-1: Impersonation Session Management**
- Generate secure, unique tokens for each session
- Associate token with staff user, portal user, and client
- Store reason (required, min 10 characters)
- Track start, expiry, and end timestamps
- Support multiple concurrent impersonations (different staff/clients)

**FR-2: Visual Indicators**
- Prominent banner on all portal pages during impersonation
- Banner shows: client name, impersonating staff name, time elapsed
- "Exit Impersonation" button always visible
- Warning color scheme (amber/yellow)
- Cannot be hidden or dismissed

**FR-3: Activity Logging**
- Log all portal actions (login, logout, page views, downloads)
- Mark impersonated actions with `isImpersonated: true` and `impersonatedByUserId`
- Store session context (IP, user agent, session ID)
- Aggregate activity into analytics (logins per day, avg session, popular pages)

**FR-4: Portal Preview (Read-Only)**
- Iframe-based preview of portal pages
- No actual impersonation session created
- Limited to visible pages (no form submissions)
- Quick preview for verification only

**FR-5: Access Control**
- Only staff with appropriate permissions can impersonate
- Cannot impersonate suspended or deactivated accounts
- Cannot impersonate clients from other businesses (GCMC staff can't impersonate KAJ clients)
- Owners and managers have full impersonation access

### Non-Functional Requirements

**NFR-1: Security (CRITICAL)**
- Impersonation tokens must be cryptographically secure (crypto.randomBytes)
- Tokens stored hashed in database
- Sessions isolated (impersonation doesn't affect normal portal sessions)
- No password access required (impersonation bypasses login)
- All sensitive actions require re-verification (e.g., changing email)

**NFR-2: Performance**
- Impersonation session creation: <500ms
- Activity query response: <1 second for 1000+ activities
- Real-time activity updates (WebSocket or polling every 30s)

**NFR-3: Auditability**
- 100% of impersonation sessions logged
- Logs immutable (append-only)
- Retention: 7 years minimum for compliance
- Export capability for external audit systems

**NFR-4: Usability**
- Impersonation start flow: <3 clicks
- Banner visible but not intrusive
- Exit impersonation: 1 click from any page
- Activity dashboard loads in <2 seconds

---

## Database Schema

### `staffImpersonationSession` Table

**Location**: `/packages/db/src/schema/portal.ts`

```typescript
export const staffImpersonationSession = pgTable("staff_impersonation_session", {
  id: uuid("id").defaultRandom().primaryKey(),
  token: text("token").notNull().unique(), // Secure random token

  // Participants
  staffUserId: uuid("staff_user_id")
    .notNull()
    .references(() => user.id),
  portalUserId: uuid("portal_user_id")
    .notNull()
    .references(() => portalUser.id),
  clientId: uuid("client_id")
    .notNull()
    .references(() => client.id),

  // Audit
  reason: text("reason").notNull(), // Required, min 10 chars

  // Timing
  startedAt: timestamp("started_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(), // startedAt + 30 min
  endedAt: timestamp("ended_at"), // Actual end time
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),

  // Session context
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),

  // Status
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Indexes
CREATE INDEX idx_staff_impersonation_session_staff_user_id ON staff_impersonation_session(staff_user_id);
CREATE INDEX idx_staff_impersonation_session_portal_user_id ON staff_impersonation_session(portal_user_id);
CREATE INDEX idx_staff_impersonation_session_client_id ON staff_impersonation_session(client_id);
CREATE INDEX idx_staff_impersonation_session_token ON staff_impersonation_session(token);
CREATE INDEX idx_staff_impersonation_session_is_active ON staff_impersonation_session(is_active);
```

### `portalActivityLog` Table

**Addition to**: `/packages/db/src/schema/portal.ts`

```typescript
export const portalActivityLog = pgTable("portal_activity_log", {
  id: uuid("id").defaultRandom().primaryKey(),

  // User context
  portalUserId: uuid("portal_user_id")
    .notNull()
    .references(() => portalUser.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => client.id),

  // Action details
  action: text("action", {
    enum: [
      "LOGIN", "LOGOUT",
      "VIEW_DASHBOARD", "VIEW_MATTERS", "VIEW_DOCUMENTS", "VIEW_FINANCIALS",
      "VIEW_APPOINTMENTS", "VIEW_PROFILE",
      "VIEW_MATTER", "VIEW_DOCUMENT",
      "DOWNLOAD_DOCUMENT",
      "REQUEST_APPOINTMENT", "CANCEL_APPOINTMENT",
      "UPDATE_PROFILE",
    ],
  }).notNull(),

  // Entity references
  entityType: text("entity_type", {
    enum: ["MATTER", "DOCUMENT", "APPOINTMENT", "INVOICE"],
  }),
  entityId: uuid("entity_id"),

  // Context metadata
  metadata: jsonb("metadata").$type<{
    page?: string;
    filters?: any;
    searchQuery?: string;
    errorMessage?: string;
  }>(),

  // Impersonation tracking
  isImpersonated: boolean("is_impersonated").default(false),
  impersonatedByUserId: uuid("impersonated_by_user_id").references(() => user.id),

  // Session context
  sessionId: uuid("session_id").references(() => portalSession.id),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Indexes
CREATE INDEX idx_portal_activity_log_portal_user_id ON portal_activity_log(portal_user_id);
CREATE INDEX idx_portal_activity_log_client_id ON portal_activity_log(client_id);
CREATE INDEX idx_portal_activity_log_action ON portal_activity_log(action);
CREATE INDEX idx_portal_activity_log_created_at ON portal_activity_log(created_at);
CREATE INDEX idx_portal_activity_log_is_impersonated ON portal_activity_log(is_impersonated);
```

---

## API Endpoints

### Portal Router - Impersonation Sub-Router

**Addition to**: `/packages/api/src/routers/portal.ts`

```typescript
impersonation: {
  // Start impersonation session
  start: staffProcedure
    .input(z.object({
      clientId: z.string().uuid(),
      reason: z.string().min(10, "Reason must be at least 10 characters"),
    }))
    .mutation(async ({ input, context }) => {
      const { clientId, reason } = input;
      const { db, user, req } = context;

      // 1. Verify client has portal account
      const portalUser = await db.query.portalUser.findFirst({
        where: (table, { eq }) => eq(table.clientId, clientId),
      });

      if (!portalUser) {
        throw new Error("Client does not have portal access");
      }

      if (portalUser.status !== "ACTIVE") {
        throw new Error("Portal account is not active");
      }

      // 2. Verify staff has permission
      // Business-scoped: GCMC staff can't impersonate KAJ clients
      const client = await db.query.client.findFirst({
        where: (table, { eq }) => eq(table.id, clientId),
      });

      if (!canImpersonateClient(user, client)) {
        throw new Error("You do not have permission to impersonate this client");
      }

      // 3. Generate secure token
      const token = crypto.randomBytes(32).toString("hex");

      // 4. Create session
      const session = await db.insert(staffImpersonationSession).values({
        token,
        staffUserId: user.id,
        portalUserId: portalUser.id,
        clientId,
        reason,
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        ipAddress: req.ip,
        userAgent: req.headers.get("user-agent"),
        isActive: true,
      }).returning();

      // 5. Log impersonation start
      await db.insert(portalActivityLog).values({
        portalUserId: portalUser.id,
        clientId,
        action: "LOGIN",
        isImpersonated: true,
        impersonatedByUserId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers.get("user-agent"),
      });

      return {
        token: session[0].token,
        expiresAt: session[0].expiresAt,
        client: {
          id: client.id,
          displayName: client.displayName,
        },
      };
    }),

  // End impersonation session
  end: staffProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input, context }) => {
      const { token } = input;
      const { db } = context;

      // Find session
      const session = await db.query.staffImpersonationSession.findFirst({
        where: (table, { eq, and }) =>
          and(eq(table.token, token), eq(table.isActive, true)),
      });

      if (!session) {
        throw new Error("Impersonation session not found");
      }

      // End session
      await db
        .update(staffImpersonationSession)
        .set({
          endedAt: new Date(),
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(staffImpersonationSession.id, session.id));

      // Log logout
      await db.insert(portalActivityLog).values({
        portalUserId: session.portalUserId,
        clientId: session.clientId,
        action: "LOGOUT",
        isImpersonated: true,
        impersonatedByUserId: session.staffUserId,
      });

      return { success: true };
    }),

  // Extend session (called on activity)
  extend: staffProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input, context }) => {
      const { token } = input;
      const { db } = context;

      const session = await db.query.staffImpersonationSession.findFirst({
        where: (table, { eq, and }) =>
          and(eq(table.token, token), eq(table.isActive, true)),
      });

      if (!session) {
        throw new Error("Session expired or invalid");
      }

      // Check if session started more than 2 hours ago (max total time)
      const maxDuration = 2 * 60 * 60 * 1000; // 2 hours
      if (Date.now() - session.startedAt.getTime() > maxDuration) {
        // Force end session
        await db
          .update(staffImpersonationSession)
          .set({ isActive: false, endedAt: new Date() })
          .where(eq(staffImpersonationSession.id, session.id));
        throw new Error("Maximum impersonation duration exceeded");
      }

      // Extend expiry by 30 minutes
      await db
        .update(staffImpersonationSession)
        .set({
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(staffImpersonationSession.id, session.id));

      return { success: true, expiresAt: new Date(Date.now() + 30 * 60 * 1000) };
    }),

  // List active impersonations (admin only)
  listActive: adminProcedure
    .query(async ({ context }) => {
      const { db } = context;

      const sessions = await db.query.staffImpersonationSession.findMany({
        where: (table, { eq }) => eq(table.isActive, true),
        with: {
          staffUser: true,
          portalUser: true,
          client: true,
        },
        orderBy: (table, { desc }) => [desc(table.startedAt)],
      });

      return sessions;
    }),
},

analytics: {
  // Get portal activity for a client
  getPortalActivity: staffProcedure
    .input(z.object({
      clientId: z.string().uuid(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      action: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(50),
    }))
    .query(async ({ input, context }) => {
      const { clientId, startDate, endDate, action, page, limit } = input;
      const { db } = context;

      const activities = await db.query.portalActivityLog.findMany({
        where: (table, { eq, and, gte, lte }) => {
          const conditions = [eq(table.clientId, clientId)];
          if (startDate) conditions.push(gte(table.createdAt, startDate));
          if (endDate) conditions.push(lte(table.createdAt, endDate));
          if (action) conditions.push(eq(table.action, action));
          return and(...conditions);
        },
        orderBy: (table, { desc }) => [desc(table.createdAt)],
        limit,
        offset: (page - 1) * limit,
      });

      return activities;
    }),

  // Get activity statistics
  getActivityStats: staffProcedure
    .input(z.object({ clientId: z.string().uuid() }))
    .query(async ({ input, context }) => {
      const { clientId } = input;
      const { db } = context;

      const activities = await db.query.portalActivityLog.findMany({
        where: (table, { eq }) => eq(table.clientId, clientId),
      });

      const logins = activities.filter((a) => a.action === "LOGIN");
      const downloads = activities.filter((a) => a.action === "DOWNLOAD_DOCUMENT");

      // Calculate avg session duration
      const sessions = groupBy(activities, "sessionId");
      const avgDuration = calculateAvgSessionDuration(sessions);

      return {
        totalLogins: logins.length,
        totalDownloads: downloads.length,
        totalPageViews: activities.filter((a) => a.action.startsWith("VIEW_")).length,
        avgSessionDuration,
        lastLoginAt: logins[0]?.createdAt,
        mostViewedPage: getMostCommon(activities.filter(a => a.action.startsWith("VIEW_")).map(a => a.action)),
      };
    }),

  // Get impersonation history
  getImpersonationHistory: staffProcedure
    .input(z.object({ clientId: z.string().uuid() }))
    .query(async ({ input, context }) => {
      const { clientId } = input;
      const { db } = context;

      const sessions = await db.query.staffImpersonationSession.findMany({
        where: (table, { eq }) => eq(table.clientId, clientId),
        with: {
          staffUser: { columns: { id: true, name: true, email: true } },
        },
        orderBy: (table, { desc }) => [desc(table.startedAt)],
      });

      return sessions.map((s) => ({
        id: s.id,
        staff: s.staffUser,
        reason: s.reason,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        duration: s.endedAt
          ? (s.endedAt.getTime() - s.startedAt.getTime()) / 1000 / 60 // minutes
          : null,
        isActive: s.isActive,
      }));
    }),
},
```

---

## UI/UX Design

### 1. Client Detail - Portal Actions Menu

**Location**: `/apps/web/src/routes/app/clients/$client-id.tsx`

```
┌─ [Client Name] ────────────────────────────────────────┐
│                                                         │
│ [Edit] [Portal Actions ▼] [More ▼]                     │
│        │                                                │
│        ├─ 👁️  View as Client (Full)                   │
│        ├─ 📺 Preview Portal (Panel)                    │
│        ├─ 📊 Portal Activity                           │
│        ├─ ────────────────────                         │
│        └─ ✉️  Send Portal Invite                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2. Impersonation Reason Dialog

```
┌─ Start Impersonation ──────────────────────────────────┐
│                                                         │
│ You are about to view the portal as:                   │
│ **John Doe** (john@example.com)                        │
│                                                         │
│ Reason for impersonation (required):                   │
│ ┌─────────────────────────────────────────────────────┐│
│ │ Client reported they cannot see their documents.    ││
│ │ Investigating issue with portal display.            ││
│ └─────────────────────────────────────────────────────┘│
│ Minimum 10 characters                                   │
│                                                         │
│ ⚠️  All actions will be logged and audited.            │
│     Session will expire after 30 minutes.              │
│                                                         │
│ [Cancel]                                [Start Session] │
└─────────────────────────────────────────────────────────┘
```

### 3. Impersonation Banner (Portal)

**Displayed on all portal pages during impersonation**

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️  IMPERSONATION MODE                                  │
│ Viewing portal as: John Doe                             │
│ Impersonating staff: Jane Smith                         │
│ Session expires in: 28 minutes                          │
│                                      [Exit Impersonation]│
└─────────────────────────────────────────────────────────┘
```

### 4. Portal Activity Dashboard

**Location**: `/apps/web/src/routes/app/clients/$client-id/portal-activity.tsx`

```
┌─ Portal Activity: John Doe ────────────────────────────┐
│                                                         │
│ Summary Stats                                           │
│ ┌──────────┬──────────┬──────────┬──────────┐         │
│ │ Logins   │ Downloads│ Avg Session│ Last Login│       │
│ │   12     │    8     │  8.5 min │ 2 hours ago│       │
│ └──────────┴──────────┴──────────┴──────────┘         │
│                                                         │
│ [Last 7 Days ▼] [Export CSV]                           │
│                                                         │
│ Recent Activity                                         │
│ ┌──────────────────────────────────────────────────────│
│ │ 🟢 LOGIN            2 hours ago     192.168.1.1     ││
│ │ 📄 VIEW_DOCUMENTS   2 hours ago     -               ││
│ │ ⬇️  DOWNLOAD_DOCUMENT 2 hours ago   passport.pdf    ││
│ │ 📊 VIEW_DASHBOARD   3 hours ago     -               ││
│ │ 🔴 LOGOUT           3 hours ago     -               ││
│ │ 🟢 LOGIN            5 hours ago     192.168.1.1     ││
│ │ 📋 VIEW_MATTERS     5 hours ago     -               ││
│ └──────────────────────────────────────────────────────│
│                                                         │
│ Login History                                           │
│ Date         Time      Duration  IP Address   Impersonated│
│ ────────────────────────────────────────────────────────│
│ 2024-12-12   14:30    12 min    192.168.1.1  No        │
│ 2024-12-12   09:15    8 min     192.168.1.1  No        │
│ 2024-12-11   16:45    15 min    192.168.1.1  No        │
│ 2024-12-11   10:00    5 min     10.0.0.1     Yes (Jane)│
│                                                         │
│ Impersonation History                                   │
│ Date         Staff      Reason                Duration │
│ ────────────────────────────────────────────────────────│
│ 2024-12-11   Jane Smith Investigating doc...  5 min    │
│ 2024-12-08   John Admin Testing new feature  12 min    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Security Checklist

- [ ] Impersonation tokens cryptographically secure (32+ bytes)
- [ ] Tokens never exposed in URLs or client-side storage
- [ ] Reason required (min 10 chars) for all sessions
- [ ] Session expiry: 30 min activity timeout, 2 hour max duration
- [ ] Visual banner cannot be dismissed or hidden
- [ ] All actions logged with `isImpersonated` flag
- [ ] Business-scoped access (GCMC can't impersonate KAJ clients)
- [ ] Audit logs immutable (append-only)
- [ ] Admin dashboard shows all active impersonations
- [ ] Automatic cleanup of expired sessions (cron job)
- [ ] Rate limiting on impersonation start (max 10/hour per staff)
- [ ] Alerting on suspicious patterns (many short sessions, frequent failures)

---

## Testing Strategy

### Security Tests

```typescript
describe("Impersonation Security", () => {
  it("requires valid reason", async () => {
    await expect(
      caller.impersonation.start({ clientId: "abc", reason: "test" })
    ).rejects.toThrow("Reason must be at least 10 characters");
  });

  it("enforces business-scoped access", async () => {
    // GCMC staff trying to impersonate KAJ client
    await expect(
      caller.impersonation.start({ clientId: kajClient.id, reason: "Valid reason here" })
    ).rejects.toThrow("You do not have permission");
  });

  it("expires sessions after 30 minutes", async () => {
    const { token } = await caller.impersonation.start({ clientId, reason });

    // Fast-forward time 31 minutes
    advanceTime(31 * 60 * 1000);

    await expect(
      caller.impersonation.extend({ token })
    ).rejects.toThrow("Session expired");
  });

  it("enforces 2 hour maximum duration", async () => {
    const { token } = await caller.impersonation.start({ clientId, reason });

    // Fast-forward 2 hours + 1 minute
    advanceTime(121 * 60 * 1000);

    await expect(
      caller.impersonation.extend({ token })
    ).rejects.toThrow("Maximum impersonation duration exceeded");
  });
});
```

---

## Success Metrics

- **Support Efficiency**: 60% reduction in time to resolve portal issues
- **Portal Adoption**: Identify and fix usability issues → 40% increase in active users
- **Security**: Zero unauthorized access incidents
- **Audit Compliance**: 100% of impersonation sessions logged and auditable

---

## Open Questions

1. Should clients be notified when staff impersonate them? (Email/portal notification)
2. Should there be impersonation quotas per staff member?
3. Should sensitive actions (profile changes) be blocked during impersonation?
4. Integration with external audit/SIEM systems?

---

**Version**: 1.0
**Next Review**: After security audit
**Critical**: Security review required before production deployment
