/**
 * Knowledge Base Form Downloader
 *
 * Downloads PDF forms from government agency URLs.
 * Uses native fetch() with browser-like headers for compatibility.
 * Validates responses are actual PDFs before saving.
 *
 * Works inside Docker containers (no shell scripts).
 */

import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { stat, unlink } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

// Get absolute path to project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "../../../..");

// Configuration
const isDocker = existsSync("/app/data/uploads") || existsSync("/.dockerenv");
const UPLOADS_DIR =
  process.env.UPLOADS_DIR ||
  (isDocker ? "/app/data/uploads" : join(PROJECT_ROOT, "data/uploads"));
const KB_UPLOADS_DIR = join(UPLOADS_DIR, "knowledge-base");

// Error codes for download failures
export type DownloadErrorCode =
  | "BLOCKED" // 403, bot detection
  | "NOT_FOUND" // 404
  | "INVALID_CONTENT" // Response is not a PDF
  | "NETWORK_ERROR" // Connection failed
  | "TIMEOUT" // Request timed out
  | "INVALID_URL"; // URL is not valid

export type DownloadResult = {
  success: boolean;
  filePath?: string;
  fileName?: string;
  storagePath?: string; // Relative path from UPLOADS_DIR
  mimeType?: string;
  fileSize?: number;
  error?: string;
  errorCode?: DownloadErrorCode;
};

export type DownloadOptions = {
  timeout?: number; // Default 30000ms
  maxRedirects?: number; // Default 5
};

// Browser-like User-Agent strings
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
];

// Top-level regex patterns for performance
const FORM_CODE_REGEX = /\(([A-Z0-9-]+)\)/;
const PARENTHESES_REGEX = /\([^)]*\)/g;

/**
 * Sanitize a filename for safe filesystem storage
 */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9.-]/g, "-") // Replace non-alphanumeric with dashes
    .replace(/-+/g, "-") // Collapse multiple dashes
    .replace(/^-|-$/g, "") // Remove leading/trailing dashes
    .substring(0, 200); // Limit length
}

/**
 * Generate a filename from the KB item title and category
 */
export function generateFileName(title: string, category: string): string {
  // Extract form code if present (e.g., "IT-1", "R400F1")
  const codeMatch = title.match(FORM_CODE_REGEX);
  const code = codeMatch ? codeMatch[1] : "";

  // Sanitize title (remove parenthetical content)
  const sanitizedTitle = sanitizeFileName(title.replace(PARENTHESES_REGEX, ""));

  // Build filename: CATEGORY-Title-Code.pdf
  const parts = [category.toUpperCase(), sanitizedTitle];
  if (code) {
    parts.push(code);
  }

  return `${parts.join("-")}.pdf`;
}

/**
 * Get the category subdirectory path
 */
function getCategoryDir(category: string): string {
  return category.toLowerCase();
}

/**
 * Ensure the category directory exists
 */
function ensureCategoryDir(category: string): string {
  const categoryDir = join(KB_UPLOADS_DIR, getCategoryDir(category));
  if (!existsSync(categoryDir)) {
    mkdirSync(categoryDir, { recursive: true });
  }
  return categoryDir;
}

/**
 * Validate that the response is a PDF
 * Checks Content-Type header and magic bytes
 */
function validatePdfResponse(
  response: Response,
  firstBytes: Uint8Array
): { valid: boolean; error?: string } {
  const contentType = response.headers.get("content-type") || "";

  // Check Content-Type
  const isPdfContentType =
    contentType.includes("application/pdf") ||
    contentType.includes("application/octet-stream");

  // Check magic bytes (%PDF-)
  const magicBytes = new TextDecoder().decode(firstBytes.slice(0, 5));
  const hasPdfMagic = magicBytes === "%PDF-";

  if (!(isPdfContentType || hasPdfMagic)) {
    return {
      valid: false,
      error: `Response is not a PDF. Content-Type: ${contentType}, Magic bytes: ${magicBytes}`,
    };
  }

  return { valid: true };
}

/**
 * Convert HTTP status code to error result
 */
function httpStatusToError(status: number, statusText: string): DownloadResult {
  if (status === 403) {
    return {
      success: false,
      error: "Access blocked (403 Forbidden). Website may have bot detection.",
      errorCode: "BLOCKED",
    };
  }
  if (status === 404) {
    return {
      success: false,
      error: "PDF not found (404). URL may be outdated.",
      errorCode: "NOT_FOUND",
    };
  }
  if (status === 429) {
    return {
      success: false,
      error: "Rate limited (429). Try again later.",
      errorCode: "BLOCKED",
    };
  }
  return {
    success: false,
    error: `HTTP error ${status}: ${statusText}`,
    errorCode: "NETWORK_ERROR",
  };
}

/**
 * Convert caught error to error result
 */
function catchErrorToResult(error: unknown, timeout: number): DownloadResult {
  if (!(error instanceof Error)) {
    return {
      success: false,
      error: "Unknown error occurred",
      errorCode: "NETWORK_ERROR",
    };
  }
  if (error.name === "AbortError") {
    return {
      success: false,
      error: `Request timed out after ${timeout}ms`,
      errorCode: "TIMEOUT",
    };
  }
  if (error.message.includes("ECONNREFUSED")) {
    return {
      success: false,
      error: "Connection refused. Server may be down.",
      errorCode: "NETWORK_ERROR",
    };
  }
  if (error.message.includes("ENOTFOUND")) {
    return {
      success: false,
      error: "Domain not found. URL may be invalid.",
      errorCode: "NETWORK_ERROR",
    };
  }
  return { success: false, error: error.message, errorCode: "NETWORK_ERROR" };
}

/**
 * Validate URL and return parsed URL or error
 */
function parseAndValidateUrl(url: string): {
  parsedUrl?: URL;
  error?: DownloadResult;
} {
  try {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return {
        error: {
          success: false,
          error: "URL must use HTTP or HTTPS protocol",
          errorCode: "INVALID_URL",
        },
      };
    }
    return { parsedUrl };
  } catch {
    return {
      error: {
        success: false,
        error: "Invalid URL format",
        errorCode: "INVALID_URL",
      },
    };
  }
}

/**
 * Download a PDF from a URL and save it locally
 */
export async function downloadPdfFromUrl(
  url: string,
  category: string,
  fileName: string,
  options: DownloadOptions = {}
): Promise<DownloadResult> {
  const { timeout = 30_000 } = options;

  // Validate URL
  const urlValidation = parseAndValidateUrl(url);
  if (urlValidation.error) {
    return urlValidation.error;
  }
  const parsedUrl = urlValidation.parsedUrl as URL;

  // Ensure destination directory exists
  const destDir = ensureCategoryDir(category);
  const sanitizedFileName = sanitizeFileName(fileName);
  const filePath = join(destDir, sanitizedFileName);

  // Select a random User-Agent
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Fetch with browser-like headers
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": userAgent,
        Accept: "application/pdf, application/octet-stream, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Referer: parsedUrl.origin,
        "Cache-Control": "no-cache",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    // Handle error responses
    if (!response.ok) {
      return httpStatusToError(response.status, response.statusText);
    }

    // Check if response has a body
    if (!response.body) {
      return {
        success: false,
        error: "Response has no body",
        errorCode: "NETWORK_ERROR",
      };
    }

    // Read first chunk to validate it's a PDF
    const reader = response.body.getReader();
    const firstChunk = await reader.read();

    if (firstChunk.done || !firstChunk.value) {
      return {
        success: false,
        error: "Empty response body",
        errorCode: "INVALID_CONTENT",
      };
    }

    // Validate PDF
    const validation = validatePdfResponse(response, firstChunk.value);
    if (!validation.valid) {
      reader.cancel();
      return {
        success: false,
        error: validation.error,
        errorCode: "INVALID_CONTENT",
      };
    }

    // Create write stream
    const writeStream = createWriteStream(filePath);

    // Create a readable stream that combines firstChunk and remaining data
    const readable = new Readable({
      async read() {
        // First, push the initial chunk
        this.push(firstChunk.value);

        // Then read remaining chunks
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) {
            this.push(null);
            break;
          }
          this.push(chunk.value);
        }
      },
    });

    // Stream to file
    await pipeline(readable, writeStream);

    // Get file stats
    const stats = await stat(filePath);

    // Calculate storage path (relative to uploads dir)
    const storagePath = `knowledge-base/${getCategoryDir(category)}/${sanitizedFileName}`;

    return {
      success: true,
      filePath,
      fileName: sanitizedFileName,
      storagePath,
      mimeType: "application/pdf",
      fileSize: stats.size,
    };
  } catch (error) {
    // Clean up partial file if it exists
    if (existsSync(filePath)) {
      try {
        await unlink(filePath);
      } catch {
        // Ignore cleanup errors
      }
    }
    return catchErrorToResult(error, timeout);
  }
}

/**
 * Sleep for a specified duration (for rate limiting)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * Get the uploads directory path for knowledge base
 */
export function getKbUploadsDir(): string {
  return KB_UPLOADS_DIR;
}

/**
 * Check if a file already exists for a KB item
 */
export function fileExists(storagePath: string): boolean {
  const fullPath = join(UPLOADS_DIR, storagePath);
  return existsSync(fullPath);
}
