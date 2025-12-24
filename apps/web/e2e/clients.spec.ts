import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";

// Regex patterns at top level for performance
const CLIENT_DETAIL_URL_REGEX = /\/app\/clients\//;

test.describe("Client Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await login(page);
  });

  test("should create a new client via wizard", async ({ page }) => {
    // Navigate to Clients
    await page.getByRole("link", { name: "Clients" }).click();

    // Open Wizard
    await page.getByRole("button", { name: "New Client" }).click();
    await expect(
      page.getByRole("heading", { name: "New Client" })
    ).toBeVisible();

    // Step 1: Client Type
    await page.getByText("Individual", { exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 2: Basic Info
    await page.getByLabel("First Name").fill("Test");
    await page.getByLabel("Last Name").fill(`Client-${Date.now()}`);
    await page.getByLabel("Date of Birth").fill("1990-01-01");
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 3: Contact
    await page
      .getByLabel("Email Address")
      .fill(`test-${Date.now()}@example.com`);
    await page.getByLabel("Phone Number").fill("592-600-0000");
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 4: Identification (Optional)
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 5: Employment (Optional - depends on type, Individual usually has it)
    // If employment step appears:
    if (
      await page
        .getByRole("heading", { name: "Employment & Income" })
        .isVisible()
    ) {
      await page.getByLabel("Employment Status").click();
      await page.getByLabel("Unemployed").click();
      await page.getByRole("button", { name: "Continue" }).click();
    }

    // Step 6: Services
    // Select GCMC business
    await page.getByRole("button", { name: "GCMC" }).click();
    // Select a service if available, or just continue if validation allows (it requires at least one service)
    // Assuming there are services rendered
    // Wait for services to load
    await page.waitForTimeout(1000);
    // Just click the first checkbox available
    const checkboxes = await page.locator('button[role="checkbox"]');
    if ((await checkboxes.count()) > 0) {
      await checkboxes.first().click();
    }
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 7: Documents (Optional)
    await page.getByRole("button", { name: "Continue" }).click();

    // Review & Submit
    await page.getByRole("button", { name: "Create Client" }).click();

    // Expect redirection to Client Detail
    await expect(page.getByText("Client created successfully")).toBeVisible();
    await expect(page).toHaveURL(CLIENT_DETAIL_URL_REGEX);

    // Check for Services Tab
    await expect(page.getByRole("tab", { name: "Services" })).toBeVisible();
  });
});
