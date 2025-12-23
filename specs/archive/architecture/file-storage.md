# File Storage Architecture

## Overview

Document storage system with local primary storage and optional cloud backup. Designed for security, reliability, and easy backup/restore.

## Storage Strategy

### Two-Tier Storage

```
┌─────────────────────────────────────────────────────┐
│                    Documents                         │
└─────────────────────────────────────────────────────┘
                         │
            ┌────────────┴────────────┐
            ▼                         ▼
    ┌───────────────┐         ┌───────────────┐
    │ Local Storage │         │ Cloud Backup  │
    │   (Primary)   │────────▶│   (S3/R2)     │
    └───────────────┘  sync   └───────────────┘
```

### Why This Approach?

1. **Local First**: Fast access, no internet dependency
2. **Cloud Backup**: Disaster recovery, off-site protection
3. **Cost Effective**: Local storage is cheap, cloud is backup-only
4. **Compliance**: Data stays local, backup encrypted

## Local Storage Structure

### Directory Layout

```
/data/uploads/
├── 2024/
│   ├── 01/
│   │   ├── {clientId}/
│   │   │   ├── {documentId}_{sanitized_filename}.pdf
│   │   │   └── {documentId}_{sanitized_filename}.jpg
│   │   └── {clientId}/
│   │       └── ...
│   ├── 02/
│   └── ...
└── 2025/
    └── ...
```

### Path Generation

```typescript
function generateStoragePath(
  clientId: string,
  documentId: string,
  originalName: string
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const sanitized = sanitizeFilename(originalName);

  return `${year}/${month}/${clientId}/${documentId}_${sanitized}`;
}

function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "_")
    .replace(/__+/g, "_");
}
```

### Storage Path Example

```
Original: "John Smith Tax Return 2024.pdf"
Client ID: "abc-123"
Document ID: "doc-456"

Path: /data/uploads/2024/12/abc-123/doc-456_john_smith_tax_return_2024.pdf
```

## Upload Flow

### Step 1: Reserve Upload

```typescript
// Client requests upload slot
POST /rpc/documents.prepareUpload
{
  "fileName": "tax_return.pdf",
  "mimeType": "application/pdf",
  "fileSize": 1024000,
  "clientId": "client-123",
  "category": "TAX"
}

// Response
{
  "documentId": "doc-456",
  "uploadUrl": "/api/upload/doc-456"
}
```

### Step 2: Upload File

```typescript
// Multipart upload to server
POST /api/upload/doc-456
Content-Type: multipart/form-data

// Server handler
app.post("/api/upload/:documentId", async (c) => {
  const documentId = c.req.param("documentId");
  const file = await c.req.formData();

  // Verify document exists and is pending
  const doc = await getDocument(documentId);
  if (!doc || doc.status !== "PENDING") {
    return c.json({ error: "Invalid upload" }, 400);
  }

  // Write to local storage
  const storagePath = generateStoragePath(doc.clientId, documentId, doc.originalName);
  await writeFile(`/data/uploads/${storagePath}`, file);

  // Update document record
  await updateDocument(documentId, {
    storagePath,
    status: "ACTIVE"
  });

  return c.json({ success: true });
});
```

### Step 3: Complete Upload

```typescript
// Finalize metadata
POST /rpc/documents.completeUpload
{
  "documentId": "doc-456",
  "description": "2024 Tax Return",
  "matterId": "matter-789"  // Optional
}
```

## Download Flow

### Step 1: Request Download

```typescript
// Get download authorization
GET /rpc/documents.getDownloadUrl
{ "documentId": "doc-456" }

// Response
{
  "url": "/api/download/doc-456?token=xyz",
  "expiresAt": "2024-12-10T12:00:00Z"
}
```

### Step 2: Download File

```typescript
// Stream file with auth check
app.get("/api/download/:documentId", async (c) => {
  const documentId = c.req.param("documentId");
  const token = c.req.query("token");

  // Verify token and user access
  if (!verifyDownloadToken(token, documentId)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Get document metadata
  const doc = await getDocument(documentId);

  // Stream file
  const file = await readFile(`/data/uploads/${doc.storagePath}`);

  return new Response(file, {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `attachment; filename="${doc.originalName}"`,
      "Content-Length": doc.fileSize.toString(),
    },
  });
});
```

## Cloud Backup

### Backup Strategy

```
┌─────────────────────────────────────────────────────┐
│                  Backup Job (Hourly)                │
├─────────────────────────────────────────────────────┤
│ 1. Query documents where isBackedUp = false         │
│ 2. For each document:                               │
│    - Upload to S3/R2                                │
│    - Update cloudBackupPath                         │
│    - Set isBackedUp = true                          │
│ 3. Log results                                      │
└─────────────────────────────────────────────────────┘
```

### S3/R2 Configuration

```typescript
// Environment variables
S3_ENDPOINT=https://xxx.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=xxx
S3_SECRET_ACCESS_KEY=xxx
S3_BUCKET=synergy-gy-backups
S3_REGION=auto

// S3 client
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});
```

### Backup Job

```typescript
// /apps/server/src/workers/backup.ts
async function runBackupJob() {
  // Get unbackuped documents
  const documents = await db.query.document.findMany({
    where: and(
      eq(document.status, "ACTIVE"),
      eq(document.isBackedUp, false)
    ),
    limit: 100,
  });

  for (const doc of documents) {
    try {
      // Read local file
      const file = await readFile(`/data/uploads/${doc.storagePath}`);

      // Upload to S3
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: doc.storagePath,
        Body: file,
        ContentType: doc.mimeType,
        Metadata: {
          documentId: doc.id,
          clientId: doc.clientId,
          originalName: doc.originalName,
        },
      }));

      // Update record
      await db.update(document)
        .set({
          cloudBackupPath: doc.storagePath,
          isBackedUp: true,
        })
        .where(eq(document.id, doc.id));

      console.log(`Backed up: ${doc.id}`);
    } catch (error) {
      console.error(`Backup failed: ${doc.id}`, error);
    }
  }
}

// Run hourly
Bun.serve({
  fetch: () => new Response("Backup server"),
  port: 3001,
});

setInterval(runBackupJob, 60 * 60 * 1000); // Every hour
```

## File Validation

### Allowed Types

```typescript
const ALLOWED_MIME_TYPES = [
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",

  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function validateFile(file: File): boolean {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error("File type not allowed");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File too large");
  }
  return true;
}
```

### Security Scanning (Optional)

```typescript
// Basic malware check
async function scanFile(filePath: string): Promise<boolean> {
  // Check file signature matches declared type
  const signature = await readFileSignature(filePath);
  const declaredType = getMimeType(filePath);

  if (!signatureMatchesType(signature, declaredType)) {
    await deleteFile(filePath);
    return false;
  }

  return true;
}
```

## Disaster Recovery

### Backup Restore Process

```typescript
async function restoreFromBackup(documentId: string) {
  const doc = await getDocument(documentId);

  if (!doc.cloudBackupPath) {
    throw new Error("No backup available");
  }

  // Download from S3
  const response = await s3Client.send(new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: doc.cloudBackupPath,
  }));

  // Write to local storage
  const localPath = `/data/uploads/${doc.storagePath}`;
  await writeFile(localPath, response.Body);

  console.log(`Restored: ${documentId}`);
}

// Full restore
async function fullRestore() {
  const documents = await db.query.document.findMany({
    where: eq(document.isBackedUp, true),
  });

  for (const doc of documents) {
    await restoreFromBackup(doc.id);
  }
}
```

## Storage Metrics

### Monitoring

```typescript
async function getStorageStats() {
  // Database stats
  const dbStats = await db.select({
    totalDocuments: count(),
    totalSize: sum(document.fileSize),
    backedUp: count(sql`CASE WHEN ${document.isBackedUp} THEN 1 END`),
  }).from(document);

  // Disk stats
  const diskUsage = await getDiskUsage("/data/uploads");

  return {
    documents: dbStats.totalDocuments,
    totalSize: dbStats.totalSize,
    backedUp: dbStats.backedUp,
    diskFree: diskUsage.free,
    diskTotal: diskUsage.total,
  };
}
```

## Configuration Summary

| Setting | Value | Notes |
|---------|-------|-------|
| Local Path | `/data/uploads/` | Docker volume mount |
| Max File Size | 50MB | Configurable |
| Backup Frequency | Hourly | Cron job |
| Cloud Provider | Cloudflare R2 | S3-compatible |
| Retention | Indefinite | Soft delete only |
