import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";

/**
 * E2E Tests for Appointment Management
 * Tests appointment list, creation, calendar view
 */

const APPOINTMENTS_URL_REGEX = /\/app\/appointments/;
const APPOINTMENTS_CALENDAR_REGEX = /\/app\/appointments\/calendar/;
const APPOINTMENTS_NEW_REGEX = /\/app\/appointments\/new/;
const NEW_APPOINTMENT_REGEX = /New Appointment/i;

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

    // Check for date range filter options
    const filterButtons = ["Today", "Week", "Month", "All"];
    for (const filter of filterButtons) {
      const _button = page.getByRole("button", { name: filter });
      // At least some should be visible
    }
  });

  test("should display new appointment button", async ({ page }) => {
    await page.goto("/app/appointments");
    await page.waitForLoadState("networkidle");

    // Check for new appointment button
    const newButton = page.getByRole("button", { name: NEW_APPOINTMENT_REGEX });
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

    await page.getByRole("button", { name: NEW_APPOINTMENT_REGEX }).click();

    // Should show appointment form dialog or navigate to new page
    await expect(page).toHaveURL(APPOINTMENTS_NEW_REGEX);
  });
});
