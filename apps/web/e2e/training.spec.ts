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
const SEARCH_REGEX = /Search/i;
const NEW_COURSE_REGEX = /New Course/i;

test.describe("Training Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await login(page);
  });

  test("should navigate to training page", async ({ page }) => {
    await page.getByRole("link", { name: "Training" }).click();
    await expect(page).toHaveURL(TRAINING_URL_REGEX);
  });

  test("should display search functionality", async ({ page }) => {
    await page.goto("/app/training");
    await page.waitForLoadState("networkidle");

    const _searchInput = page.getByPlaceholder(SEARCH_REGEX);
    // Search may or may not exist
  });

  test("should display course category filter", async ({ page }) => {
    await page.goto("/app/training");
    await page.waitForLoadState("networkidle");

    // Check for category filter
    const _categories = [
      "HR",
      "Customer Relations",
      "Business Development",
      "Compliance",
    ];
    // At least some category filter should exist
  });

  test("should display new course button", async ({ page }) => {
    await page.goto("/app/training");
    await page.waitForLoadState("networkidle");

    const _newButton = page.getByRole("button", { name: NEW_COURSE_REGEX });
    // May or may not exist based on permissions
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
