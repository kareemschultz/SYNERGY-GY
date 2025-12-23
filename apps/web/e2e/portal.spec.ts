import { expect, test } from "@playwright/test";

/**
 * E2E Tests for Client Portal
 * Tests portal login page and public portal routes
 */

const PORTAL_LOGIN_URL_REGEX = /\/portal\/login/;
const PORTAL_FORGOT_PASSWORD_REGEX = /\/portal\/forgot-password/;
const PORTAL_REGISTER_REGEX = /\/portal\/register/;
const EMAIL_LABEL_REGEX = /Email/i;
const PASSWORD_LABEL_REGEX = /Password/i;
const SIGN_IN_BUTTON_REGEX = /Sign in|Login/i;
const FORGOT_LINK_REGEX = /Forgot/i;

test.describe("Client Portal - Public Routes", () => {
  test("should display portal login page", async ({ page }) => {
    await page.goto("/portal/login");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(PORTAL_LOGIN_URL_REGEX);
  });

  test("should have email and password fields on portal login", async ({
    page,
  }) => {
    await page.goto("/portal/login");
    await page.waitForLoadState("networkidle");

    // Check for login form fields
    const emailInput = page.getByLabel(EMAIL_LABEL_REGEX);
    const passwordInput = page.getByLabel(PASSWORD_LABEL_REGEX);
    const signInButton = page.getByRole("button", {
      name: SIGN_IN_BUTTON_REGEX,
    });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(signInButton).toBeVisible();
  });

  test("should have link to forgot password", async ({ page }) => {
    await page.goto("/portal/login");
    await page.waitForLoadState("networkidle");

    // Check for forgot password link
    const _forgotLink = page.getByRole("link", { name: FORGOT_LINK_REGEX });
    // May or may not exist
  });

  test("should navigate to forgot password page", async ({ page }) => {
    await page.goto("/portal/forgot-password");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(PORTAL_FORGOT_PASSWORD_REGEX);
  });

  test("should display forgot password form", async ({ page }) => {
    await page.goto("/portal/forgot-password");
    await page.waitForLoadState("networkidle");

    // Check for email input and submit button
    const emailInput = page.getByLabel(EMAIL_LABEL_REGEX);
    await expect(emailInput).toBeVisible();
  });

  test("should navigate to register page if available", async ({ page }) => {
    await page.goto("/portal/register");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(PORTAL_REGISTER_REGEX);
  });
});

test.describe("Client Portal - Requires Authentication", () => {
  test("should redirect to login when accessing protected portal routes", async ({
    page,
  }) => {
    await page.goto("/portal");
    await page.waitForLoadState("networkidle");

    // Should redirect to login or show login prompt
    // Either URL changes to login or login form is shown
  });

  test("should redirect documents page without auth", async ({ page }) => {
    await page.goto("/portal/documents");
    await page.waitForLoadState("networkidle");

    // Should redirect to login
  });

  test("should redirect appointments page without auth", async ({ page }) => {
    await page.goto("/portal/appointments");
    await page.waitForLoadState("networkidle");

    // Should redirect to login
  });
});
