import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";

/**
 * E2E Tests for Document Management
 * Tests document list, upload, categories, and templates
 */

const DOCUMENTS_URL_REGEX = /\/app\/documents/;
const DOCUMENTS_TEMPLATES_REGEX = /\/app\/documents\/templates/;
const CATEGORY_FILTER_REGEX = /Category|All/;
const SEARCH_PLACEHOLDER_REGEX = /Search/i;
const UPLOAD_BUTTON_REGEX = /Upload/i;

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

    // Check for category filter
    const categoryFilter = page
      .getByRole("combobox")
      .filter({ hasText: CATEGORY_FILTER_REGEX });
    await expect(categoryFilter.first()).toBeVisible();
  });

  test("should display search functionality", async ({ page }) => {
    await page.goto("/app/documents");
    await page.waitForLoadState("networkidle");

    // Check for search input
    const searchInput = page.getByPlaceholder(SEARCH_PLACEHOLDER_REGEX);
    await expect(searchInput).toBeVisible();
  });

  test("should display upload button", async ({ page }) => {
    await page.goto("/app/documents");
    await page.waitForLoadState("networkidle");

    // Check for upload button
    const uploadButton = page.getByRole("button", {
      name: UPLOAD_BUTTON_REGEX,
    });
    await expect(uploadButton).toBeVisible();
  });

  test("should navigate to document templates", async ({ page }) => {
    await page.goto("/app/documents/templates");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(DOCUMENTS_TEMPLATES_REGEX);
  });
});
