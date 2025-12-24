import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";

// Regex patterns at top level for performance
const CLIENT_DETAIL_URL_REGEX = /\/app\/clients\//;
const UNEMPLOYED_REGEX = /unemployed/i;
const CLIENT_WIZARD_REGEX = /wizard|client wizard/i;

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

    // Step 5: Employment (Optional - depends on type, Individual usually has it)
    const employmentHeading = page.getByRole("heading", {
      name: "Employment & Income",
    });
    if (
      await employmentHeading.isVisible({ timeout: 2000 }).catch(() => false)
    ) {
      // Click on employment status dropdown
      const statusTrigger = page.getByRole("combobox").first();
      if (await statusTrigger.isVisible()) {
        await statusTrigger.click();
        // Select an option
        const unemployedOption = page.getByRole("option", {
          name: UNEMPLOYED_REGEX,
        });
        if (
          await unemployedOption.isVisible({ timeout: 2000 }).catch(() => false)
        ) {
          await unemployedOption.click();
        } else {
          // Just press escape to close dropdown
          await page.keyboard.press("Escape");
        }
      }
      await page.getByRole("button", { name: "Continue" }).click();
    }

    // Step 6: Services
    // Select GCMC business
    const gcmcButton = page.getByRole("button", { name: "GCMC" });
    if (await gcmcButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await gcmcButton.click();
    }

    // Wait for services to load (longer wait)
    await page.waitForTimeout(2000);

    // Just click the first checkbox available
    const checkboxes = page.locator('button[role="checkbox"]');
    const checkboxCount = await checkboxes.count();
    if (checkboxCount > 0) {
      await checkboxes.first().click();
      await page.waitForTimeout(500); // Wait for state to update
    }

    // Wait for Continue button to become enabled
    await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled({
      timeout: 5000,
    });
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 7: Documents (Optional)
    await page.getByRole("button", { name: "Continue" }).click();

    // Review & Submit
    await page.getByRole("button", { name: "Create Client" }).click();

    // Expect redirection to Client Detail (with longer timeout for creation)
    await expect(page.getByText("Client created successfully")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page).toHaveURL(CLIENT_DETAIL_URL_REGEX, { timeout: 10_000 });

    // Check for Services Tab
    await expect(page.getByRole("tab", { name: "Services" })).toBeVisible();
  });
});
