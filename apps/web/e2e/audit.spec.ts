import { expect, test } from "@playwright/test";

// Regex patterns at top level for performance
const LOGIN_TITLE_REGEX = /Login/;
const APP_URL_REGEX = /\/app/;

test.describe("SYNERGY-GY Full App Audit", () => {
  // 1. Authentication Flow
  test("should allow user to login and reach dashboard", async ({ page }) => {
    // Navigate to Login
    await page.goto("/login");
    await expect(page).toHaveTitle(LOGIN_TITLE_REGEX);

    // Screenshot: Login Page
    await page.screenshot({
      path: "audit-screenshots/01-login-page.png",
      fullPage: true,
    });

    // Fill Credentials (using test account)
    await page.getByLabel("Email").fill("owner@gcmc.gy");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Verify Dashboard access
    await expect(page).toHaveURL(APP_URL_REGEX);
    await expect(
      page.getByText("Overview of your business operations")
    ).toBeVisible();

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
    // Assume logged in (setup auth reuse in real config)
    await page.goto("/login");
    await page.getByLabel("Email").fill("owner@gcmc.gy");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: "Sign in" }).click();

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
    // Login
    await page.goto("/login");
    await page.getByLabel("Email").fill("owner@gcmc.gy");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Navigate to Services (Admin)
    await page.goto("/app/admin/services");

    // Screenshot: Service Catalog
    await page.screenshot({
      path: "audit-screenshots/05-service-catalog.png",
      fullPage: true,
    });
  });
});
