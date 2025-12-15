import { expect, test } from "@playwright/test";

test.describe("Matter Management", () => {
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

  test("should create a new matter and view details", async ({ page }) => {
    // Navigate to Matters
    await page.getByRole("link", { name: "Matters" }).click();

    // Create New Matter
    await page.getByRole("button", { name: "New Matter" }).click();

    // Fill Form
    // Select Client (assuming ClientSelector works with click/type)
    await page.getByPlaceholder("Search for a client...").click();
    // Wait for options and click first one
    await page.getByRole("option").first().click();

    // Select Business
    await page.getByRole("combobox", { name: "Select business" }).click();
    await page.getByRole("option", { name: "GCMC" }).click();

    // Select Service Type
    await page.getByRole("combobox", { name: "Select service type" }).click();
    await page.getByRole("option").first().click();

    // Title should auto-fill, but we can edit
    await expect(page.getByLabel("Title")).not.toBeEmpty();

    // Submit
    await page.getByRole("button", { name: "Create Matter" }).click();

    // Expect redirection to Detail
    await expect(page.getByText("Matter created successfully")).toBeVisible();
    await expect(page).toHaveURL(/\/app\/matters\//);

    // Check for Invoices Tab
    await expect(page.getByRole("tab", { name: "Invoices" })).toBeVisible();

    // Check Edit Button
    await expect(
      page.getByRole("button", { name: "Edit Matter" })
    ).toBeVisible();

    // Open Edit Dialog
    await page.getByRole("button", { name: "Edit Matter" }).click();
    await expect(
      page.getByRole("dialog", { name: "Edit Matter" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
  });
});
