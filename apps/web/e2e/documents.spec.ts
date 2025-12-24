import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";

/**
 * E2E Tests for Document Management
 * Tests document list, upload, categories, and templates
 */

const DOCUMENTS_URL_REGEX = /\/app\/documents/;
const DOCUMENTS_TEMPLATES_REGEX = /\/app\/documents\/templates/;
const SEARCH_REGEX = /search/i;
const UPLOAD_REGEX = /upload/i;

test.describe("Document Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await login(page);
  });

  test("should navigate to documents page", async ({ page }) => {
    await page.getByRole("link", { name: "Documents" }).click();
    await expect(page).toHaveURL(DOCUMENTS_URL_REGEX);
    await expect(
      page.getByRole("heading", { name: "Documents" })
    ).toBeVisible();
  });

  test("should display document categories filter", async ({ page }) => {
    await page.goto("/app/documents");
    await page.waitForLoadState("networkidle");

    // Check for any filter/select element
    const comboboxCount = await page.getByRole("combobox").count();
    const selectCount = await page.locator('select, [role="listbox"]').count();
    const hasFilter = comboboxCount > 0 || selectCount > 0;

    expect(hasFilter).toBe(true);
  });

  test("should display search functionality", async ({ page }) => {
    await page.goto("/app/documents");
    await page.waitForLoadState("networkidle");

    // Check for search input
    const searchInput = page.getByPlaceholder(SEARCH_REGEX).first();
    await expect(searchInput).toBeVisible();
  });

  test("should display upload button", async ({ page }) => {
    await page.goto("/app/documents");
    await page.waitForLoadState("networkidle");

    // Check for upload button (may be "Upload", "Upload Document", or icon with aria-label)
    const uploadButton = page
      .getByRole("button", { name: UPLOAD_REGEX })
      .first();
    const hasUpload = await uploadButton
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    // Also check for an upload link or other upload trigger
    const uploadLink = page.getByRole("link", { name: UPLOAD_REGEX }).first();
    const hasUploadLink = await uploadLink
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    // At least one upload mechanism should exist
    expect(hasUpload || hasUploadLink).toBe(true);
  });

  test("should navigate to document templates", async ({ page }) => {
    await page.goto("/app/documents/templates");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(DOCUMENTS_TEMPLATES_REGEX);
  });
});
