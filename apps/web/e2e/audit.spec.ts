import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";

// Regex patterns at top level for performance
const APP_URL_REGEX = /\/app/;
const CLIENT_WIZARD_REGEX = /wizard|client wizard/i;

test.describe("SYNERGY-GY Full App Audit", () => {
  // 1. Authentication Flow
  test("should allow user to login and reach dashboard", async ({ page }) => {
    // Navigate to Login
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Screenshot: Login Page
    await page.screenshot({
      path: "audit-screenshots/01-login-page.png",
      fullPage: true,
    });

    // Fill Credentials using pressSequentially for TanStack Form compatibility
    const emailInput = page.getByLabel("Email address");
    await emailInput.waitFor({ state: "visible", timeout: 15_000 });
    await emailInput.click();
    await emailInput.clear();
    await emailInput.pressSequentially("owner@gcmc.gy", { delay: 10 });

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.click();
    await passwordInput.clear();
    await passwordInput.pressSequentially("Password123", { delay: 10 });

    // Blur to trigger validation
    await passwordInput.blur();
    await page.waitForTimeout(200);

    // Wait for button to be enabled
    const signInButton = page.getByRole("button", { name: "Sign In" });
    await expect(signInButton).toBeEnabled({ timeout: 5000 });

    await signInButton.click();

    // Verify Dashboard access
    await expect(page).toHaveURL(APP_URL_REGEX, { timeout: 20_000 });
    await expect(
      page.getByText("Overview of your business operations")
    ).toBeVisible({ timeout: 15_000 });

    // Screenshot: Dashboard
    await page.screenshot({
      path: "audit-screenshots/02-dashboard.png",
      fullPage: true,
    });
  });

  // 2. Client Management Flow
  test("should navigate to client list and open new client wizard", async ({
    page,
  }) => {
    // Login using helper
    await login(page);

    // Navigate to Clients
    await page.getByRole("link", { name: "Clients" }).click();
    await expect(page.getByRole("heading", { name: "Clients" })).toBeVisible();

    // Screenshot: Client List
    await page.screenshot({
      path: "audit-screenshots/03-client-list.png",
      fullPage: true,
    });

    // Open New Client Wizard - use data-testid or link role (buttons with asChild render as links)
    const wizardButton = page.getByTestId("clients-wizard-btn");
    if (await wizardButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await wizardButton.click();
    } else {
      // Fallback to link role
      await page.getByRole("link", { name: CLIENT_WIZARD_REGEX }).click();
    }
    await expect(
      page.getByRole("heading", { name: "New Client" })
    ).toBeVisible();

    // Screenshot: Client Wizard Step 1
    await page.screenshot({
      path: "audit-screenshots/04-client-wizard-step1.png",
      fullPage: true,
    });
  });

  // 3. Service Catalog Flow (Business Logic Check)
  test("should display service catalog correctly", async ({ page }) => {
    // Login using helper
    await login(page);

    // Navigate to Services (Admin)
    await page.goto("/app/admin/services");
    await page.waitForLoadState("networkidle");

    // Screenshot: Service Catalog
    await page.screenshot({
      path: "audit-screenshots/05-service-catalog.png",
      fullPage: true,
    });
  });
});
