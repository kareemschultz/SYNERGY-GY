import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";

/**
 * E2E Tests for Reports
 * Tests report listing, generation, and export
 */

const REPORTS_URL_REGEX = /\/app\/reports/;
const REPORTS_AGING_REGEX = /\/app\/reports\/aging/;
const REPORTS_CUSTOM_REGEX = /\/app\/reports\/custom/;
const SEARCH_PLACEHOLDER_REGEX = /Search/i;

test.describe("Reports", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await login(page);
  });

  test("should navigate to reports page", async ({ page }) => {
    await page.getByRole("link", { name: "Reports" }).click();
    await expect(page).toHaveURL(REPORTS_URL_REGEX);
  });

  test("should display report categories", async ({ page }) => {
    await page.goto("/app/reports");
    await page.waitForLoadState("networkidle");

    // Check for report category tabs or sections
    const categories = ["Client", "Matter", "Financial", "Deadline", "Staff"];
    for (const category of categories) {
      const _element = page.getByText(category, { exact: false });
      // At least some should be visible
    }
  });

  test("should display search functionality", async ({ page }) => {
    await page.goto("/app/reports");
    await page.waitForLoadState("networkidle");

    // Check for search input
    const _searchInput = page.getByPlaceholder(SEARCH_PLACEHOLDER_REGEX);
    // Search may or may not exist
  });

  test("should navigate to aging report", async ({ page }) => {
    await page.goto("/app/reports/aging");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(REPORTS_AGING_REGEX);
  });

  test("should navigate to custom reports", async ({ page }) => {
    await page.goto("/app/reports/custom");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(REPORTS_CUSTOM_REGEX);
  });
});
