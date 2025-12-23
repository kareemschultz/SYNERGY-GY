import { expect, test } from "@playwright/test";

/**
 * E2E Tests for Dashboard
 * Tests KPI cards, charts, recent data, and quick links
 */

const APP_URL_REGEX = /\/app$/;
const CLIENTS_URL_REGEX = /\/app\/clients/;
const MATTERS_URL_REGEX = /\/app\/matters/;
const WELCOME_REGEX = /Welcome/;

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.getByLabel("Email").fill("owner@gcmc.gy");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(APP_URL_REGEX);
  });

  test("should display dashboard with KPI cards", async ({ page }) => {
    // Verify dashboard heading
    await expect(
      page.getByText("Overview of your business operations")
    ).toBeVisible();

    // Check for KPI cards - they should show numbers or loading states
    await expect(page.getByText("Active Clients")).toBeVisible();
    await expect(page.getByText("Open Matters")).toBeVisible();
    await expect(page.getByText("Upcoming Deadlines")).toBeVisible();
    await expect(page.getByText("Documents")).toBeVisible();
  });

  test("should display matter status chart", async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForLoadState("networkidle");

    // Check for matter status section
    await expect(page.getByText("Matters by Status")).toBeVisible();
  });

  test("should display upcoming deadlines section", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Check for upcoming deadlines section
    await expect(page.getByText("Upcoming Deadlines")).toBeVisible();
  });

  test("should display recent matters section", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Check for recent matters section
    await expect(page.getByText("Recent Matters")).toBeVisible();
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
    // Dashboard should greet the user
    await expect(page.getByText(WELCOME_REGEX)).toBeVisible();
  });
});
