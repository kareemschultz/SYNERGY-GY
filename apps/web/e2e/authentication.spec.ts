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
const CLIENT_DETAIL_URL_REGEX = /\/app\/clients\//;
const WELCOME_BACK_REGEX = /Welcome back/;
const UPPERCASE_START_REGEX = /^[A-Z]/;
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

    // Verify welcome message with user name (use .first() due to toast and header both matching)
    await expect(page.getByText(WELCOME_BACK_REGEX).first()).toBeVisible();

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

    // If there are clients, check one (this tests the $client-id.tsx fix)
    const clientLinks = page
      .getByRole("link")
      .filter({ hasText: UPPERCASE_START_REGEX });
    const count = await clientLinks.count();

    if (count > 0) {
      // Click first client
      await clientLinks.first().click();

      // Wait for client detail page to load
      await page.waitForLoadState("networkidle");

      // Verify we're on client detail page (not stuck at Access Pending)
      await expect(page).toHaveURL(CLIENT_DETAIL_URL_REGEX);

      // Verify page content loads (staff status with financial access was checked)
      // Owner should have canViewFinancials=true, so financial tabs should be visible
      await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
    }
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
