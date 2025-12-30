/// <reference types="bun-types" />
import "dotenv/config";
import { createContext } from "@SYNERGY-GY/api/context";
import { getAccessibleBusinesses } from "@SYNERGY-GY/api/index";
import { appRouter } from "@SYNERGY-GY/api/routers/index";
import { startBackupScheduler } from "@SYNERGY-GY/api/utils/backup-scheduler";
import { runInitialSetup } from "@SYNERGY-GY/api/utils/initial-setup";
import { signupProtectionMiddleware } from "@SYNERGY-GY/api/utils/signup-protection";
import { auth } from "@SYNERGY-GY/auth";
import {
  and,
  client,
  db,
  document as documentTable,
  eq,
  gte,
  knowledgeBaseDownload,
  knowledgeBaseItem,
  portalDocumentUpload,
  portalSession,
  portalUser,
  staff,
  systemBackup,
} from "@SYNERGY-GY/db";
import { createReadStream, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { stream } from "hono/streaming";
import { rateLimiter } from "hono-rate-limiter";

// Run initial setup to create first owner account (if needed)
await runInitialSetup();

// Start backup scheduler for automatic backups
startBackupScheduler();

// Start appointment reminder processor for sending scheduled reminders
import("@SYNERGY-GY/api/utils/reminder-processor").then(
  ({ startReminderProcessor }) => startReminderProcessor()
);

// Storage configuration
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./data/uploads";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Rate limiting configuration
// Session checks: Very lenient (100 req/min) - called frequently during navigation
const sessionRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 100, // 100 requests per minute - session checks happen on every route
  standardHeaders: "draft-6",
  keyGenerator: (c) => {
    const forwarded = c.req.header("x-forwarded-for");
    const ip =
      forwarded?.split(",")[0]?.trim() ||
      c.req.header("x-real-ip") ||
      "unknown";
    return `session:${ip}`;
  },
  message: {
    error: "Too many session requests. Please slow down.",
  },
});

// Auth endpoints: Moderate limit (50 req/min) - covers sign-out, password ops, etc.
const authRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 50, // 50 requests per minute for other auth operations
  standardHeaders: "draft-6",
  keyGenerator: (c) => {
    const forwarded = c.req.header("x-forwarded-for");
    const ip =
      forwarded?.split(",")[0]?.trim() ||
      c.req.header("x-real-ip") ||
      "unknown";
    return `auth:${ip}`;
  },
  message: {
    error: "Too many authentication attempts. Please try again later.",
  },
});

// Login/Signup: Stricter limit to prevent brute force (10 req/min)
const loginRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 10, // 10 login attempts per minute
  standardHeaders: "draft-6",
  keyGenerator: (c) => {
    const forwarded = c.req.header("x-forwarded-for");
    const ip =
      forwarded?.split(",")[0]?.trim() ||
      c.req.header("x-real-ip") ||
      "unknown";
    return `login:${ip}`;
  },
  message: {
    error: "Too many login attempts. Please try again in a minute.",
  },
});

// API endpoints: Moderate limits (100 req/min)
const apiRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 100, // 100 requests per minute
  standardHeaders: "draft-6",
  keyGenerator: (c) => {
    const forwarded = c.req.header("x-forwarded-for");
    const ip =
      forwarded?.split(",")[0]?.trim() ||
      c.req.header("x-real-ip") ||
      "unknown";
    return `api:${ip}`;
  },
  message: { error: "Too many requests. Please slow down." },
});

// File upload: Strict limits (10 req/min)
const uploadRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 10, // 10 uploads per minute
  standardHeaders: "draft-6",
  keyGenerator: (c) => {
    const forwarded = c.req.header("x-forwarded-for");
    const ip =
      forwarded?.split(",")[0]?.trim() ||
      c.req.header("x-real-ip") ||
      "unknown";
    return `upload:${ip}`;
  },
  message: { error: "Too many upload attempts. Please try again later." },
});

// Regex patterns (module-level for performance)
const PORTAL_SESSION_REGEX = /portal_session=([^;]+)/;

// Allowed MIME types
const ALLOWED_MIME_TYPES = new Set([
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  // Text
  "text/plain",
  "text/csv",
]);

type Business = "GCMC" | "KAJ";

/**
 * Validate that a user has business access to a document
 * Returns null if access is granted, or an error message if denied
 */
async function validateDocumentBusinessAccess(
  userId: string,
  clientId: string | null
): Promise<string | null> {
  // Documents without a client are accessible to all authenticated staff
  if (!clientId) {
    return null;
  }

  // Get user's staff profile
  const staffProfile = await db.query.staff.findFirst({
    where: eq(staff.userId, userId),
  });

  if (!staffProfile) {
    return "Staff profile not found";
  }

  // Get accessible businesses
  const accessibleBusinesses = getAccessibleBusinesses(staffProfile);
  if (accessibleBusinesses.length === 0) {
    return "No accessible businesses";
  }

  // Get client's businesses
  const clientRecord = await db.query.client.findFirst({
    where: eq(client.id, clientId),
    columns: { businesses: true },
  });

  if (!clientRecord) {
    return "Client not found";
  }

  // Check if staff has access to at least one of the client's businesses
  const hasAccess = clientRecord.businesses.some((b) =>
    accessibleBusinesses.includes(b as Business)
  );

  if (!hasAccess) {
    return "You don't have access to this document";
  }

  return null;
}

// Validate CORS_ORIGIN in production
const CORS_ORIGIN = process.env.CORS_ORIGIN;
if (!CORS_ORIGIN && process.env.NODE_ENV === "production") {
  throw new Error("CORS_ORIGIN must be set in production environment");
}

// Top-level regex patterns for static asset matching
const HASHED_ASSET_REGEX = /\.[a-zA-Z0-9]{8,}\.(js|css)$/;
const STATIC_ASSET_REGEX =
  /\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$/;

const app = new Hono();

console.log("SERVER_BOOT_MARKER", new Date().toISOString());

// Hard-block RPC paths with dots (middleware guard, runs before other handlers)
// This prevents Request mutation issues and provides clear error messages
const DOT_IN_RPC_PATH = /^\/rpc\/.*\..*$/;
app.use("/*", async (c, next) => {
  // Use c.req.path directly instead of parsing URL (avoids errors with relative paths)
  const path = c.req.path;
  if (DOT_IN_RPC_PATH.test(path)) {
    const expectedPath = path.replace(/\./g, "/");
    console.log(
      `[DOT_PATH_BLOCKED] receivedPath: ${path}, expectedPath: ${expectedPath}`
    );
    return c.json(
      {
        error: "Invalid RPC path format",
        message: "Use forward slashes instead of dots.",
        receivedPath: path,
        expectedPath,
      },
      400
    );
  }
  await next();
});

app.use(
  "/*",
  cors({
    origin: (origin) => {
      // Development: allow localhost origins
      if (
        process.env.NODE_ENV !== "production" &&
        (!origin || origin.startsWith("http://localhost"))
      ) {
        return origin || "*";
      }
      // Production: check against configured origins
      const allowedOrigins = CORS_ORIGIN?.split(",").map((o) => o.trim()) || [];
      if (allowedOrigins.includes(origin || "")) {
        return origin || null;
      }
      return null;
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Security headers - protect against common web vulnerabilities
app.use(
  "/*",
  secureHeaders({
    xFrameOptions: "DENY",
    xContentTypeOptions: "nosniff",
    referrerPolicy: "strict-origin-when-cross-origin",
    strictTransportSecurity: "max-age=31536000; includeSubDomains",
    crossOriginOpenerPolicy: "same-origin",
    crossOriginResourcePolicy: "same-origin",
  })
);

// Rate limiting - Session checks (most lenient: 100 req/min - called on every navigation)
app.use("/api/auth/get-session", sessionRateLimiter);

// Rate limiting - Login/Signup (strictest: 10 req/min to prevent brute force)
app.use("/api/auth/sign-in/*", loginRateLimiter);
app.use("/api/auth/sign-up/*", loginRateLimiter);

// Rate limiting - Other auth endpoints (moderate: 50 req/min)
app.use("/api/auth/*", authRateLimiter);

// Signup protection middleware - validates invite tokens before allowing registration
// This MUST run before the auth handler to intercept signup requests
app.use("/api/auth/*", signupProtectionMiddleware());

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Rate limiting - File uploads (strict: 10 req/min)
app.use("/api/upload/*", uploadRateLimiter);
app.use("/api/portal-upload/*", uploadRateLimiter);

// Rate limiting - RPC/API endpoints (moderate: 100 req/min)
app.use("/rpc/*", apiRateLimiter);

// File upload handler
app.post("/api/upload/:documentId", async (c) => {
  const documentId = c.req.param("documentId");

  // Get session from auth
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Check document exists and is in PENDING status
  const doc = await db.query.document.findFirst({
    where: eq(documentTable.id, documentId),
  });

  if (!doc) {
    return c.json({ error: "Document record not found" }, 404);
  }

  if (doc.status !== "PENDING") {
    return c.json({ error: "Document already uploaded" }, 400);
  }

  // SECURITY: Validate business access to document
  const accessError = await validateDocumentBusinessAccess(
    session.user.id,
    doc.clientId
  );
  if (accessError) {
    return c.json({ error: accessError }, 403);
  }

  // Parse multipart form data
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return c.json(
      {
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      },
      400
    );
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return c.json({ error: "File type not allowed" }, 400);
  }

  // Generate storage path: /data/uploads/YYYY/MM/clientId/documentId_filename
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const clientFolder = doc.clientId || "general";

  // Sanitize original filename
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const fileName = `${documentId}_${sanitizedName}`;
  const relativePath = `${year}/${month}/${clientFolder}/${fileName}`;
  const fullPath = join(UPLOAD_DIR, relativePath);

  // Create directory if needed
  await mkdir(dirname(fullPath), { recursive: true });

  // Write file
  const arrayBuffer = await file.arrayBuffer();
  await writeFile(fullPath, Buffer.from(arrayBuffer));

  // Update document record
  const [updated] = await db
    .update(documentTable)
    .set({
      fileName,
      originalName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      storagePath: relativePath,
      status: "ACTIVE",
    })
    .where(eq(documentTable.id, documentId))
    .returning();

  if (!updated) {
    return c.json({ error: "Failed to update document record" }, 500);
  }

  return c.json({
    success: true,
    document: {
      id: updated.id,
      fileName: updated.fileName,
      originalName: updated.originalName,
      fileSize: updated.fileSize,
      mimeType: updated.mimeType,
    },
  });
});

// Portal file upload handler (for portal users)
app.post("/api/portal-upload/:documentId", async (c) => {
  const documentId = c.req.param("documentId");

  // Get portal session from cookie
  const sessionToken = c.req.raw.headers
    .get("cookie")
    ?.match(PORTAL_SESSION_REGEX)?.[1];
  if (!sessionToken) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Verify portal session
  const [session] = await db
    .select({
      id: portalSession.id,
      portalUserId: portalSession.portalUserId,
      expiresAt: portalSession.expiresAt,
    })
    .from(portalSession)
    .where(
      and(
        eq(portalSession.token, sessionToken),
        gte(portalSession.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!session) {
    return c.json({ error: "Invalid or expired session" }, 401);
  }

  // Get portal user
  const [pUser] = await db
    .select({
      id: portalUser.id,
      clientId: portalUser.clientId,
    })
    .from(portalUser)
    .where(eq(portalUser.id, session.portalUserId))
    .limit(1);

  if (!pUser) {
    return c.json({ error: "Portal user not found" }, 401);
  }

  // Check document exists and is in PENDING status
  const doc = await db.query.document.findFirst({
    where: eq(documentTable.id, documentId),
  });

  if (!doc) {
    return c.json({ error: "Document record not found" }, 404);
  }

  if (doc.status !== "PENDING") {
    return c.json({ error: "Document already uploaded" }, 400);
  }

  // Verify document belongs to this client
  if (doc.clientId !== pUser.clientId) {
    return c.json({ error: "Unauthorized access to document" }, 403);
  }

  // Verify portal upload record exists
  const [uploadRecord] = await db
    .select()
    .from(portalDocumentUpload)
    .where(eq(portalDocumentUpload.documentId, documentId))
    .limit(1);

  if (!uploadRecord || uploadRecord.portalUserId !== pUser.id) {
    return c.json({ error: "Upload not authorized" }, 403);
  }

  // Parse multipart form data
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return c.json(
      {
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      },
      400
    );
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return c.json({ error: "File type not allowed" }, 400);
  }

  // Generate storage path: /data/uploads/portal/YYYY/MM/clientId/documentId_filename
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  // Sanitize original filename
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const fileName = `${documentId}_${sanitizedName}`;
  const relativePath = `portal/${year}/${month}/${pUser.clientId}/${fileName}`;
  const fullPath = join(UPLOAD_DIR, relativePath);

  // Create directory if needed
  await mkdir(dirname(fullPath), { recursive: true });

  // Write file
  const arrayBuffer = await file.arrayBuffer();
  await writeFile(fullPath, Buffer.from(arrayBuffer));

  // Update document record
  const [updated] = await db
    .update(documentTable)
    .set({
      fileName,
      originalName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      storagePath: relativePath,
      status: "ACTIVE",
    })
    .where(eq(documentTable.id, documentId))
    .returning();

  if (!updated) {
    return c.json({ error: "Failed to update document record" }, 500);
  }

  return c.json({
    success: true,
    document: {
      id: updated.id,
      fileName: updated.fileName,
      originalName: updated.originalName,
      fileSize: updated.fileSize,
      mimeType: updated.mimeType,
    },
  });
});

// File download handler
app.get("/api/download/:documentId", async (c) => {
  const documentId = c.req.param("documentId");

  // Get session from auth
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Get document
  const doc = await db.query.document.findFirst({
    where: eq(documentTable.id, documentId),
  });

  if (!doc) {
    return c.json({ error: "Document not found" }, 404);
  }

  if (doc.status !== "ACTIVE") {
    return c.json({ error: "Document not available" }, 404);
  }

  // SECURITY: Validate business access to document
  const accessError = await validateDocumentBusinessAccess(
    session.user.id,
    doc.clientId
  );
  if (accessError) {
    return c.json({ error: accessError }, 403);
  }

  // Check file exists
  const fullPath = join(UPLOAD_DIR, doc.storagePath);
  if (!existsSync(fullPath)) {
    return c.json({ error: "File not found on disk" }, 404);
  }

  // Stream the file
  const fileStream = createReadStream(fullPath);

  return stream(c, async (streamInstance) => {
    c.header("Content-Type", doc.mimeType);
    c.header("Content-Length", doc.fileSize.toString());
    c.header(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(doc.originalName)}"`
    );

    const readable = Readable.toWeb(fileStream) as ReadableStream<Uint8Array>;
    const reader = readable.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      await streamInstance.write(value);
    }
  });
});

// Backup file download handler (admin only)
app.get("/api/backup/download/:backupId", async (c) => {
  const backupId = c.req.param("backupId");

  // Get session from auth
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Check if user has admin role
  const staffRecord = await db.query.staff.findFirst({
    where: eq(staff.userId, session.user.id),
  });

  const ADMIN_ROLES = ["OWNER", "GCMC_MANAGER", "KAJ_MANAGER"];
  if (!(staffRecord && ADMIN_ROLES.includes(staffRecord.role))) {
    return c.json({ error: "Admin access required" }, 403);
  }

  // Get backup record
  const backup = await db.query.systemBackup.findFirst({
    where: eq(systemBackup.id, backupId),
  });

  if (!backup) {
    return c.json({ error: "Backup not found" }, 404);
  }

  if (!backup.filePath) {
    return c.json({ error: "Backup file path not available" }, 404);
  }

  // Check file exists
  if (!existsSync(backup.filePath)) {
    return c.json({ error: "Backup file not found on disk" }, 404);
  }

  // Stream the file
  const fileStream = createReadStream(backup.filePath);
  const fileName = backup.name.endsWith(".zip")
    ? backup.name
    : `${backup.name}.zip`;

  return stream(c, async (streamInstance) => {
    c.header("Content-Type", "application/zip");
    if (backup.fileSize) {
      c.header("Content-Length", backup.fileSize.toString());
    }
    c.header(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );

    const readable = Readable.toWeb(fileStream) as ReadableStream<Uint8Array>;
    const reader = readable.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      await streamInstance.write(value);
    }
  });
});

// Google Drive OAuth callback handler
app.get("/api/auth/google-drive/callback", async (c) => {
  const code = c.req.query("code");
  // Note: state param available via c.req.query("state") for future CSRF protection
  const error = c.req.query("error");

  // Build redirect URL for frontend
  const frontendUrl = process.env.VITE_APP_URL || "http://localhost:3000";
  const redirectUrl = new URL("/app/settings/backup", frontendUrl);

  if (error) {
    redirectUrl.searchParams.set("google_drive_error", error);
    return c.redirect(redirectUrl.toString());
  }

  if (!code) {
    redirectUrl.searchParams.set("google_drive_error", "no_code");
    return c.redirect(redirectUrl.toString());
  }

  try {
    // Exchange code for tokens
    const { exchangeCodeForTokens } = await import(
      "@SYNERGY-GY/api/utils/google-drive-storage"
    );

    const result = await exchangeCodeForTokens(code);
    if (!result.success) {
      redirectUrl.searchParams.set(
        "google_drive_error",
        result.error || "token_exchange_failed"
      );
      return c.redirect(redirectUrl.toString());
    }

    // Success - redirect back to backup settings
    redirectUrl.searchParams.set("google_drive_connected", "true");
    return c.redirect(redirectUrl.toString());
  } catch (err) {
    console.error("[GoogleDrive] OAuth callback error:", err);
    redirectUrl.searchParams.set("google_drive_error", "callback_failed");
    return c.redirect(redirectUrl.toString());
  }
});

// Knowledge Base file download handler
app.get("/api/knowledge-base/download/:itemId", async (c) => {
  const itemId = c.req.param("itemId");

  // Get session from auth (optional - some KB items are public)
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  // Get KB item
  const item = await db.query.knowledgeBaseItem.findFirst({
    where: and(
      eq(knowledgeBaseItem.id, itemId),
      eq(knowledgeBaseItem.isActive, true)
    ),
  });

  if (!item) {
    return c.json({ error: "Resource not found" }, 404);
  }

  // Check if staff-only and user is authenticated
  if (item.isStaffOnly && !session?.user) {
    return c.json({ error: "This resource is only available to staff" }, 403);
  }

  if (!item.storagePath) {
    // If no file but has agency URL, redirect to official source
    if (item.agencyUrl) {
      return c.redirect(item.agencyUrl);
    }
    return c.json({ error: "No file attached to this resource" }, 404);
  }

  // Check file exists
  const fullPath = join(UPLOAD_DIR, item.storagePath);
  if (!existsSync(fullPath)) {
    return c.json({ error: "File not found on disk" }, 404);
  }

  // Log download if user is authenticated
  if (session?.user) {
    await db.insert(knowledgeBaseDownload).values({
      knowledgeBaseItemId: item.id,
      downloadedById: session.user.id,
      downloadedByType: "STAFF",
    });
  }

  // Stream the file
  const fileStream = createReadStream(fullPath);
  const fileName = item.fileName || item.title.replace(/[^a-zA-Z0-9.-]/g, "_");
  const mimeType = item.mimeType || "application/octet-stream";

  return stream(c, async (streamInstance) => {
    c.header("Content-Type", mimeType);
    c.header(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );

    const readable = Readable.toWeb(fileStream) as ReadableStream<Uint8Array>;
    const reader = readable.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      await streamInstance.write(value);
    }
  });
});

export const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

app.use("/*", async (c, next) => {
  const context = await createContext({ context: c });

  const rpcResult = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context,
  });

  if (rpcResult.matched) {
    return c.newResponse(rpcResult.response.body, rpcResult.response);
  }

  const apiResult = await apiHandler.handle(c.req.raw, {
    prefix: "/api-reference",
    context,
  });

  if (apiResult.matched) {
    return c.newResponse(apiResult.response.body, apiResult.response);
  }

  await next();
});

// Health check endpoint for Docker
app.get("/health", async (c) => {
  try {
    // Test database connection by querying a table
    await db.query.staff.findFirst();
    return c.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return c.json(
      {
        status: "unhealthy",
        error: "Database connection failed",
        timestamp: new Date().toISOString(),
      },
      503
    );
  }
});

// Serve static files from the frontend build
const FRONTEND_DIST = process.env.FRONTEND_DIST || "/app/apps/web/dist";

// Only serve static files for non-API routes
// This prevents serveStatic from intercepting /rpc/* and /api/* requests
app.use("/*", (c, next) => {
  // Use c.req.path directly instead of parsing URL (avoids errors with relative paths)
  const path = c.req.path;

  // Skip static file serving for API routes
  if (
    path.startsWith("/rpc/") ||
    path.startsWith("/api/") ||
    path.startsWith("/api-reference/")
  ) {
    return next();
  }

  // Set cache headers based on file type
  // Hashed assets (Vite bundles) can be cached long-term
  // Non-hashed assets should have shorter cache times
  const isHashedAsset = HASHED_ASSET_REGEX.test(path);
  const isStaticAsset = STATIC_ASSET_REGEX.test(path);

  if (isHashedAsset) {
    // Hashed assets are immutable - cache for 1 year
    c.header("Cache-Control", "public, max-age=31536000, immutable");
  } else if (isStaticAsset) {
    // Non-hashed assets - cache for 1 hour, must revalidate
    c.header("Cache-Control", "public, max-age=3600, must-revalidate");
  }

  // Serve static files for everything else
  return serveStatic({
    root: FRONTEND_DIST,
    onNotFound: (_path, ctx) => {
      // For client-side routing, serve index.html for all non-API routes
      ctx.redirect("/index.html", 302);
    },
  })(c, next);
});

// Fallback for SPA routing - serve index.html for any unmatched routes
app.get("*", async (c) => {
  const indexPath = join(FRONTEND_DIST, "index.html");
  if (existsSync(indexPath)) {
    const content = Bun.file(indexPath);
    // Prevent caching of index.html to ensure users get latest version
    c.header("Cache-Control", "no-cache, no-store, must-revalidate");
    c.header("Pragma", "no-cache");
    c.header("Expires", "0");
    return c.html(await content.text());
  }
  return c.text("Frontend not found", 404);
});

export default app;
