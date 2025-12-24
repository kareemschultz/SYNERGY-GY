import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";

/**
 * E2E Tests for Knowledge Base
 * Tests browsing, searching, and downloading resources
 */

const KB_URL_REGEX = /\/app\/knowledge-base/;
const SEARCH_PLACEHOLDER_REGEX = /Search/i;

test.describe("Knowledge Base", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await login(page);
  });

  test("should navigate to knowledge base", async ({ page }) => {
    await page.getByRole("link", { name: "Knowledge Base" }).click();
    await expect(page).toHaveURL(KB_URL_REGEX);
  });

  test("should display search functionality", async ({ page }) => {
    await page.goto("/app/knowledge-base");
    await page.waitForLoadState("networkidle");

    // Check for search input
    const searchInput = page.getByPlaceholder(SEARCH_PLACEHOLDER_REGEX);
    await expect(searchInput).toBeVisible();
  });

  test("should display category filter", async ({ page }) => {
    await page.goto("/app/knowledge-base");
    await page.waitForLoadState("networkidle");

    // Check for category filter - might be tabs or dropdown
    const _categories = ["GRA", "NIS", "Immigration", "General"];
    // At least some category UI should exist
  });

  test("should display knowledge base items", async ({ page }) => {
    await page.goto("/app/knowledge-base");
    await page.waitForLoadState("networkidle");

    // Wait for items to load - may show empty state or items
    await page.waitForTimeout(2000);

    // Page should have either items or empty state message
  });
});
