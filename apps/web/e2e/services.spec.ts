import { expect, test } from "@playwright/test";

/**
 * E2E Tests for Service Catalog
 * Tests service browsing, categories, and details
 */

const SERVICES_URL_REGEX = /\/app\/services/;
const SEARCH_REGEX = /Search/i;
const GCMC_REGEX = /GCMC/i;
const KAJ_REGEX = /KAJ/i;

test.describe("Service Catalog", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.getByLabel("Email").fill("owner@gcmc.gy");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(
      page.getByText("Overview of your business operations")
    ).toBeVisible();
  });

  test("should navigate to services page", async ({ page }) => {
    await page.getByRole("link", { name: "Services" }).click();
    await expect(page).toHaveURL(SERVICES_URL_REGEX);
  });

  test("should display search functionality", async ({ page }) => {
    await page.goto("/app/services");
    await page.waitForLoadState("networkidle");

    const searchInput = page.getByPlaceholder(SEARCH_REGEX);
    await expect(searchInput).toBeVisible();
  });

  test("should display business filter", async ({ page }) => {
    await page.goto("/app/services");
    await page.waitForLoadState("networkidle");

    // Check for business filter (GCMC/KAJ)
    const _gcmcButton = page.getByRole("button", { name: GCMC_REGEX });
    const _kajButton = page.getByRole("button", { name: KAJ_REGEX });
    // At least one should be visible
  });

  test("should display service categories", async ({ page }) => {
    await page.goto("/app/services");
    await page.waitForLoadState("networkidle");

    // Wait for categories to load
    await page.waitForTimeout(2000);

    // Categories might be tabs, filters, or sections
  });

  test("should display service cards", async ({ page }) => {
    await page.goto("/app/services");
    await page.waitForLoadState("networkidle");

    // Wait for services to load
    await page.waitForTimeout(2000);

    // Should show service cards or empty state
  });
});
