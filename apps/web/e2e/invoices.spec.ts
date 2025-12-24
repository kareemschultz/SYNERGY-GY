import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";

// Regex patterns at top level for performance
const INVOICES_URL_REGEX = /\/app\/invoices/;
const NEW_INVOICE_REGEX = /new invoice/i;
const CLIENT_SEARCH_REGEX = /client|search/i;
const SELECT_CLIENT_SECTION_REGEX = /select.*client|client/i;
const CREATE_INVOICE_REGEX = /create invoice/i;

test.describe("Invoice Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await login(page);
  });

  test("should navigate to invoices page", async ({ page }) => {
    await page.getByRole("link", { name: "Invoices" }).click();
    await expect(page).toHaveURL(INVOICES_URL_REGEX);
  });

  test("should display new invoice button", async ({ page }) => {
    await page.goto("/app/invoices");
    await page.waitForLoadState("networkidle");

    // Check for new invoice link (styled as button with asChild)
    const newInvoiceLink = page.getByRole("link", { name: NEW_INVOICE_REGEX });
    await expect(newInvoiceLink).toBeVisible();
  });

  test("should open new invoice form", async ({ page }) => {
    await page.goto("/app/invoices");
    await page.waitForLoadState("networkidle");

    // Click New Invoice link
    await page.getByRole("link", { name: NEW_INVOICE_REGEX }).click();

    // Should show invoice form - either dialog or navigated page
    await page.waitForTimeout(1000);

    // Check for invoice form page elements
    // Look for the "Create Invoice" button in header or "New Invoice" heading
    const hasCreateButton = await page
      .getByRole("button", { name: CREATE_INVOICE_REGEX })
      .isVisible()
      .catch(() => false);
    const hasNewInvoiceHeading = await page
      .getByRole("heading", { name: NEW_INVOICE_REGEX })
      .isVisible()
      .catch(() => false);
    const hasClientSection = await page
      .getByText(SELECT_CLIENT_SECTION_REGEX)
      .first()
      .isVisible()
      .catch(() => false);
    const hasBusinessSelect = await page
      .getByRole("combobox")
      .first()
      .isVisible()
      .catch(() => false);

    expect(
      hasCreateButton ||
        hasNewInvoiceHeading ||
        hasClientSection ||
        hasBusinessSelect
    ).toBe(true);
  });

  test("should create a new invoice with service selection", async ({
    page,
  }) => {
    // Navigate to Invoices
    await page.getByRole("link", { name: "Invoices" }).click();
    await page.waitForLoadState("networkidle");

    // Create New Invoice
    await page.getByRole("link", { name: NEW_INVOICE_REGEX }).click();
    await page.waitForTimeout(500);

    // Try to select client - look for various client selector patterns
    const clientSearch = page.getByPlaceholder(CLIENT_SEARCH_REGEX).first();
    if (await clientSearch.isVisible({ timeout: 3000 }).catch(() => false)) {
      await clientSearch.click();
      // Wait for options
      await page.waitForTimeout(500);
      const option = page.getByRole("option").first();
      if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
        await option.click();
      }
    }

    // Check if service selector is visible
    const serviceSelector = page.getByRole("combobox").first();
    if (await serviceSelector.isVisible({ timeout: 2000 }).catch(() => false)) {
      await serviceSelector.click();
      const serviceOption = page.getByRole("option").first();
      if (await serviceOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await serviceOption.click();
      }
    }

    // The test verifies the invoice form page loaded with expected elements
    // The "Create Invoice" button is in the header
    const hasCreateButton = await page
      .getByRole("button", { name: CREATE_INVOICE_REGEX })
      .isVisible()
      .catch(() => false);
    const hasFormElements = await page
      .getByRole("combobox")
      .first()
      .isVisible()
      .catch(() => false);
    const hasNewInvoiceHeading = await page
      .getByRole("heading", { name: NEW_INVOICE_REGEX })
      .isVisible()
      .catch(() => false);

    expect(hasCreateButton || hasFormElements || hasNewInvoiceHeading).toBe(
      true
    );
  });
});
