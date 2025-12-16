import { expect, test } from "@playwright/test";

/**
 * Debug script to diagnose Access Pending issue
 * Captures network requests and API responses
 */

test.describe("Debug Access Pending", () => {
  test("capture staff status API response", async ({ page }) => {
    // Intercept all RPC requests
    const apiResponses: Array<{ url: string; status: number; body: unknown }> =
      [];

    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("/rpc/") || url.includes("/api/auth")) {
        try {
          const body = await response.json().catch(() => response.text());
          apiResponses.push({
            url,
            status: response.status(),
            body,
          });
          console.log(`[API] ${response.status()} ${url}`);
          console.log("[BODY]", JSON.stringify(body, null, 2));
        } catch {
          console.log(`[API] ${response.status()} ${url} (no body)`);
        }
      }
    });

    // Navigate to login
    await page.goto("/login");

    // Check if already logged in (redirect to /app)
    const currentUrl = page.url();
    console.log(`[NAV] Current URL: ${currentUrl}`);

    if (currentUrl.includes("/login")) {
      // Need to login - use the actual credentials
      console.log("[AUTH] Attempting login...");
      await page.getByLabel("Email").fill("kareemschultz46@gmail.com");
      await page.getByLabel("Password").fill("TestPassword123!");
      await page.getByRole("button", { name: "Sign in" }).click();

      // Wait for navigation
      await page.waitForLoadState("networkidle");
    }

    // Wait for staff status check
    await page.waitForTimeout(3000);

    // Check what we see
    const accessPending = await page.getByText("Access Pending").isVisible();
    const dashboard = await page
      .getByText("Overview of your business operations")
      .isVisible();

    console.log(`[RESULT] Access Pending visible: ${accessPending}`);
    console.log(`[RESULT] Dashboard visible: ${dashboard}`);
    console.log("[API RESPONSES]", JSON.stringify(apiResponses, null, 2));

    // Take a screenshot
    await page.screenshot({ path: "debug-access-pending.png", fullPage: true });

    // Assertions
    expect(accessPending).toBe(false);
    expect(dashboard).toBe(true);
  });
});
