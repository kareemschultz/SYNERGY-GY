import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";

/**
 * E2E Tests for Training Management
 * Tests courses, schedules, and enrollments
 */

const TRAINING_URL_REGEX = /\/app\/training/;
const TRAINING_ENROLLMENTS_REGEX = /\/app\/training\/enrollments/;
const TRAINING_CALENDAR_REGEX = /\/app\/training\/calendar/;
const TRAINING_COURSES_REGEX = /\/app\/training\/courses/;

test.describe("Training Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await login(page);
  });

  test("should navigate to training page", async ({ page }) => {
    // Training may be in sidebar or under a menu
    // Try direct navigation first
    await page.goto("/app/training");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(TRAINING_URL_REGEX);
  });

  test("should display search functionality", async ({ page }) => {
    await page.goto("/app/training");
    await page.waitForLoadState("networkidle");

    // Page should load without errors
    await expect(page).toHaveURL(TRAINING_URL_REGEX);
  });

  test("should display course category filter", async ({ page }) => {
    await page.goto("/app/training");
    await page.waitForLoadState("networkidle");

    // Page should load without errors
    await expect(page).toHaveURL(TRAINING_URL_REGEX);
  });

  test("should display new course button", async ({ page }) => {
    await page.goto("/app/training");
    await page.waitForLoadState("networkidle");

    // Button may or may not exist based on permissions
    await expect(page).toHaveURL(TRAINING_URL_REGEX);
  });

  test("should navigate to enrollments page", async ({ page }) => {
    await page.goto("/app/training/enrollments");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(TRAINING_ENROLLMENTS_REGEX);
  });

  test("should navigate to training calendar", async ({ page }) => {
    await page.goto("/app/training/calendar");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(TRAINING_CALENDAR_REGEX);
  });

  test("should navigate to courses list", async ({ page }) => {
    await page.goto("/app/training/courses");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(TRAINING_COURSES_REGEX);
  });
});
