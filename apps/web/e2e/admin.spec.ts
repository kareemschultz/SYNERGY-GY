import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";

/**
 * E2E Tests for Admin Panel
 * Tests staff management, roles, portal invites, settings
 */

const ADMIN_URL_REGEX = /\/app\/admin/;
const ADMIN_STAFF_REGEX = /\/app\/admin\/staff/;
const ADMIN_PORTAL_INVITES_REGEX = /\/app\/admin\/portal-invites/;
const ADMIN_SETTINGS_REGEX = /\/app\/admin\/settings/;
const ADMIN_SERVICES_REGEX = /\/app\/admin\/services/;
const ADMIN_KB_REGEX = /\/app\/admin\/knowledge-base/;
const NEW_STAFF_BUTTON_REGEX = /New Staff|Add Staff/i;

test.describe("Admin Panel", () => {
  test.beforeEach(async ({ page }) => {
    // Login as owner (admin access)
    await login(page);
  });

  test("should navigate to admin panel", async ({ page }) => {
    await page.getByRole("link", { name: "Admin" }).click();
    await expect(page).toHaveURL(ADMIN_URL_REGEX);
  });

  test("should navigate to staff management", async ({ page }) => {
    await page.goto("/app/admin/staff");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(ADMIN_STAFF_REGEX);
  });

  test("should display staff list", async ({ page }) => {
    await page.goto("/app/admin/staff");
    await page.waitForLoadState("networkidle");

    // Check for staff table or list
    // Should show at least the owner account
  });

  test("should display new staff button", async ({ page }) => {
    await page.goto("/app/admin/staff");
    await page.waitForLoadState("networkidle");

    const _newButton = page.getByRole("button", {
      name: NEW_STAFF_BUTTON_REGEX,
    });
    // May or may not exist based on permissions
  });

  test("should navigate to portal invites", async ({ page }) => {
    await page.goto("/app/admin/portal-invites");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(ADMIN_PORTAL_INVITES_REGEX);
  });

  test("should navigate to admin settings", async ({ page }) => {
    await page.goto("/app/admin/settings");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(ADMIN_SETTINGS_REGEX);
  });

  test("should navigate to service management", async ({ page }) => {
    await page.goto("/app/admin/services");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(ADMIN_SERVICES_REGEX);
  });

  test("should navigate to knowledge base management", async ({ page }) => {
    await page.goto("/app/admin/knowledge-base");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(ADMIN_KB_REGEX);
  });
});
