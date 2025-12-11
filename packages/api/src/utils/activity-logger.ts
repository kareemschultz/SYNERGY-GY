import { activityLog, db } from "@SYNERGY-GY/db";

type ActivityAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "VIEW"
  | "LOGIN"
  | "LOGOUT"
  | "UPLOAD"
  | "DOWNLOAD"
  | "STATUS_CHANGE"
  | "ASSIGN"
  | "COMPLETE"
  | "ARCHIVE";

type EntityType =
  | "CLIENT"
  | "MATTER"
  | "DOCUMENT"
  | "DEADLINE"
  | "STAFF"
  | "SERVICE_TYPE"
  | "TEMPLATE"
  | "COMMUNICATION"
  | "NOTE"
  | "SESSION";

type LogActivityParams = {
  userId?: string | null;
  staffId?: string | null;
  action: ActivityAction;
  entityType: EntityType;
  entityId?: string | null;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/**
 * Logs an activity to the activity_log table
 * This is a non-blocking operation - errors are caught and logged
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await db.insert(activityLog).values({
      userId: params.userId,
      staffId: params.staffId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      description: params.description,
      metadata: params.metadata,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  } catch (error) {
    // Log error but don't throw - activity logging should not block operations
    console.error("Failed to log activity:", error);
  }
}

/**
 * Helper to create activity descriptions
 */
export function createActivityDescription(
  action: ActivityAction,
  entityType: EntityType,
  details?: string
): string {
  const actionMap: Record<ActivityAction, string> = {
    CREATE: "Created",
    UPDATE: "Updated",
    DELETE: "Deleted",
    VIEW: "Viewed",
    LOGIN: "Logged in",
    LOGOUT: "Logged out",
    UPLOAD: "Uploaded",
    DOWNLOAD: "Downloaded",
    STATUS_CHANGE: "Changed status of",
    ASSIGN: "Assigned",
    COMPLETE: "Completed",
    ARCHIVE: "Archived",
  };

  const entityMap: Record<EntityType, string> = {
    CLIENT: "client",
    MATTER: "matter",
    DOCUMENT: "document",
    DEADLINE: "deadline",
    STAFF: "staff member",
    SERVICE_TYPE: "service type",
    TEMPLATE: "template",
    COMMUNICATION: "communication",
    NOTE: "note",
    SESSION: "session",
  };

  const base = `${actionMap[action]} ${entityMap[entityType]}`;
  return details ? `${base}: ${details}` : base;
}

type LogContext = {
  session?: { user?: { id: string } } | null;
  staff?: { id: string } | null;
  ipAddress?: string;
  userAgent?: string;
};

type LogParams = {
  action: ActivityAction;
  entityType: EntityType;
  entityId: string | null;
  description: string;
  metadata?: Record<string, unknown>;
};

/**
 * Context-aware activity logger that extracts user info from context
 */
export function createActivityLogger(context: LogContext) {
  return async function log(params: LogParams): Promise<void> {
    await logActivity({
      userId: context.session?.user?.id,
      staffId: context.staff?.id,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      description: params.description,
      metadata: params.metadata,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  };
}
