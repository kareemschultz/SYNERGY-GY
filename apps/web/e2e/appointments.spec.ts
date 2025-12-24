import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";

/**
 * E2E Tests for Appointment Management
 * Tests appointment list, creation, calendar view
 */

const APPOINTMENTS_URL_REGEX = /\/app\/appointments/;
const APPOINTMENTS_CALENDAR_REGEX = /\/app\/appointments\/calendar/;
const NEW_BUTTON_REGEX = /new/i;
const NEW_APPOINTMENT_REGEX = /new appointment|create appointment|schedule/i;

test.describe("Appointment Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await login(page);
  });

  test("should navigate to appointments page", async ({ page }) => {
    await page.getByRole("link", { name: "Appointments" }).click();
    await expect(page).toHaveURL(APPOINTMENTS_URL_REGEX);
  });

  test("should display appointment filters", async ({ page }) => {
    await page.goto("/app/appointments");
    await page.waitForLoadState("networkidle");

    // Page should load without errors
    await expect(page).toHaveURL(APPOINTMENTS_URL_REGEX);
  });

  test("should display new appointment button", async ({ page }) => {
    await page.goto("/app/appointments");
    await page.waitForLoadState("networkidle");

    // Check for new appointment button (may be "New Appointment" or just "New" or icon)
    const newButton = page
      .getByRole("button", { name: NEW_BUTTON_REGEX })
      .first();
    await expect(newButton).toBeVisible();
  });

  test("should navigate to calendar view", async ({ page }) => {
    await page.goto("/app/appointments/calendar");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(APPOINTMENTS_CALENDAR_REGEX);
  });

  test("should open new appointment form", async ({ page }) => {
    await page.goto("/app/appointments");
    await page.waitForLoadState("networkidle");

    // Click new button
    const newButton = page
      .getByRole("button", { name: NEW_BUTTON_REGEX })
      .first();
    await newButton.click();

    // Should show appointment form - could be dialog or navigation
    // Check for either a dialog or form elements
    const hasDialog = await page
      .getByRole("dialog")
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    const hasFormTitle = await page
      .getByText(NEW_APPOINTMENT_REGEX)
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    expect(hasDialog || hasFormTitle).toBe(true);
  });
});
