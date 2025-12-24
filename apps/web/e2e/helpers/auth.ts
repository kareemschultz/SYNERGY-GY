import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

// Top-level regex constants for performance
const APP_URL_REGEX = /\/app/;
const USER_MENU_REGEX = /user|account|profile/i;
const SIGN_OUT_REGEX = /sign out|logout/i;

/**
 * Login helper for E2E tests
 * Handles both logged-out and already-logged-in scenarios
 *
 * Uses native input events to properly trigger TanStack Form's onChange handlers
 */
export async function login(
  page: Page,
  email = "owner@gcmc.gy",
  password = "Password123"
): Promise<void> {
  await page.goto("/login");

  // Wait for network to be idle (React should be hydrated by then)
  await page.waitForLoadState("networkidle");

  // Check if we're already on the dashboard (redirected because logged in)
  const currentUrl = page.url();
  if (currentUrl.includes("/app")) {
    // Already logged in, verify dashboard is visible
    await expect(
      page.getByText("Overview of your business operations")
    ).toBeVisible({ timeout: 15_000 });
    return;
  }

  // Wait for the email input to be visible and enabled
  const emailInput = page.getByLabel("Email address");
  await emailInput.waitFor({ state: "visible", timeout: 15_000 });

  // TanStack Form uses controlled inputs. Use clear() + pressSequentially() to
  // properly trigger React's synthetic event system character by character.
  await emailInput.click();
  await emailInput.clear();
  await emailInput.pressSequentially(email, { delay: 10 });

  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.click();
  await passwordInput.clear();
  await passwordInput.pressSequentially(password, { delay: 10 });

  // Blur the password field to trigger validation
  await passwordInput.blur();

  // Small delay to let React process the state changes
  await page.waitForTimeout(200);

  // Wait for the Sign In button to be enabled (not disabled)
  const signInButton = page.getByRole("button", { name: "Sign In" });
  await expect(signInButton).toBeEnabled({ timeout: 5000 });

  // Click sign in button and wait for navigation
  await Promise.all([
    page.waitForURL(APP_URL_REGEX, { timeout: 20_000 }),
    signInButton.click(),
  ]);

  // Verify we're on the dashboard
  await expect(
    page.getByText("Overview of your business operations")
  ).toBeVisible({ timeout: 15_000 });
}

/**
 * Logout helper for E2E tests
 */
export async function logout(page: Page): Promise<void> {
  // Click user menu
  const userMenu = page.getByRole("button", { name: USER_MENU_REGEX });
  if (await userMenu.isVisible()) {
    await userMenu.click();
    await page.getByRole("menuitem", { name: SIGN_OUT_REGEX }).click();
  }
}
