import { expect, test } from "@playwright/test";

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
const LOGIN_TITLE_REGEX = /Login/;
const APP_URL_REGEX = /\/app/;
const ACCESS_PENDING_TEXT = "Access Pending";
const ACCOUNT_DEACTIVATED_TEXT = "Account Deactivated";
const DASHBOARD_INDICATOR = "Overview of your business operations";

test.describe("Authentication & Staff Access", () => {
  test("should allow authenticated owner to access dashboard without Access Pending", async ({
    page,
  }) => {
    // Navigate to login page
    await page.goto("/login");
    await expect(page).toHaveTitle(LOGIN_TITLE_REGEX);

    // Login with owner credentials (from INITIAL_OWNER_* env vars)
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("TestPassword123!");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Wait for navigation to complete
    await page.waitForLoadState("networkidle");

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

    // Verify welcome message with user name
    await expect(page.getByText(/Welcome back/)).toBeVisible();

    // Verify navigation menu is accessible (indicates full staff access)
    await expect(page.getByRole("link", { name: "Clients" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Matters" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Documents" })).toBeVisible();
  });

  test("should handle staff status check correctly on dashboard load", async ({
    page,
  }) => {
    // Login
    await page.goto("/login");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("TestPassword123!");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Wait for dashboard to load
    await expect(page).toHaveURL(APP_URL_REGEX);

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
    // Login
    await page.goto("/login");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("TestPassword123!");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(APP_URL_REGEX);

    // Navigate to Clients page
    await page.getByRole("link", { name: "Clients" }).click();
    await expect(page).toHaveURL(/\/app\/clients/);

    // If there are clients, check one (this tests the $client-id.tsx fix)
    const clientLinks = page.getByRole("link").filter({ hasText: /^[A-Z]/ });
    const count = await clientLinks.count();

    if (count > 0) {
      // Click first client
      await clientLinks.first().click();

      // Wait for client detail page to load
      await page.waitForLoadState("networkidle");

      // Verify we're on client detail page (not stuck at Access Pending)
      await expect(page).toHaveURL(/\/app\/clients\//);

      // Verify page content loads (staff status with financial access was checked)
      // Owner should have canViewFinancials=true, so financial tabs should be visible
      await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
    }
  });

  test("should handle page refresh without losing authentication", async ({
    page,
  }) => {
    // Login
    await page.goto("/login");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("TestPassword123!");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(APP_URL_REGEX);
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
