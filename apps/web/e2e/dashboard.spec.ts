import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";

/**
 * E2E Tests for Dashboard
 * Tests KPI cards, charts, recent data, and quick links
 */

const _APP_URL_REGEX = /\/app$/;
const CLIENTS_URL_REGEX = /\/app\/clients/;
const MATTERS_URL_REGEX = /\/app\/matters/;
const WELCOME_REGEX = /Welcome/;

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await login(page);
  });

  test("should display dashboard with KPI cards", async ({ page }) => {
    // Verify dashboard heading
    await expect(
      page.getByText("Overview of your business operations")
    ).toBeVisible();

    // Check for KPI cards - they should show numbers or loading states
    // Use .first() because some text may appear multiple times on dashboard
    await expect(page.getByText("Active Clients").first()).toBeVisible();
    await expect(page.getByText("Open Matters").first()).toBeVisible();
    await expect(page.getByText("Upcoming Deadlines").first()).toBeVisible();
    await expect(page.getByText("Documents").first()).toBeVisible();
  });

  test("should display matter status chart", async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForLoadState("networkidle");

    // Check for matter status section
    await expect(page.getByText("Matters by Status").first()).toBeVisible();
  });

  test("should display upcoming deadlines section", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Check for upcoming deadlines section (use .first() due to multiple matches)
    await expect(page.getByText("Upcoming Deadlines").first()).toBeVisible();
  });

  test("should display recent matters section", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Check for recent matters section (use .first() due to multiple matches)
    await expect(page.getByText("Recent Matters").first()).toBeVisible();
  });

  test("should navigate to clients from dashboard link", async ({ page }) => {
    // Find and click quick link to Clients
    await page.getByRole("link", { name: "Clients" }).first().click();
    await expect(page).toHaveURL(CLIENTS_URL_REGEX);
  });

  test("should navigate to matters from dashboard link", async ({ page }) => {
    await page.getByRole("link", { name: "Matters" }).first().click();
    await expect(page).toHaveURL(MATTERS_URL_REGEX);
  });

  test("should show welcome message with user name", async ({ page }) => {
    // Dashboard should greet the user (use .first() due to toast and header both containing "Welcome")
    await expect(page.getByText(WELCOME_REGEX).first()).toBeVisible();
  });
});
