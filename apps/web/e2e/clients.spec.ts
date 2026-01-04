import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";

// Regex patterns at top level for performance
const CLIENT_DETAIL_URL_REGEX = /\/app\/clients\//;
const UNEMPLOYED_REGEX = /unemployed/i;
const CLIENT_WIZARD_REGEX = /wizard|client wizard/i;
const EMPLOYMENT_INFO_REGEX = /Employment Information/i;
const SERVICES_COUNT_REGEX = /\d+\s+services?/i;

test.describe("Client Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await login(page);
  });

  test("should create a new client via wizard", async ({ page }) => {
    // Navigate to Clients
    await page.getByRole("link", { name: "Clients" }).click();

    // Open Wizard - use data-testid or link role (buttons with asChild render as links)
    const wizardButton = page.getByTestId("clients-wizard-btn");
    if (await wizardButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await wizardButton.click();
    } else {
      // Fallback to link role
      await page.getByRole("link", { name: CLIENT_WIZARD_REGEX }).click();
    }
    await expect(
      page.getByRole("heading", { name: "New Client" })
    ).toBeVisible();

    // Step 1: Client Type
    await page.getByText("Individual", { exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 2: Basic Info - Use pressSequentially for TanStack Form compatibility
    const firstNameInput = page.getByLabel("First Name");
    await firstNameInput.click();
    await firstNameInput.clear();
    await firstNameInput.pressSequentially("Test", { delay: 10 });

    const lastNameInput = page.getByLabel("Last Name");
    await lastNameInput.click();
    await lastNameInput.clear();
    await lastNameInput.pressSequentially(`Client-${Date.now()}`, {
      delay: 10,
    });

    const dobInput = page.getByLabel("Date of Birth");
    await dobInput.click();
    await dobInput.clear();
    await dobInput.pressSequentially("1990-01-01", { delay: 10 });

    await page.getByRole("button", { name: "Continue" }).click();

    // Step 3: Contact - Use pressSequentially
    const emailInput = page.getByLabel("Email Address");
    await emailInput.click();
    await emailInput.clear();
    await emailInput.pressSequentially(`test-${Date.now()}@example.com`, {
      delay: 10,
    });

    // Use ID selector for main phone field to avoid matching emergency/next of kin phone fields
    const phoneInput = page.locator("#phone");
    await phoneInput.click();
    await phoneInput.clear();
    await phoneInput.pressSequentially("592-600-0000", { delay: 10 });

    await page.getByRole("button", { name: "Continue" }).click();

    // Step 4: Identification (Optional)
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 5: Employment (Required for individuals)
    // Note: The step is titled "Employment & Income" in progress bar, but heading is "Employment Information"
    const employmentHeading = page.getByRole("heading", {
      name: EMPLOYMENT_INFO_REGEX,
    });
    if (
      await employmentHeading.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      // Select Employment Status (required field)
      const statusTrigger = page.locator("#employmentStatus");
      await statusTrigger.click();
      // Select Unemployed option
      const unemployedOption = page.getByRole("option", {
        name: UNEMPLOYED_REGEX,
      });
      await unemployedOption.click();
      await page.waitForTimeout(500);
      await page.getByRole("button", { name: "Continue" }).click();
    }

    // Steps 6-7: Navigate through optional steps (Beneficial Ownership, AML/KYC)
    // Keep clicking Continue/Skip until we see the GCMC business button (Services step)
    const gcmcButton = page.getByRole("button", { name: "GCMC" });

    // Try up to 5 times to navigate through optional steps
    for (let attempt = 0; attempt < 5; attempt++) {
      // Check if we've reached the Services step
      if (await gcmcButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        break;
      }

      // Try Continue button first
      const continueBtn = page.getByRole("button", { name: "Continue" });
      if (await continueBtn.isEnabled({ timeout: 500 }).catch(() => false)) {
        await continueBtn.click();
        await page.waitForTimeout(500);
        continue;
      }

      // Try Skip button if Continue is disabled
      const skipBtn = page.getByRole("button", { name: "Skip" });
      if (await skipBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await skipBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // Step 8: Services - Now we should see the GCMC button
    await gcmcButton.waitFor({ state: "visible", timeout: 5000 });
    await gcmcButton.click();

    // Wait for GCMC services section to appear (shows after selecting business)
    // The section title contains "GCMC Services" or just the services checkboxes
    await page.waitForTimeout(2000); // Give React time to update state and re-render

    // Look for the GCMC Services section title (use first() to avoid strict mode)
    const gcmcServicesSection = page.getByText("GCMC Services").first();
    await gcmcServicesSection.waitFor({ state: "visible", timeout: 10_000 });

    // Scroll the services section into view
    await gcmcServicesSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // Services are displayed in accordion categories (e.g., "Training & Development - 4 services")
    // Click the first accordion to expand it and reveal service checkboxes
    const categoryAccordion = page
      .locator('[data-orientation="vertical"]')
      .locator("button")
      .first();

    // Alternative: find by the pattern "X services"
    const servicesAccordion = page.getByText(SERVICES_COUNT_REGEX).first();
    if (
      await servicesAccordion.isVisible({ timeout: 2000 }).catch(() => false)
    ) {
      await servicesAccordion.scrollIntoViewIfNeeded();
      await servicesAccordion.click();
      await page.waitForTimeout(500);
    } else if (
      await categoryAccordion.isVisible({ timeout: 2000 }).catch(() => false)
    ) {
      await categoryAccordion.scrollIntoViewIfNeeded();
      await categoryAccordion.click();
      await page.waitForTimeout(500);
    }

    // Now try to find service checkboxes inside the expanded accordion
    const checkboxes = page.locator('button[role="checkbox"]');

    // Wait for checkboxes to appear after accordion expansion
    let checkboxCount = 0;
    for (let attempt = 0; attempt < 5; attempt++) {
      checkboxCount = await checkboxes.count();
      if (checkboxCount > 0) {
        break;
      }
      await page.waitForTimeout(500);
    }

    if (checkboxCount > 0) {
      // Click the first checkbox to select a service
      await checkboxes.first().scrollIntoViewIfNeeded();
      await checkboxes.first().click();
      await page.waitForTimeout(500);
    } else {
      // If still no checkboxes, throw descriptive error
      throw new Error(
        "No service checkboxes found after expanding accordion - check ServiceCategoryAccordion component"
      );
    }

    await page.waitForTimeout(500);

    // Wait for Continue button to become enabled
    await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled({
      timeout: 5000,
    });
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 9: Documents (Optional)
    await page.getByRole("button", { name: "Continue" }).click();

    // Review & Submit
    await page.getByRole("button", { name: "Create Client" }).click();

    // Expect redirection to Client Detail (with longer timeout for creation)
    // Use first() to handle toast + heading both showing success message
    await expect(
      page.getByText("Client created successfully").first()
    ).toBeVisible({
      timeout: 15_000,
    });
    await expect(page).toHaveURL(CLIENT_DETAIL_URL_REGEX, { timeout: 10_000 });

    // Check for Services Tab
    await expect(page.getByRole("tab", { name: "Services" })).toBeVisible();
  });
});
