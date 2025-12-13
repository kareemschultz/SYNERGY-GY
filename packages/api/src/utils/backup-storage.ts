/**
 * Cloud Storage Utilities for Backup Synchronization
 *
 * Supports S3-compatible storage providers:
 * - AWS S3
 * - Cloudflare R2
 * - MinIO
 * - DigitalOcean Spaces
 *
 * Configuration via environment variables:
 * - BACKUP_S3_ENDPOINT: S3 endpoint URL
 * - BACKUP_S3_ACCESS_KEY_ID: Access key
 * - BACKUP_S3_SECRET_ACCESS_KEY: Secret key
 * - BACKUP_S3_BUCKET: Bucket name
 * - BACKUP_S3_REGION: Region (default: "auto")
 */

import {
  createReadStream,
  createWriteStream,
  existsSync,
  statSync,
} from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import { basename, dirname } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

// S3 SDK types (using @aws-sdk/client-s3)
type S3Config = {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region: string;
};

// Get S3 configuration from environment
function getS3Config(): S3Config | null {
  const endpoint = process.env.BACKUP_S3_ENDPOINT;
  const accessKeyId = process.env.BACKUP_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.BACKUP_S3_SECRET_ACCESS_KEY;
  const bucket = process.env.BACKUP_S3_BUCKET;
  const region = process.env.BACKUP_S3_REGION || "auto";

  if (!(endpoint && accessKeyId && secretAccessKey && bucket)) {
    return null;
  }

  return { endpoint, accessKeyId, secretAccessKey, bucket, region };
}

// Check if cloud storage is configured
export function isCloudStorageConfigured(): boolean {
  return getS3Config() !== null;
}

// Get cloud storage info
export function getCloudStorageInfo(): {
  configured: boolean;
  provider: "s3" | "r2" | "unknown";
  bucket: string | null;
  endpoint: string | null;
} {
  const config = getS3Config();
  if (!config) {
    return {
      configured: false,
      provider: "unknown",
      bucket: null,
      endpoint: null,
    };
  }

  // Detect provider from endpoint
  let provider: "s3" | "r2" | "unknown" = "unknown";
  if (config.endpoint.includes("r2.cloudflarestorage.com")) {
    provider = "r2";
  } else if (
    config.endpoint.includes("s3.amazonaws.com") ||
    config.endpoint.includes("s3.")
  ) {
    provider = "s3";
  }

  return {
    configured: true,
    provider,
    bucket: config.bucket,
    endpoint: config.endpoint,
  };
}

/**
 * Upload a backup file to cloud storage
 * Uses native fetch with signed URL for S3-compatible APIs
 */
export async function uploadToCloud(
  localPath: string,
  cloudPath?: string
): Promise<{
  success: boolean;
  cloudPath: string;
  provider: "s3" | "r2";
  error?: string;
}> {
  const config = getS3Config();
  if (!config) {
    return {
      success: false,
      cloudPath: "",
      provider: "s3",
      error: "Cloud storage not configured",
    };
  }

  // Validate local file exists
  if (!existsSync(localPath)) {
    return {
      success: false,
      cloudPath: "",
      provider: "s3",
      error: "Local file not found",
    };
  }

  const stats = statSync(localPath);
  const fileName = basename(localPath);
  const key = cloudPath || `backups/${fileName}`;

  try {
    // Create signed request for S3-compatible API
    const url = `${config.endpoint}/${config.bucket}/${key}`;
    const date = new Date().toUTCString();

    // Read file as buffer
    const fileStream = createReadStream(localPath);
    const chunks: Buffer[] = [];
    for await (const chunk of fileStream) {
      chunks.push(chunk as Buffer);
    }
    const fileBuffer = Buffer.concat(chunks);

    // Simple S3 PUT request with AWS Signature Version 4
    // For production, use @aws-sdk/client-s3
    const response = await uploadWithSignature(
      config,
      key,
      fileBuffer,
      "application/zip"
    );

    if (!response.success) {
      return {
        success: false,
        cloudPath: key,
        provider: config.endpoint.includes("r2") ? "r2" : "s3",
        error: response.error,
      };
    }

    return {
      success: true,
      cloudPath: key,
      provider: config.endpoint.includes("r2") ? "r2" : "s3",
    };
  } catch (error) {
    return {
      success: false,
      cloudPath: key,
      provider: config.endpoint.includes("r2") ? "r2" : "s3",
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Download a backup file from cloud storage
 */
export async function downloadFromCloud(
  cloudPath: string,
  localPath: string
): Promise<{
  success: boolean;
  localPath: string;
  error?: string;
}> {
  const config = getS3Config();
  if (!config) {
    return {
      success: false,
      localPath: "",
      error: "Cloud storage not configured",
    };
  }

  try {
    // Ensure directory exists
    await mkdir(dirname(localPath), { recursive: true });

    // Download with signature
    const result = await downloadWithSignature(config, cloudPath);

    if (!(result.success && result.data)) {
      return {
        success: false,
        localPath,
        error: result.error || "Download failed",
      };
    }

    // Write to local file
    const writeStream = createWriteStream(localPath);
    await pipeline(Readable.from(result.data), writeStream);

    return {
      success: true,
      localPath,
    };
  } catch (error) {
    // Clean up partial file
    if (existsSync(localPath)) {
      await unlink(localPath).catch(() => {});
    }

    return {
      success: false,
      localPath,
      error: error instanceof Error ? error.message : "Download failed",
    };
  }
}

/**
 * List backup files in cloud storage
 */
export async function listCloudBackups(): Promise<{
  success: boolean;
  backups: Array<{
    key: string;
    name: string;
    size: number;
    lastModified: Date;
  }>;
  error?: string;
}> {
  const config = getS3Config();
  if (!config) {
    return {
      success: false,
      backups: [],
      error: "Cloud storage not configured",
    };
  }

  try {
    const result = await listWithSignature(config, "backups/");

    if (!result.success) {
      return {
        success: false,
        backups: [],
        error: result.error,
      };
    }

    return {
      success: true,
      backups: result.objects || [],
    };
  } catch (error) {
    return {
      success: false,
      backups: [],
      error: error instanceof Error ? error.message : "List failed",
    };
  }
}

/**
 * Delete a backup file from cloud storage
 */
export async function deleteFromCloud(cloudPath: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const config = getS3Config();
  if (!config) {
    return {
      success: false,
      error: "Cloud storage not configured",
    };
  }

  try {
    const result = await deleteWithSignature(config, cloudPath);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

/**
 * Test cloud storage connection
 */
export async function testCloudConnection(): Promise<{
  success: boolean;
  provider: string;
  bucket: string;
  error?: string;
}> {
  const config = getS3Config();
  if (!config) {
    return {
      success: false,
      provider: "unknown",
      bucket: "",
      error: "Cloud storage not configured",
    };
  }

  try {
    // Try to list objects (with empty prefix) to test connection
    const result = await listWithSignature(config, "");

    return {
      success: result.success,
      provider: config.endpoint.includes("r2") ? "Cloudflare R2" : "AWS S3",
      bucket: config.bucket,
      error: result.error,
    };
  } catch (error) {
    return {
      success: false,
      provider: config.endpoint.includes("r2") ? "Cloudflare R2" : "AWS S3",
      bucket: config.bucket,
      error: error instanceof Error ? error.message : "Connection test failed",
    };
  }
}

// ============================================================================
// AWS Signature Version 4 Implementation
// For production, consider using @aws-sdk/client-s3 instead
// ============================================================================

import { createHash, createHmac } from "node:crypto";

function sha256(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

function hmacSha256(key: string | Buffer, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

function getSignatureKey(
  secretKey: string,
  dateStamp: string,
  region: string,
  service: string
): Buffer {
  const kDate = hmacSha256(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, "aws4_request");
  return kSigning;
}

function signRequest(
  config: S3Config,
  method: string,
  path: string,
  headers: Record<string, string>,
  payload: Buffer | string
): Record<string, string> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  // Parse endpoint URL
  const endpointUrl = new URL(config.endpoint);
  const host = `${config.bucket}.${endpointUrl.host}`;
  const service = "s3";
  const region = config.region === "auto" ? "us-east-1" : config.region;

  // Canonical headers
  const canonicalHeaders = {
    host,
    "x-amz-content-sha256": sha256(payload),
    "x-amz-date": amzDate,
    ...headers,
  };

  const signedHeaders = Object.keys(canonicalHeaders).sort().join(";");
  const canonicalHeadersStr = Object.entries(canonicalHeaders)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k.toLowerCase()}:${v}`)
    .join("\n");

  // Canonical request
  const canonicalRequest = [
    method,
    `/${path}`,
    "",
    `${canonicalHeadersStr}\n`,
    signedHeaders,
    sha256(payload),
  ].join("\n");

  // String to sign
  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join("\n");

  // Calculate signature
  const signingKey = getSignatureKey(
    config.secretAccessKey,
    dateStamp,
    region,
    service
  );
  const signature = hmacSha256(signingKey, stringToSign).toString("hex");

  // Authorization header
  const authorization = `${algorithm} Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    host,
    "x-amz-content-sha256": sha256(payload),
    "x-amz-date": amzDate,
    authorization,
    ...headers,
  };
}

async function uploadWithSignature(
  config: S3Config,
  key: string,
  data: Buffer,
  contentType: string
): Promise<{ success: boolean; error?: string }> {
  const endpointUrl = new URL(config.endpoint);
  const url = `${config.endpoint}/${config.bucket}/${key}`;

  const headers = signRequest(
    config,
    "PUT",
    key,
    { "content-type": contentType },
    data
  );

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: data,
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${text}` };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload error",
    };
  }
}

async function downloadWithSignature(
  config: S3Config,
  key: string
): Promise<{ success: boolean; data?: Buffer; error?: string }> {
  const url = `${config.endpoint}/${config.bucket}/${key}`;
  const headers = signRequest(config, "GET", key, {}, "");

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${text}` };
    }

    const arrayBuffer = await response.arrayBuffer();
    return { success: true, data: Buffer.from(arrayBuffer) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Download error",
    };
  }
}

async function listWithSignature(
  config: S3Config,
  prefix: string
): Promise<{
  success: boolean;
  objects?: Array<{
    key: string;
    name: string;
    size: number;
    lastModified: Date;
  }>;
  error?: string;
}> {
  const url = `${config.endpoint}/${config.bucket}?list-type=2&prefix=${encodeURIComponent(prefix)}`;
  const headers = signRequest(
    config,
    "GET",
    `?list-type=2&prefix=${prefix}`,
    {},
    ""
  );

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${text}` };
    }

    const xml = await response.text();

    // Simple XML parsing for S3 ListObjectsV2 response
    const objects: Array<{
      key: string;
      name: string;
      size: number;
      lastModified: Date;
    }> = [];

    const keyMatches = xml.matchAll(/<Key>([^<]+)<\/Key>/g);
    const sizeMatches = xml.matchAll(/<Size>([^<]+)<\/Size>/g);
    const dateMatches = xml.matchAll(/<LastModified>([^<]+)<\/LastModified>/g);

    const keys = Array.from(keyMatches).map((m) => m[1]);
    const sizes = Array.from(sizeMatches).map((m) => Number.parseInt(m[1], 10));
    const dates = Array.from(dateMatches).map((m) => new Date(m[1]));

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (key) {
        objects.push({
          key,
          name: basename(key),
          size: sizes[i] || 0,
          lastModified: dates[i] || new Date(),
        });
      }
    }

    return { success: true, objects };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "List error",
    };
  }
}

async function deleteWithSignature(
  config: S3Config,
  key: string
): Promise<{ success: boolean; error?: string }> {
  const url = `${config.endpoint}/${config.bucket}/${key}`;
  const headers = signRequest(config, "DELETE", key, {}, "");

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers,
    });

    if (!response.ok && response.status !== 204) {
      const text = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${text}` };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete error",
    };
  }
}
