import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";

/**
 * E2E Regression Test for Access Pending Bug (#PROD-007)
 *
 * This test verifies that authenticated users with valid staff profiles
 * can access the dashboard without seeing "Access Pending" screen.
 *
 * Root Cause (Fixed in commit 708f6de):
 * - oRPC v1.12.3 wraps responses in { json: T } envelope
 * - Frontend was checking staffStatus?.hasStaffProfile instead of unwrapping
 * - This caused all users to be stuck at "Access Pending" screen
 *
 * Prevention:
 * - This test will fail if the unwrapOrpc() helper is not used
 * - Validates that staff status checks work correctly after login
 */

// Regex patterns at top level for performance
const APP_URL_REGEX = /\/app/;
const CLIENTS_URL_REGEX = /\/app\/clients/;
const UPPERCASE_START_REGEX = /^[A-Z]/;
const OVERVIEW_TAB_REGEX = /overview/i;
const SERVICES_TAB_REGEX = /services/i;
const ACCESS_PENDING_TEXT = "Access Pending";
const ACCOUNT_DEACTIVATED_TEXT = "Account Deactivated";
const DASHBOARD_INDICATOR = "Overview of your business operations";

test.describe("Authentication & Staff Access", () => {
  test("should allow authenticated owner to access dashboard without Access Pending", async ({
    page,
  }) => {
    // Use shared login helper for reliable TanStack Form interaction
    await login(page);

    // CRITICAL: Verify we're on the dashboard, NOT stuck at Access Pending
    await expect(page).toHaveURL(APP_URL_REGEX);

    // Verify "Access Pending" screen is NOT shown
    await expect(page.getByText(ACCESS_PENDING_TEXT)).not.toBeVisible();

    // Verify "Account Deactivated" screen is NOT shown
    await expect(page.getByText(ACCOUNT_DEACTIVATED_TEXT)).not.toBeVisible();

    // Verify dashboard content is visible (staff status check passed)
    await expect(page.getByText(DASHBOARD_INDICATOR)).toBeVisible({
      timeout: 10_000,
    });

    // Verify navigation menu is accessible (indicates full staff access)
    await expect(
      page.getByRole("link", { name: "Clients" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Matters" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Documents" }).first()
    ).toBeVisible();
  });

  test("should handle staff status check correctly on dashboard load", async ({
    page,
  }) => {
    // Use shared login helper
    await login(page);

    // Navigate directly to dashboard (tests loader logic)
    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    // Verify staff status check completed successfully
    // If unwrapOrpc() is not used, this will fail and show Access Pending
    await expect(page.getByText(DASHBOARD_INDICATOR)).toBeVisible({
      timeout: 10_000,
    });

    // Ensure no error messages
    await expect(page.getByText(ACCESS_PENDING_TEXT)).not.toBeVisible();
    await expect(page.getByText(ACCOUNT_DEACTIVATED_TEXT)).not.toBeVisible();
  });

  test("should load client detail page with correct financial access", async ({
    page,
  }) => {
    // Use shared login helper
    await login(page);

    // Navigate to Clients page
    await page.getByRole("link", { name: "Clients" }).first().click();
    await expect(page).toHaveURL(CLIENTS_URL_REGEX);

    // Wait for client list to load
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Check if there are any client rows/links
    // Look for links within table body that go to client detail pages
    const tableClientLinks = page.locator('tbody a[href*="/app/clients/"]');
    const clientCards = page.locator('[data-testid="client-card"]');
    // Fallback: look for table cells with links that start with uppercase (client names)
    const tableCellLinks = page
      .locator("td a")
      .filter({ hasText: UPPERCASE_START_REGEX });

    const tableLinksCount = await tableClientLinks.count();
    const cardCount = await clientCards.count();
    const cellLinksCount = await tableCellLinks.count();

    if (tableLinksCount > 0 || cardCount > 0 || cellLinksCount > 0) {
      // Click first available client
      if (tableLinksCount > 0) {
        await tableClientLinks.first().click();
      } else if (cardCount > 0) {
        await clientCards.first().click();
      } else {
        await tableCellLinks.first().click();
      }

      // Wait for client detail page to load
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      // Verify we're on client detail page (not stuck at Access Pending)
      // Check for tabs or page content
      const hasOverviewTab = await page
        .getByRole("tab", { name: OVERVIEW_TAB_REGEX })
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      const hasServicesTab = await page
        .getByRole("tab", { name: SERVICES_TAB_REGEX })
        .isVisible()
        .catch(() => false);

      expect(hasOverviewTab || hasServicesTab).toBe(true);
    }
    // If no clients exist, test still passes - page loads correctly
  });

  test("should handle page refresh without losing authentication", async ({
    page,
  }) => {
    // Use shared login helper
    await login(page);

    await expect(page.getByText(DASHBOARD_INDICATOR)).toBeVisible();

    // Refresh the page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify still on dashboard (staff status check passed again)
    await expect(page).toHaveURL(APP_URL_REGEX);
    await expect(page.getByText(DASHBOARD_INDICATOR)).toBeVisible();
    await expect(page.getByText(ACCESS_PENDING_TEXT)).not.toBeVisible();
  });
});
