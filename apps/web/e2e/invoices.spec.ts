import { expect, test } from "@playwright/test";

test.describe("Invoice Management", () => {
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

  test("should create a new invoice with service selection", async ({
    page,
  }) => {
    // Navigate to Invoices
    await page.getByRole("link", { name: "Invoices" }).click();

    // Create New Invoice
    await page.getByRole("button", { name: "New Invoice" }).click();

    // Select Client
    await page.getByPlaceholder("Search for a client...").click();
    await page.getByRole("option").first().click();

    // Select Business (if not auto-selected)
    // await page.getByRole("combobox", { name: "Select business" }).click();
    // await page.getByRole("option", { name: "GCMC" }).click();

    // Check Service Selector in Line Items
    // It's a SelectTrigger with placeholder "Select service..."
    await expect(
      page.getByRole("combobox", { name: "Select service..." })
    ).toBeVisible();

    // Select a service
    await page.getByRole("combobox", { name: "Select service..." }).click();
    await page.getByRole("option").first().click();

    // Expect Description and Price to populate
    // Note: This depends on the service having data.

    // Save Invoice
    await page.getByRole("button", { name: "Create Invoice" }).click();

    // Expect redirection to Detail
    await expect(page.getByText("Invoice created successfully")).toBeVisible();
    await expect(page).toHaveURL(/\/app\/invoices\//);
  });
});
