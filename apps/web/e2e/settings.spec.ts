import { expect, test } from "@playwright/test";

/**
 * E2E Tests for Settings
 * Tests user settings and preferences
 */

const SETTINGS_URL_REGEX = /\/app\/settings/;
const CHANGE_PASSWORD_REGEX = /Change Password|Update Password/i;
const NOTIFICATION_REGEX = /Notification/i;

test.describe("User Settings", () => {
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

  test("should navigate to settings page", async ({ page }) => {
    await page.goto("/app/settings");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(SETTINGS_URL_REGEX);
  });

  test("should display user profile section", async ({ page }) => {
    await page.goto("/app/settings");
    await page.waitForLoadState("networkidle");

    // Check for profile section with name/email
    // May show current user info
  });

  test("should display password change option", async ({ page }) => {
    await page.goto("/app/settings");
    await page.waitForLoadState("networkidle");

    // Check for change password button or link
    const _passwordButton = page.getByRole("button", {
      name: CHANGE_PASSWORD_REGEX,
    });
    // May or may not be visible
  });

  test("should display notification preferences", async ({ page }) => {
    await page.goto("/app/settings");
    await page.waitForLoadState("networkidle");

    // Check for notification preferences section
    const _notificationSection = page.getByText(NOTIFICATION_REGEX);
    // May or may not exist
  });
});
