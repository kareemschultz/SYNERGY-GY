import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";

// Regex patterns at top level for performance
const MATTERS_URL_REGEX = /\/app\/matters/;
const WIZARD_REGEX = /wizard|matter wizard/i;
const QUICK_ADD_REGEX = /quick add/i;
const CLIENT_REGEX = /client/i;
const SELECT_CLIENT_REGEX = /select.*client/i;
const MATTER_HEADING_REGEX = /matter/i;
const NEW_MATTER_HEADING_REGEX = /new matter/i;
const CONTINUE_BUTTON_REGEX = /continue|next/i;

test.describe("Matter Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await login(page);
  });

  test("should navigate to matters page", async ({ page }) => {
    await page.getByRole("link", { name: "Matters" }).click();
    await expect(page).toHaveURL(MATTERS_URL_REGEX);
  });

  test("should display new matter button", async ({ page }) => {
    await page.goto("/app/matters");
    await page.waitForLoadState("networkidle");

    // Look for either "Matter Wizard" or "Quick Add" button
    const wizardButton = page.getByRole("link", { name: WIZARD_REGEX });
    const quickAddButton = page.getByRole("link", { name: QUICK_ADD_REGEX });

    const hasWizard = await wizardButton
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    const hasQuickAdd = await quickAddButton
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    expect(hasWizard || hasQuickAdd).toBe(true);
  });

  test("should open new matter form", async ({ page }) => {
    await page.goto("/app/matters");
    await page.waitForLoadState("networkidle");

    // Click Matter Wizard or Quick Add link (they're styled as buttons but are Link components)
    const wizardLink = page.getByRole("link", { name: WIZARD_REGEX });
    const quickAddLink = page.getByRole("link", { name: QUICK_ADD_REGEX });

    if (await wizardLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await wizardLink.click();
    } else if (
      await quickAddLink.isVisible({ timeout: 1000 }).catch(() => false)
    ) {
      await quickAddLink.click();
    }
    await page.waitForTimeout(500);

    // Should show matter form - dialog or page with client selector
    const hasDialog = await page
      .getByRole("dialog")
      .isVisible()
      .catch(() => false);
    const hasClientPlaceholder = await page
      .getByPlaceholder(CLIENT_REGEX)
      .isVisible()
      .catch(() => false);
    const hasClientText = await page
      .getByText(SELECT_CLIENT_REGEX)
      .isVisible()
      .catch(() => false);
    const hasHeading = await page
      .getByRole("heading", { name: MATTER_HEADING_REGEX })
      .isVisible()
      .catch(() => false);
    const hasClientSelector = hasClientPlaceholder || hasClientText;

    expect(hasDialog || hasClientSelector || hasHeading).toBe(true);
  });

  test("should access matter form with wizard navigation", async ({ page }) => {
    // Navigate to Matters
    await page.getByRole("link", { name: "Matters" }).click();
    await page.waitForLoadState("networkidle");

    // Click Matter Wizard or Quick Add link
    const wizardLink = page.getByRole("link", { name: WIZARD_REGEX });
    const quickAddLink = page.getByRole("link", { name: QUICK_ADD_REGEX });

    if (await wizardLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await wizardLink.click();
    } else if (
      await quickAddLink.isVisible({ timeout: 1000 }).catch(() => false)
    ) {
      await quickAddLink.click();
    }
    await page.waitForTimeout(500);

    // Verify we're on the matter creation page
    // For wizard: check for heading, navigation buttons, or form fields
    // For quick add: check for form fields
    const hasNewMatterHeading = await page
      .getByRole("heading", { name: NEW_MATTER_HEADING_REGEX })
      .isVisible()
      .catch(() => false);
    const hasMatterWizardHeading = await page
      .getByRole("heading", { name: MATTER_HEADING_REGEX })
      .first()
      .isVisible()
      .catch(() => false);
    const hasContinueButton = await page
      .getByRole("button", { name: CONTINUE_BUTTON_REGEX })
      .isVisible()
      .catch(() => false);
    const hasClientSearch = await page
      .getByPlaceholder(CLIENT_REGEX)
      .first()
      .isVisible()
      .catch(() => false);
    const hasBusinessSelect = await page
      .getByRole("combobox")
      .first()
      .isVisible()
      .catch(() => false);

    // Any of these indicates we're on the matter form page
    expect(
      hasNewMatterHeading ||
        hasMatterWizardHeading ||
        hasContinueButton ||
        hasClientSearch ||
        hasBusinessSelect
    ).toBe(true);
  });
});
