/**
 * Google Drive Storage Utilities for Backup Synchronization
 *
 * Provides OAuth2-based Google Drive integration for backup files.
 *
 * Configuration via environment variables:
 * - GOOGLE_DRIVE_CLIENT_ID: OAuth2 Client ID from Google Cloud Console
 * - GOOGLE_DRIVE_CLIENT_SECRET: OAuth2 Client Secret
 * - GOOGLE_DRIVE_REDIRECT_URI: OAuth2 Redirect URI (e.g., http://localhost:3000/api/auth/google-drive/callback)
 * - GOOGLE_DRIVE_FOLDER_ID: Optional folder ID to store backups in
 *
 * Token Storage:
 * - Tokens are stored in the database in a system_settings table
 * - Access tokens are refreshed automatically when expired
 */

import { existsSync, statSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

// Google Drive API endpoints
const GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_DRIVE_API = "https://www.googleapis.com/drive/v3";
const GOOGLE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";

// Required scopes for backup operations
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

// Token storage file path (for simple file-based storage)
const TOKEN_FILE = join(
  process.env.DATA_DIR ?? "./data",
  ".google-drive-tokens.json"
);

type GoogleDriveConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  folderId?: string;
};

type TokenData = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

type DriveFile = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
};

// ============================================================================
// Configuration
// ============================================================================

function getConfig(): GoogleDriveConfig | null {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_DRIVE_REDIRECT_URI ??
    `${process.env.VITE_API_URL ?? "http://localhost:3001"}/api/auth/google-drive/callback`;

  if (!(clientId && clientSecret)) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
  };
}

/**
 * Check if Google Drive is configured
 */
export function isGoogleDriveConfigured(): boolean {
  return getConfig() !== null;
}

/**
 * Get Google Drive configuration info (safe for client)
 */
export function getGoogleDriveInfo(): {
  configured: boolean;
  hasValidTokens: boolean;
  folderId: string | null;
} {
  const config = getConfig();
  if (!config) {
    return {
      configured: false,
      hasValidTokens: false,
      folderId: null,
    };
  }

  const tokens = getStoredTokens();

  return {
    configured: true,
    hasValidTokens: tokens !== null && tokens.expiresAt > Date.now(),
    folderId: config.folderId ?? null,
  };
}

// ============================================================================
// Token Management
// ============================================================================

function getStoredTokens(): TokenData | null {
  try {
    if (!existsSync(TOKEN_FILE)) {
      return null;
    }
    const data = require("node:fs").readFileSync(TOKEN_FILE, "utf-8");
    return JSON.parse(data) as TokenData;
  } catch {
    return null;
  }
}

async function storeTokens(tokens: TokenData): Promise<void> {
  const dir = dirname(TOKEN_FILE);
  await mkdir(dir, { recursive: true });
  await writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2));
}

async function clearTokens(): Promise<void> {
  try {
    if (existsSync(TOKEN_FILE)) {
      await writeFile(TOKEN_FILE, "");
    }
  } catch {
    // Ignore errors
  }
}

/**
 * Generate OAuth2 authorization URL
 */
export function getAuthorizationUrl(state?: string): string {
  const config = getConfig();
  if (!config) {
    throw new Error("Google Drive not configured");
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    ...(state ? { state } : {}),
  });

  return `${GOOGLE_OAUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<{ success: boolean; error?: string }> {
  const config = getConfig();
  if (!config) {
    return { success: false, error: "Google Drive not configured" };
  }

  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: config.redirectUri,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Token exchange failed: ${text}` };
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    await storeTokens({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Token exchange failed",
    };
  }
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  const config = getConfig();
  const tokens = getStoredTokens();

  if (!(config && tokens?.refreshToken)) {
    return null;
  }

  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: tokens.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      console.error(
        "[GoogleDrive] Token refresh failed:",
        await response.text()
      );
      return null;
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };

    await storeTokens({
      accessToken: data.access_token,
      refreshToken: tokens.refreshToken,
      expiresAt: Date.now() + data.expires_in * 1000,
    });

    return data.access_token;
  } catch (error) {
    console.error("[GoogleDrive] Token refresh error:", error);
    return null;
  }
}

/**
 * Get valid access token (refreshing if needed)
 */
async function getAccessToken(): Promise<string | null> {
  const tokens = getStoredTokens();
  if (!tokens) {
    return null;
  }

  // Refresh if token expires within 5 minutes
  if (tokens.expiresAt < Date.now() + 5 * 60 * 1000) {
    return await refreshAccessToken();
  }

  return tokens.accessToken;
}

/**
 * Disconnect Google Drive (clear tokens)
 */
export async function disconnectGoogleDrive(): Promise<void> {
  await clearTokens();
}

// ============================================================================
// Drive Operations
// ============================================================================

/**
 * Upload a backup file to Google Drive
 */
export async function uploadToGoogleDrive(
  localPath: string,
  fileName?: string
): Promise<{
  success: boolean;
  fileId?: string;
  fileName?: string;
  error?: string;
}> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { success: false, error: "Not authenticated with Google Drive" };
  }

  if (!existsSync(localPath)) {
    return { success: false, error: "Local file not found" };
  }

  const config = getConfig();
  const name = fileName ?? basename(localPath);
  const stats = statSync(localPath);

  try {
    // Read file content
    const fileBuffer = await readFile(localPath);

    // Create metadata
    const metadata: Record<string, unknown> = {
      name,
      mimeType: "application/gzip",
    };

    // If folder ID is configured, upload to that folder
    if (config?.folderId) {
      metadata.parents = [config.folderId];
    }

    // For files larger than 5MB, use resumable upload
    if (stats.size > 5 * 1024 * 1024) {
      return uploadResumable(accessToken, fileBuffer, metadata, name);
    }

    // Simple multipart upload for smaller files
    const boundary = "backup_upload_boundary";
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
    const mediaPart = `${delimiter}Content-Type: application/gzip\r\n\r\n`;

    const body = Buffer.concat([
      Buffer.from(metadataPart),
      Buffer.from(mediaPart),
      fileBuffer,
      Buffer.from(closeDelimiter),
    ]);

    const response = await fetch(
      `${GOOGLE_UPLOAD_API}/files?uploadType=multipart`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
          "Content-Length": body.length.toString(),
        },
        body,
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Upload failed: ${text}` };
    }

    const result = (await response.json()) as { id: string; name: string };

    return {
      success: true,
      fileId: result.id,
      fileName: result.name,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Resumable upload for larger files
 */
async function uploadResumable(
  accessToken: string,
  fileBuffer: Buffer,
  metadata: Record<string, unknown>,
  _fileName: string
): Promise<{
  success: boolean;
  fileId?: string;
  fileName?: string;
  error?: string;
}> {
  try {
    // Initiate resumable upload
    const initResponse = await fetch(
      `${GOOGLE_UPLOAD_API}/files?uploadType=resumable`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Upload-Content-Type": "application/gzip",
          "X-Upload-Content-Length": fileBuffer.length.toString(),
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!initResponse.ok) {
      const text = await initResponse.text();
      return { success: false, error: `Upload init failed: ${text}` };
    }

    const uploadUri = initResponse.headers.get("Location");
    if (!uploadUri) {
      return { success: false, error: "No upload URI returned" };
    }

    // Upload file content - convert Buffer to Uint8Array for fetch compatibility
    const uploadResponse = await fetch(uploadUri, {
      method: "PUT",
      headers: {
        "Content-Type": "application/gzip",
        "Content-Length": fileBuffer.length.toString(),
      },
      body: new Uint8Array(fileBuffer),
    });

    if (!uploadResponse.ok) {
      const text = await uploadResponse.text();
      return { success: false, error: `Upload failed: ${text}` };
    }

    const result = (await uploadResponse.json()) as {
      id: string;
      name: string;
    };

    return {
      success: true,
      fileId: result.id,
      fileName: result.name,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Resumable upload failed",
    };
  }
}

/**
 * Download a backup file from Google Drive
 */
export async function downloadFromGoogleDrive(
  fileId: string,
  localPath: string
): Promise<{
  success: boolean;
  localPath: string;
  error?: string;
}> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return {
      success: false,
      localPath,
      error: "Not authenticated with Google Drive",
    };
  }

  try {
    // Ensure directory exists
    await mkdir(dirname(localPath), { recursive: true });

    const response = await fetch(
      `${GOOGLE_DRIVE_API}/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return { success: false, localPath, error: `Download failed: ${text}` };
    }

    const arrayBuffer = await response.arrayBuffer();
    await writeFile(localPath, Buffer.from(arrayBuffer));

    return { success: true, localPath };
  } catch (error) {
    return {
      success: false,
      localPath,
      error: error instanceof Error ? error.message : "Download failed",
    };
  }
}

/**
 * List backup files in Google Drive
 */
export async function listGoogleDriveBackups(): Promise<{
  success: boolean;
  backups: Array<{
    id: string;
    name: string;
    size: number;
    createdTime: Date;
    modifiedTime: Date;
  }>;
  error?: string;
}> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return {
      success: false,
      backups: [],
      error: "Not authenticated with Google Drive",
    };
  }

  const config = getConfig();

  try {
    // Build query for backup files
    let query =
      "(mimeType='application/gzip' or mimeType='application/x-gzip')";
    query += " and trashed=false";

    // If folder ID is configured, filter by parent
    if (config?.folderId) {
      query += ` and '${config.folderId}' in parents`;
    }

    const params = new URLSearchParams({
      q: query,
      fields: "files(id,name,size,createdTime,modifiedTime,mimeType)",
      orderBy: "createdTime desc",
      pageSize: "100",
    });

    const response = await fetch(`${GOOGLE_DRIVE_API}/files?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, backups: [], error: `List failed: ${text}` };
    }

    const data = (await response.json()) as { files: DriveFile[] };

    const backups = data.files.map((file) => ({
      id: file.id,
      name: file.name,
      size: Number(file.size) || 0,
      createdTime: new Date(file.createdTime),
      modifiedTime: new Date(file.modifiedTime),
    }));

    return { success: true, backups };
  } catch (error) {
    return {
      success: false,
      backups: [],
      error: error instanceof Error ? error.message : "List failed",
    };
  }
}

/**
 * Delete a backup file from Google Drive
 */
export async function deleteFromGoogleDrive(fileId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { success: false, error: "Not authenticated with Google Drive" };
  }

  try {
    const response = await fetch(`${GOOGLE_DRIVE_API}/files/${fileId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok && response.status !== 204) {
      const text = await response.text();
      return { success: false, error: `Delete failed: ${text}` };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

/**
 * Test Google Drive connection
 */
export async function testGoogleDriveConnection(): Promise<{
  success: boolean;
  email?: string;
  storageUsed?: string;
  storageTotal?: string;
  error?: string;
}> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { success: false, error: "Not authenticated with Google Drive" };
  }

  try {
    // Get user info
    const aboutResponse = await fetch(
      `${GOOGLE_DRIVE_API}/about?fields=user,storageQuota`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!aboutResponse.ok) {
      const text = await aboutResponse.text();
      return { success: false, error: `Connection test failed: ${text}` };
    }

    const about = (await aboutResponse.json()) as {
      user: { emailAddress: string };
      storageQuota: { usage: string; limit: string };
    };

    const formatBytes = (bytes: number): string => {
      if (bytes < 1024) {
        return `${bytes} B`;
      }
      if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
      }
      if (bytes < 1024 * 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      }
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };

    return {
      success: true,
      email: about.user.emailAddress,
      storageUsed: formatBytes(Number(about.storageQuota.usage)),
      storageTotal: formatBytes(Number(about.storageQuota.limit)),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection test failed",
    };
  }
}

/**
 * Create backup folder in Google Drive if it doesn't exist
 */
export async function createBackupFolder(
  folderName = "GK-Nexus Backups"
): Promise<{
  success: boolean;
  folderId?: string;
  error?: string;
}> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { success: false, error: "Not authenticated with Google Drive" };
  }

  try {
    // Check if folder already exists
    const searchResponse = await fetch(
      `${GOOGLE_DRIVE_API}/files?q=${encodeURIComponent(
        `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
      )}&fields=files(id,name)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!searchResponse.ok) {
      const text = await searchResponse.text();
      return { success: false, error: `Folder search failed: ${text}` };
    }

    const searchData = (await searchResponse.json()) as {
      files: Array<{ id: string; name: string }>;
    };

    if (searchData.files.length > 0) {
      const folder = searchData.files[0];
      if (folder) {
        return { success: true, folderId: folder.id };
      }
    }

    // Create folder
    const createResponse = await fetch(`${GOOGLE_DRIVE_API}/files`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
      }),
    });

    if (!createResponse.ok) {
      const text = await createResponse.text();
      return { success: false, error: `Folder creation failed: ${text}` };
    }

    const folder = (await createResponse.json()) as { id: string };

    return { success: true, folderId: folder.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Folder creation failed",
    };
  }
}
