# Gemini CLI Prompt: Phase 2 UI Integration (Sprints 2-7)

## Context Summary

Sprint 1 (Database & API) has been completed by Claude Code. You are now responsible for implementing Sprints 2-7: UI Integration, Wizard Modifications, Knowledge Base Interface, Staff Impersonation UI, and Document Display Enhancements.

**Current State**:
- ✅ Database schema for 5 new tables (70 columns, 32 indexes)
- ✅ API routers with 23 new endpoints
- ✅ Migration file generated (needs schema file sync - see below)
- ✅ Documentation and implementation logs complete
- ⏳ Schema file modifications lost during session (manual fix required)
- ⏳ All UI components pending

## CRITICAL: Schema File Sync Required FIRST

Before starting any UI work, you MUST re-apply the schema modifications that were lost during the Claude session. The migration file contains the correct schema, but the TypeScript schema files don't match.

### Files to Update Manually:

#### 1. `/packages/db/src/schema/clients.ts`

Add after existing imports:
```typescript
import { sql } from "drizzle-orm";
import { jsonb } from "drizzle-orm/pg-core";
import { businessEnum } from "./core";
```

Add new enum after existing enums:
```typescript
export const serviceSelectionStatusEnum = pgEnum("service_selection_status", [
  "INTERESTED",
  "ACTIVE",
  "COMPLETED",
  "INACTIVE",
]);
```

Add new table after `clientCommunication`:
```typescript
export const clientServiceSelection = pgTable(
  "client_service_selection",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    clientId: text("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),

    business: businessEnum("business").notNull(),
    serviceCode: text("service_code").notNull(),
    serviceName: text("service_name").notNull(),

    requiredDocuments: jsonb("required_documents")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),

    uploadedDocuments: jsonb("uploaded_documents")
      .$type<Array<{
        documentId: string;
        fileName: string;
        uploadedAt: string;
        requirementName: string;
      }>>()
      .notNull()
      .default(sql`'[]'::jsonb`),

    status: serviceSelectionStatusEnum("status")
      .notNull()
      .default("INTERESTED"),

    selectedAt: timestamp("selected_at").defaultNow().notNull(),
    activatedAt: timestamp("activated_at"),
    completedAt: timestamp("completed_at"),
    inactivatedAt: timestamp("inactivated_at"),

    notes: text("notes"),
    estimatedCompletionDate: date("estimated_completion_date"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("client_service_selection_client_id_idx").on(table.clientId),
    index("client_service_selection_status_idx").on(table.status),
    index("client_service_selection_business_idx").on(table.business),
    index("client_service_selection_service_code_idx").on(table.serviceCode),
  ]
);
```

Update `clientRelations`:
```typescript
export const clientRelations = relations(client, ({ one, many }) => ({
  // ... existing relations
  serviceSelections: many(clientServiceSelection), // ADD THIS
}));
```

Add new relations at end of file:
```typescript
export const clientServiceSelectionRelations = relations(
  clientServiceSelection,
  ({ one }) => ({
    client: one(client, {
      fields: [clientServiceSelection.clientId],
      references: [client.id],
    }),
  })
);
```

#### 2. `/packages/db/src/schema/portal.ts`

Add after existing imports:
```typescript
import { jsonb } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { client } from "./clients";
```

Add new enums after existing enums:
```typescript
export const portalActivityActionEnum = pgEnum("portal_activity_action", [
  "LOGIN",
  "LOGOUT",
  "VIEW_DASHBOARD",
  "VIEW_MATTER",
  "VIEW_DOCUMENT",
  "DOWNLOAD_DOCUMENT",
  "UPLOAD_DOCUMENT",
  "VIEW_INVOICE",
  "REQUEST_APPOINTMENT",
  "CANCEL_APPOINTMENT",
  "UPDATE_PROFILE",
  "CHANGE_PASSWORD",
  "VIEW_RESOURCES",
]);

export const portalActivityEntityTypeEnum = pgEnum(
  "portal_activity_entity_type",
  ["MATTER", "DOCUMENT", "APPOINTMENT", "INVOICE", "RESOURCE"]
);
```

Add new tables after `portalPasswordReset`:
```typescript
export const portalActivityLog = pgTable(
  "portal_activity_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    portalUserId: text("portal_user_id")
      .notNull()
      .references(() => portalUser.id, { onDelete: "cascade" }),

    clientId: text("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),

    action: portalActivityActionEnum("action").notNull(),
    entityType: portalActivityEntityTypeEnum("entity_type"),
    entityId: text("entity_id"),
    metadata: jsonb("metadata"),

    isImpersonated: boolean("is_impersonated").default(false).notNull(),
    impersonatedByUserId: text("impersonated_by_user_id").references(
      () => user.id,
      { onDelete: "set null" }
    ),

    sessionId: text("session_id").references(() => portalSession.id, {
      onDelete: "set null",
    }),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("portal_activity_log_portal_user_id_idx").on(table.portalUserId),
    index("portal_activity_log_client_id_idx").on(table.clientId),
    index("portal_activity_log_action_idx").on(table.action),
    index("portal_activity_log_is_impersonated_idx").on(table.isImpersonated),
    index("portal_activity_log_impersonated_by_user_id_idx").on(
      table.impersonatedByUserId
    ),
    index("portal_activity_log_created_at_idx").on(table.createdAt),
  ]
);

export const staffImpersonationSession = pgTable(
  "staff_impersonation_session",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    token: text("token").unique().notNull(),

    staffUserId: text("staff_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    portalUserId: text("portal_user_id")
      .notNull()
      .references(() => portalUser.id, { onDelete: "cascade" }),

    clientId: text("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),

    reason: text("reason").notNull(),

    startedAt: timestamp("started_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    endedAt: timestamp("ended_at"),

    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),

    isActive: boolean("is_active").default(true).notNull(),
  },
  (table) => [
    index("staff_impersonation_session_token_idx").on(table.token),
    index("staff_impersonation_session_staff_user_id_idx").on(
      table.staffUserId
    ),
    index("staff_impersonation_session_portal_user_id_idx").on(
      table.portalUserId
    ),
    index("staff_impersonation_session_client_id_idx").on(table.clientId),
    index("staff_impersonation_session_is_active_idx").on(table.isActive),
    index("staff_impersonation_session_expires_at_idx").on(table.expiresAt),
  ]
);
```

Update `portalUserRelations`:
```typescript
export const portalUserRelations = relations(portalUser, ({ one, many }) => ({
  // ... existing relations
  activityLogs: many(portalActivityLog), // ADD THIS
  impersonationSessions: many(staffImpersonationSession), // ADD THIS
}));
```

Add new relations at end of file:
```typescript
export const portalActivityLogRelations = relations(
  portalActivityLog,
  ({ one }) => ({
    portalUser: one(portalUser, {
      fields: [portalActivityLog.portalUserId],
      references: [portalUser.id],
    }),
    client: one(client, {
      fields: [portalActivityLog.clientId],
      references: [client.id],
    }),
    impersonatedBy: one(user, {
      fields: [portalActivityLog.impersonatedByUserId],
      references: [user.id],
    }),
    session: one(portalSession, {
      fields: [portalActivityLog.sessionId],
      references: [portalSession.id],
    }),
  })
);

export const staffImpersonationSessionRelations = relations(
  staffImpersonationSession,
  ({ one }) => ({
    staffUser: one(user, {
      fields: [staffImpersonationSession.staffUserId],
      references: [user.id],
    }),
    portalUser: one(portalUser, {
      fields: [staffImpersonationSession.portalUserId],
      references: [portalUser.id],
    }),
    client: one(client, {
      fields: [staffImpersonationSession.clientId],
      references: [client.id],
    }),
  })
);
```

#### 3. `/packages/db/src/schema/index.ts`

Add after invoices export:
```typescript
export * from "./knowledge-base";
```

#### 4. `/packages/api/src/routers/portal.ts`

Add to imports:
```typescript
import {
  portalActivityLog,
  staffImpersonationSession,
} from "@gk-nexus/db/schema/portal";
import { user } from "@gk-nexus/db/schema/auth";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
```

Add these sub-routers to the existing portalRouter object:
```typescript
export const portalRouter = {
  // ... existing endpoints (list, create, get, deactivate, sendInvite, etc.)

  // ADD THESE:
  impersonation: {
    start: staffProcedure
      .input(
        z.object({
          clientId: z.string().uuid(),
          reason: z.string().min(10, "Reason must be at least 10 characters"),
        })
      )
      .handler(async ({ input, context }) => {
        const { db } = await import("@gk-nexus/db");
        const { portalUser, client } = await import("@gk-nexus/db/schema");

        // Verify client has active portal account
        const portalAccount = await db.query.portalUser.findFirst({
          where: (pu, { eq, and }) =>
            and(
              eq(pu.clientId, input.clientId),
              eq(pu.isActive, true),
              eq(pu.status, "ACTIVE")
            ),
        });

        if (!portalAccount) {
          throw new Error("Client does not have an active portal account");
        }

        // Generate secure token with 30-minute expiry
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

        const [session] = await db
          .insert(staffImpersonationSession)
          .values({
            token,
            staffUserId: context.session.user.id,
            portalUserId: portalAccount.id,
            clientId: input.clientId,
            reason: input.reason,
            expiresAt,
            ipAddress: context.req?.headers.get("x-forwarded-for") || "unknown",
            userAgent: context.req?.headers.get("user-agent") || "unknown",
          })
          .returning();

        // Log the impersonation start
        await db.insert(portalActivityLog).values({
          portalUserId: portalAccount.id,
          clientId: input.clientId,
          action: "LOGIN",
          isImpersonated: true,
          impersonatedByUserId: context.session.user.id,
          metadata: { reason: input.reason },
          ipAddress: context.req?.headers.get("x-forwarded-for") || "unknown",
          userAgent: context.req?.headers.get("user-agent") || "unknown",
        });

        return {
          token,
          expiresAt,
          portalUserId: portalAccount.id,
          clientId: input.clientId,
        };
      }),

    end: staffProcedure
      .input(
        z.object({
          token: z.string(),
        })
      )
      .handler(async ({ input }) => {
        const { db } = await import("@gk-nexus/db");

        const session = await db.query.staffImpersonationSession.findFirst({
          where: (s, { eq, and }) =>
            and(eq(s.token, input.token), eq(s.isActive, true)),
        });

        if (!session) {
          throw new Error("Invalid or expired impersonation session");
        }

        await db
          .update(staffImpersonationSession)
          .set({
            endedAt: new Date(),
            isActive: false,
          })
          .where(eq(staffImpersonationSession.id, session.id));

        // Log the impersonation end
        await db.insert(portalActivityLog).values({
          portalUserId: session.portalUserId,
          clientId: session.clientId,
          action: "LOGOUT",
          isImpersonated: true,
          impersonatedByUserId: session.staffUserId,
          metadata: { reason: "Impersonation ended" },
        });

        return { success: true };
      }),

    listActive: adminProcedure.handler(async () => {
      const { db } = await import("@gk-nexus/db");

      const activeSessions = await db.query.staffImpersonationSession.findMany({
        where: (s, { eq }) => eq(s.isActive, true),
        with: {
          staffUser: true,
          portalUser: {
            with: {
              client: true,
            },
          },
        },
        orderBy: (s, { desc }) => [desc(s.startedAt)],
      });

      return activeSessions;
    }),
  },

  analytics: {
    getPortalActivity: staffProcedure
      .input(
        z.object({
          clientId: z.string().uuid(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          action: z
            .enum([
              "LOGIN",
              "LOGOUT",
              "VIEW_DASHBOARD",
              "VIEW_MATTER",
              "VIEW_DOCUMENT",
              "DOWNLOAD_DOCUMENT",
              "UPLOAD_DOCUMENT",
              "VIEW_INVOICE",
              "REQUEST_APPOINTMENT",
              "CANCEL_APPOINTMENT",
              "UPDATE_PROFILE",
              "CHANGE_PASSWORD",
              "VIEW_RESOURCES",
            ])
            .optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
      )
      .handler(async ({ input }) => {
        const { db } = await import("@gk-nexus/db");

        const conditions = [eq(portalActivityLog.clientId, input.clientId)];

        if (input.action) {
          conditions.push(eq(portalActivityLog.action, input.action));
        }

        if (input.startDate) {
          conditions.push(gte(portalActivityLog.createdAt, input.startDate));
        }

        if (input.endDate) {
          conditions.push(lte(portalActivityLog.createdAt, input.endDate));
        }

        const activities = await db.query.portalActivityLog.findMany({
          where: and(...conditions),
          with: {
            portalUser: true,
            impersonatedBy: true,
          },
          orderBy: [desc(portalActivityLog.createdAt)],
          limit: input.limit,
          offset: input.offset,
        });

        const totalCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(portalActivityLog)
          .where(and(...conditions));

        return {
          activities,
          totalCount: Number(totalCount[0]?.count ?? 0),
          limit: input.limit,
          offset: input.offset,
        };
      }),

    getActivityStats: staffProcedure
      .input(
        z.object({
          clientId: z.string().uuid(),
        })
      )
      .handler(async ({ input }) => {
        const { db } = await import("@gk-nexus/db");

        const activities = await db.query.portalActivityLog.findMany({
          where: eq(portalActivityLog.clientId, input.clientId),
          orderBy: [desc(portalActivityLog.createdAt)],
        });

        const logins = activities.filter((a) => a.action === "LOGIN");
        const downloads = activities.filter(
          (a) => a.action === "DOWNLOAD_DOCUMENT"
        );

        // Calculate average session duration (login to logout)
        let totalSessionDuration = 0;
        let sessionCount = 0;

        for (let i = 0; i < activities.length - 1; i++) {
          if (activities[i].action === "LOGIN") {
            const nextLogout = activities
              .slice(i + 1)
              .find((a) => a.action === "LOGOUT");
            if (nextLogout) {
              const duration =
                new Date(nextLogout.createdAt).getTime() -
                new Date(activities[i].createdAt).getTime();
              totalSessionDuration += duration;
              sessionCount++;
            }
          }
        }

        const avgSessionDuration =
          sessionCount > 0 ? totalSessionDuration / sessionCount / 1000 / 60 : 0;

        return {
          totalLogins: logins.length,
          totalDownloads: downloads.length,
          avgSessionDuration: Math.round(avgSessionDuration),
          lastLoginAt: logins[0]?.createdAt || null,
          totalActivities: activities.length,
        };
      }),

    getImpersonationHistory: staffProcedure
      .input(
        z.object({
          clientId: z.string().uuid(),
        })
      )
      .handler(async ({ input }) => {
        const { db } = await import("@gk-nexus/db");

        const impersonations =
          await db.query.staffImpersonationSession.findMany({
            where: eq(staffImpersonationSession.clientId, input.clientId),
            with: {
              staffUser: true,
              portalUser: true,
            },
            orderBy: [desc(staffImpersonationSession.startedAt)],
          });

        return impersonations;
      }),
  },
};
```

#### 5. `/packages/api/src/routers/index.ts`

Add to imports:
```typescript
import { clientServicesRouter } from "./client-services";
import { knowledgeBaseRouter } from "./knowledge-base";
```

Add to appRouter object:
```typescript
export const appRouter = {
  // ... existing routers
  clientServices: clientServicesRouter,
  knowledgeBase: knowledgeBaseRouter,
  // ... rest
};
```

### After Schema Sync: Regenerate Types

Once all schema files are updated, run:
```bash
bun run db:push
```

This will sync the schema to the database and regenerate TypeScript types.

---

## Your Task: Implement Sprints 2-7 (UI Components)

### Sprint 2: Wizard Integration (Week 2)

**Goal**: Integrate document upload into client onboarding wizard as optional Step 7.

#### Files to Create/Modify:

1. **Update Wizard Types** (`apps/web/src/components/wizards/client-onboarding/types.ts`)

Add to ClientOnboardingData type:
```typescript
export type ClientOnboardingData = {
  // ... existing fields

  // NEW: Step 7 - Documents (optional)
  documents?: {
    files: File[];
    uploads: Array<{
      file: File;
      category: DocumentCategory;
      description: string;
      linkedService?: string; // service code
      linkedRequirement?: string; // requirement name
    }>;
  };
};

// Helper function
export function getRequiredDocumentsByServices(
  data: ClientOnboardingData
): Record<string, string[]> {
  // TODO: Fetch from serviceCatalog based on gcmcServices and kajServices
  // Map service codes to their documentRequirements arrays
  // Return aggregated requirements by service
  return {};
}
```

2. **Create Document Upload Step** (`apps/web/src/components/wizards/client-onboarding/step-documents.tsx`)

```typescript
import { WizardStep } from "@/components/ui/wizard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { ClientOnboardingData } from "./types";

export function StepDocuments({
  data,
  updateData,
  errors,
}: WizardStepProps<ClientOnboardingData>) {
  const requirements = getRequiredDocumentsByServices(data);

  return (
    <WizardStep
      title="Upload Documents"
      description="Upload required documents based on selected services (optional)"
    >
      {/* Document fulfillment progress */}
      <DocumentFulfillmentProgress
        required={Object.values(requirements).flat()}
        uploaded={data.documents?.uploads || []}
      />

      {/* Service-grouped upload zones */}
      {Object.entries(requirements).map(([service, docs]) => (
        <ServiceDocumentGroup
          key={service}
          serviceName={service}
          requiredDocs={docs}
          onUpload={(file, category, description) => {
            // Add to data.documents.uploads
          }}
        />
      ))}

      {/* Prominent skip button */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You can upload these documents later from the client detail page.
        </AlertDescription>
      </Alert>
    </WizardStep>
  );
}
```

3. **Update Onboarding Page** (`apps/web/src/routes/app/clients/onboard.tsx`)

Modify:
- Change `TOTAL_STEPS` from 6 to 7
- Add Step 7 rendering
- Update `createMutation` to call `orpc.clientServices.saveSelections`
- Handle document uploads and link to services

**Key Changes**:
```typescript
const TOTAL_STEPS = 7; // Was 6

const createMutation = useMutation({
  mutationFn: async (data: ClientOnboardingData) => {
    // 1. Create client (existing logic)
    const client = await orpc.clients.create.mutate({ ... });

    // 2. NEW: Save service selections
    if (data.gcmcServices?.length || data.kajServices?.length) {
      await orpc.clientServices.saveSelections.mutate({
        clientId: client.id,
        gcmcServices: data.gcmcServices || [],
        kajServices: data.kajServices || [],
      });
    }

    // 3. NEW: Upload documents and link to services
    if (data.documents?.uploads?.length) {
      for (const upload of data.documents.uploads) {
        // a. Prepare upload
        const doc = await orpc.documents.prepareUpload.mutate({
          fileName: upload.file.name,
          mimeType: upload.file.type,
          fileSize: upload.file.size,
          category: upload.category,
          description: upload.description,
          clientId: client.id,
        });

        // b. Upload file
        await uploadFile(doc.id, upload.file);

        // c. Link to service if specified
        if (upload.linkedService) {
          const selection = /* find selection by service code */;
          await orpc.clientServices.linkDocument.mutate({
            selectionId: selection.id,
            documentId: doc.id,
            requirementName: upload.linkedRequirement,
          });
        }
      }
    }

    return client;
  },
});

// Add Step 7 rendering
{currentStep === 6 && (
  <StepDocuments data={data} updateData={updateData} errors={errors} />
)}
```

4. **Create Post-Onboarding Document Collection Page** (`apps/web/src/routes/app/clients/$client-id/documents/collect.tsx`)

```typescript
export function ClientDocumentCollectionPage() {
  const { clientId } = useParams();
  const { data: services } = orpc.clientServices.getByClient.useQuery({ clientId });
  const { data: progress } = orpc.clientServices.getFulfillmentProgress.useQuery({ clientId });

  return (
    <div>
      <PageHeader
        title="Collect Required Documents"
        description={`${progress.uploaded} of ${progress.total} documents uploaded`}
      />

      <Progress value={(progress.uploaded / progress.total) * 100} />

      {services.map(service => (
        <ServiceDocumentCollectionCard
          key={service.id}
          service={service}
          onDocumentUploaded={() => refetch()}
        />
      ))}
    </div>
  );
}
```

---

### Sprint 3-4: Knowledge Base UI (Weeks 3-4)

**Goal**: Staff KB browser, admin management, client portal resources section.

#### Files to Create:

1. **Staff KB Browser** (`apps/web/src/routes/app/knowledge-base/index.tsx`)

Features:
- Sidebar filters (type, category, business, search)
- Grid of KB items with cards
- Preview modal with download/auto-fill buttons
- Search functionality

2. **Admin KB Management** (`apps/web/src/routes/app/admin/knowledge-base.tsx`)

Features:
- Table view with CRUD operations
- File upload for forms (PDFs)
- Content editor for guides (markdown)
- Link to document templates for auto-fill
- Visibility controls (staff-only checkbox)
- Featured flag, category, business selectors

3. **Client Portal Resources** (`apps/web/src/routes/portal/resources.tsx`)

Features:
- Simplified KB browser for clients
- Only shows `isStaffOnly=false` items
- Filtered by client's businesses
- Download-only (no auto-fill)
- Simple grid layout

4. **Initial KB Items** - Create 45 initial items via seed script:
   - 8 GRA forms (tax returns, PAYE, VAT, TIN, etc.)
   - 6 NIS forms (E1, E2, F200F2, pension, etc.)
   - 5 Immigration forms (work permit, visa, citizenship, etc.)
   - 4 DCRA forms (incorporation, registration, renewal, etc.)
   - 10 Letter templates (engagement letters, support letters, etc.)
   - 12 Guides (6 staff-only, 6 client-accessible)

**Reference**: See `/specs/phase-2/guyanese-agency-forms-catalog.md` for complete list.

---

### Sprint 5-6: Staff Impersonation & Portal Activity (Weeks 5-6)

**Goal**: Impersonation UI, portal preview, activity dashboard.

#### Files to Create:

1. **Impersonation Hook** (`apps/web/src/hooks/use-impersonation.ts`)

```typescript
export function useImpersonation() {
  const navigate = useNavigate();

  const startImpersonation = async (clientId: string, reason: string) => {
    const { token } = await orpc.portal.impersonation.start.mutate({
      clientId,
      reason,
    });

    sessionStorage.setItem('impersonation_token', token);
    sessionStorage.setItem('impersonated_client_id', clientId);

    navigate(`/portal?impersonated=true`);
  };

  const endImpersonation = async () => {
    const token = sessionStorage.getItem('impersonation_token');
    if (token) {
      await orpc.portal.impersonation.end.mutate({ token });
      sessionStorage.removeItem('impersonation_token');
      sessionStorage.removeItem('impersonated_client_id');
    }
    navigate('/app/clients');
  };

  const isImpersonating = () => {
    return !!sessionStorage.getItem('impersonation_token');
  };

  return { startImpersonation, endImpersonation, isImpersonating };
}
```

2. **Client Detail Portal Actions Menu** (`apps/web/src/routes/app/clients/$client-id.tsx`)

Add dropdown menu in header:
- View as Client (Full) - Start impersonation
- Preview Portal (Panel) - Open side sheet
- Portal Activity - Navigate to activity dashboard
- Send Portal Invite

3. **Impersonation Banner** (`apps/web/src/components/portal/impersonation-banner.tsx`)

```typescript
export function ImpersonationBanner() {
  const { isImpersonating, endImpersonation } = useImpersonation();
  const clientName = sessionStorage.getItem('impersonated_client_name');

  if (!isImpersonating()) return null;

  return (
    <div className="bg-amber-100 border-b border-amber-300 px-4 py-2">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <span className="font-medium text-amber-900">
            Viewing portal as {clientName}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={endImpersonation}
        >
          Exit Impersonation
        </Button>
      </div>
    </div>
  );
}
```

Add to all portal pages layout.

4. **Portal Preview Panel** (`apps/web/src/components/portal/portal-preview-panel.tsx`)

Sheet component with iframe preview showing portal pages (dashboard, matters, documents, financials).

5. **Portal Activity Dashboard** (`apps/web/src/routes/app/clients/$client-id/portal-activity.tsx`)

Features:
- Summary stats (total logins, avg session, downloads, last login)
- Activity timeline with filters
- Login history table
- Impersonation history audit trail

---

### Sprint 7: Enhanced Document Display (Week 7)

**Goal**: Client documents tab, portal enhancements, matter-linked documents.

#### Files to Create/Modify:

1. **Client Documents Tab** (`apps/web/src/components/clients/client-documents-tab.tsx`)

Add new tab to client detail page with:
- Document fulfillment progress bar
- View selector (by-service, all, expiring)
- Service-grouped document cards
- Upload button

2. **Enhanced Portal Documents Page** (`apps/web/src/routes/portal/documents.tsx`)

Add features:
- Group by selector (matter, category, all)
- Filter (all, required, expiring)
- Document list with download buttons
- Download all (ZIP) functionality

3. **Matter-Linked Documents** - Add document sections to:
- `/apps/web/src/routes/app/matters/$matter-id.tsx` (staff)
- `/apps/web/src/routes/portal/matters/$matter-id.tsx` (portal)

---

## Code Quality Standards

**CRITICAL**: Follow GK-Nexus project standards:

1. **Run `npx ultracite fix` before every commit**
2. **No `any` types** - Use `unknown` if type is genuinely unknown
3. **Explicit error handling** - User-friendly messages with context
4. **Loading and error states** - All UI must handle loading/error gracefully
5. **Mobile responsive** - All components must work on mobile
6. **Accessibility** - WCAG 2.1 AA compliance (semantic HTML, ARIA labels, keyboard navigation)
7. **No mock data** - NO MOCK DATA POLICY (see CLAUDE.md)
8. **Conventional commits** - `feat(scope): description`
9. **Update CHANGELOG.md** - Add entries under [Unreleased]

---

## Testing Requirements

### Unit Tests
- Service selection persistence
- Document fulfillment calculation
- KB item filtering and search
- Impersonation token generation

### Integration Tests
- Wizard → Service selection → Document upload flow
- KB auto-fill → Template generation
- Impersonation → Portal navigation → Activity logging

### E2E Tests (Playwright)
1. Complete client onboarding with document upload
2. Post-onboarding document collection
3. Staff impersonation flow (start → navigate → end)
4. KB browsing and download
5. Portal document viewing and download

---

## Reference Documentation

### Critical Files to Review:
- `/specs/implementations/sprint-1-database-schema.md` - Complete Sprint 1 implementation log
- `/specs/phase-2/document-management-system.md` - Document upload specs
- `/specs/phase-2/knowledge-base-system.md` - KB system specs
- `/specs/phase-2/staff-portal-management.md` - Impersonation & activity specs
- `/specs/phase-2/client-service-tracking.md` - Service selection specs
- `/CLAUDE.md` - Project standards and commands
- `/specs/design-system.md` - UI/UX guidelines
- `/specs/ux-guidelines.md` - User experience patterns

### API Endpoints Available:

**Client Services**:
- `orpc.clientServices.saveSelections({ clientId, gcmcServices, kajServices })`
- `orpc.clientServices.getByClient({ clientId })`
- `orpc.clientServices.getFulfillmentProgress({ clientId })`
- `orpc.clientServices.linkDocument({ selectionId, documentId, requirementName })`

**Knowledge Base**:
- `orpc.knowledgeBase.list({ type?, category?, business?, search? })`
- `orpc.knowledgeBase.getById({ id })`
- `orpc.knowledgeBase.download({ id })`
- `orpc.knowledgeBase.autoFill({ id, clientId?, matterId? })`
- `orpc.knowledgeBase.create(...)` (admin)
- `orpc.knowledgeBase.update(...)` (admin)

**Portal Impersonation**:
- `orpc.portal.impersonation.start({ clientId, reason })`
- `orpc.portal.impersonation.end({ token })`
- `orpc.portal.impersonation.listActive()` (admin)

**Portal Analytics**:
- `orpc.portal.analytics.getPortalActivity({ clientId, startDate?, endDate?, action? })`
- `orpc.portal.analytics.getActivityStats({ clientId })`
- `orpc.portal.analytics.getImpersonationHistory({ clientId })`

---

## Database Migration Issue

**NOTE**: The database migration failed with error "type already exists" because the database already has existing schema. You may need to:

1. Generate a new incremental migration that only adds the new tables:
   ```bash
   bun run db:generate
   ```

2. OR manually apply only the new table creations from the migration file.

3. OR use `bun run db:push` to sync schema (development only).

The migration file `/packages/db/src/migrations/0000_dapper_titania.sql` contains all the correct SQL for the new tables.

---

## Implementation Timeline

- **Week 2**: Sprint 2 - Wizard Integration
- **Week 3-4**: Sprint 3-4 - Knowledge Base UI
- **Week 5-6**: Sprint 5-6 - Impersonation & Portal Activity
- **Week 7**: Sprint 7 - Document Display Enhancements
- **Week 8**: Testing, Polish, Documentation

---

## Success Metrics

- Document upload rate: % of clients with all required documents uploaded
- KB usage: Downloads per week, most popular forms
- Impersonation: Average session duration, issues resolved via impersonation
- Portal adoption: % of clients with portal accounts, login frequency
- Document fulfillment: Average time to collect all required documents

---

## Questions or Issues?

Refer to:
- Implementation log: `/specs/implementations/sprint-1-database-schema.md`
- Phase 2 overview: `/specs/phase-2/00-overview.md`
- CLAUDE.md: `/CLAUDE.md`

**Good luck with the implementation!** 🚀
