import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";

// Regex patterns at top level for performance
const APP_URL_REGEX = /\/app/;

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

    // Fill Credentials (using test account)
    const emailInput = page.getByLabel("Email address");
    await emailInput.waitFor({ state: "visible", timeout: 15_000 });
    await emailInput.fill("owner@gcmc.gy");
    // Use specific CSS selector to avoid matching TanStack Router DevTools elements
    await page.locator('input[type="password"]').fill("Password123");
    await page.getByRole("button", { name: "Sign In" }).click();

    // Verify Dashboard access
    await expect(page).toHaveURL(APP_URL_REGEX);
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

    // Open New Client Wizard
    await page.getByRole("button", { name: "New Client" }).click();
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
