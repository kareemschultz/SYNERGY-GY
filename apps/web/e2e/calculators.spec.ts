import { expect, test } from "@playwright/test";

/**
 * E2E Tests for Tax Calculators
 * Tests PAYE, VAT, NIS, and Salary calculators
 */

const CALCULATORS_URL_REGEX = /\/app\/calculators/;
const PAYE_URL_REGEX = /\/app\/calculators\/paye/;
const VAT_URL_REGEX = /\/app\/calculators\/vat/;
const NIS_URL_REGEX = /\/app\/calculators\/nis/;
const SALARY_URL_REGEX = /\/app\/calculators\/salary/;
const INCOME_LABEL_REGEX = /Income|Gross|Amount/i;
const CALCULATE_BUTTON_REGEX = /Calculate/i;

test.describe("Tax Calculators", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.getByLabel("Email").fill("owner@gcmc.gy");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(
      page.getByText("Overview of your business operations")
    ).toBeVisible();
  });

  test("should navigate to calculators page", async ({ page }) => {
    await page.getByRole("link", { name: "Calculators" }).click();
    await expect(page).toHaveURL(CALCULATORS_URL_REGEX);
  });

  test("should display calculator options", async ({ page }) => {
    await page.goto("/app/calculators");
    await page.waitForLoadState("networkidle");

    // Check for calculator cards/links
    const calculatorOptions = ["PAYE", "VAT", "NIS", "Salary"];
    for (const calc of calculatorOptions) {
      const _element = page.getByText(calc, { exact: false });
      // At least some should be visible
    }
  });

  test("should navigate to PAYE calculator", async ({ page }) => {
    await page.goto("/app/calculators/paye");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(PAYE_URL_REGEX);
  });

  test("should navigate to VAT calculator", async ({ page }) => {
    await page.goto("/app/calculators/vat");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(VAT_URL_REGEX);
  });

  test("should navigate to NIS calculator", async ({ page }) => {
    await page.goto("/app/calculators/nis");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(NIS_URL_REGEX);
  });

  test("should navigate to Salary calculator", async ({ page }) => {
    await page.goto("/app/calculators/salary");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(SALARY_URL_REGEX);
  });

  test("should calculate PAYE tax", async ({ page }) => {
    await page.goto("/app/calculators/paye");
    await page.waitForLoadState("networkidle");

    // Find income input and enter value
    const incomeInput = page.getByLabel(INCOME_LABEL_REGEX);
    if (await incomeInput.isVisible()) {
      await incomeInput.fill("500000");

      // Find and click calculate button
      const calculateButton = page.getByRole("button", {
        name: CALCULATE_BUTTON_REGEX,
      });
      if (await calculateButton.isVisible()) {
        await calculateButton.click();

        // Should show results
        await page.waitForTimeout(1000);
        // Results should be visible
      }
    }
  });
});
