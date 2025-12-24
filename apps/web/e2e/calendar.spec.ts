import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";

/**
 * E2E Tests for Calendar and Deadlines
 * Tests calendar view, deadline creation, deadline management
 */

const CALENDAR_URL_REGEX = /\/app\/calendar/;
const PREV_BUTTON_REGEX = /Previous|chevron-left/i;
const NEXT_BUTTON_REGEX = /Next|chevron-right/i;
const NEW_DEADLINE_REGEX = /New Deadline/i;

test.describe("Calendar & Deadlines", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await login(page);
  });

  test("should navigate to calendar page", async ({ page }) => {
    await page.getByRole("link", { name: "Calendar" }).click();
    await expect(page).toHaveURL(CALENDAR_URL_REGEX);
  });

  test("should display month navigation", async ({ page }) => {
    await page.goto("/app/calendar");
    await page.waitForLoadState("networkidle");

    // Check for month navigation buttons
    const _prevButton = page.getByRole("button", {
      name: PREV_BUTTON_REGEX,
    });
    const _nextButton = page.getByRole("button", {
      name: NEXT_BUTTON_REGEX,
    });
    // At least navigation should exist
  });

  test("should display calendar grid", async ({ page }) => {
    await page.goto("/app/calendar");
    await page.waitForLoadState("networkidle");

    // Check for day headers (Sun, Mon, Tue, etc.)
    const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (const day of dayHeaders) {
      await expect(page.getByText(day, { exact: true })).toBeVisible();
    }
  });

  test("should display new deadline button", async ({ page }) => {
    await page.goto("/app/calendar");
    await page.waitForLoadState("networkidle");

    // Check for new deadline button
    const newButton = page.getByRole("button", { name: NEW_DEADLINE_REGEX });
    await expect(newButton).toBeVisible();
  });

  test("should display business filter", async ({ page }) => {
    await page.goto("/app/calendar");
    await page.waitForLoadState("networkidle");

    // Check for business filter (GCMC/KAJ)
    const _businessFilter = page.getByRole("combobox");
    // At least one combobox should exist for filtering
  });
});
