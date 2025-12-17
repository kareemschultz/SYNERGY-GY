import "dotenv/config";
import { createContext } from "@SYNERGY-GY/api/context";
import { appRouter } from "@SYNERGY-GY/api/routers/index";
import { startBackupScheduler } from "@SYNERGY-GY/api/utils/backup-scheduler";
import { runInitialSetup } from "@SYNERGY-GY/api/utils/initial-setup";
import { auth } from "@SYNERGY-GY/auth";
import { db, document as documentTable } from "@SYNERGY-GY/db";
import { createReadStream, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { stream } from "hono/streaming";

// Run initial setup to create first owner account (if needed)
await runInitialSetup();

// Start backup scheduler for automatic backups
startBackupScheduler();

// Storage configuration
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./data/uploads";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

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

// Validate CORS_ORIGIN in production
const CORS_ORIGIN = process.env.CORS_ORIGIN;
if (!CORS_ORIGIN && process.env.NODE_ENV === "production") {
  throw new Error("CORS_ORIGIN must be set in production environment");
}

const app = new Hono();

app.use(logger());
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

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

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

app.get("/", (c) => c.text("OK"));

export default app;
