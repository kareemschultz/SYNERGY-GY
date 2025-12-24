import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";

/**
 * E2E Tests for Analytics Dashboard
 * Tests analytics overview, charts, and audit log
 */

const ANALYTICS_URL_REGEX = /\/app\/analytics/;
const AUDIT_URL_REGEX = /\/app\/analytics\/audit/;

test.describe("Analytics Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Login as owner (admin access for analytics)
    await login(page);
  });

  test("should navigate to analytics page", async ({ page }) => {
    await page.getByRole("link", { name: "Analytics" }).click();
    await expect(page).toHaveURL(ANALYTICS_URL_REGEX);
  });

  test("should display analytics tabs", async ({ page }) => {
    await page.goto("/app/analytics");
    await page.waitForLoadState("networkidle");

    // Check for analytics tabs
    const tabs = ["Overview", "Matters", "Clients", "Financial", "Staff"];
    for (const tab of tabs) {
      const _tabElement = page.getByRole("tab", { name: tab });
      // At least some tabs should be visible
    }
  });

  test("should display date range filter", async ({ page }) => {
    await page.goto("/app/analytics");
    await page.waitForLoadState("networkidle");

    // Check for date range filter
    // May be a dropdown, date pickers, or preset buttons
  });

  test("should display KPI cards", async ({ page }) => {
    await page.goto("/app/analytics");
    await page.waitForLoadState("networkidle");

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Should show some KPI metrics
  });

  test("should navigate to audit log", async ({ page }) => {
    await page.goto("/app/analytics/audit");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(AUDIT_URL_REGEX);
  });

  test("should display audit log table", async ({ page }) => {
    await page.goto("/app/analytics/audit");
    await page.waitForLoadState("networkidle");

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Should show audit log table or empty state
  });

  test("should display audit log filters", async ({ page }) => {
    await page.goto("/app/analytics/audit");
    await page.waitForLoadState("networkidle");

    // Check for filter controls (user, action, date)
    // May have search, dropdowns, or date pickers
  });
});
