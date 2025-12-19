import { test } from "@playwright/test";

// Regex patterns at top level for performance
const SIGN_IN_REGEX = /sign in/i;

test("test oRPC client directly in browser", async ({ page }) => {
  const EMAIL = "kareemschultz46@gmail.com";
  const PASSWORD = "oxAiA5tUnAHYFJN2Qa8mQEoFVXDgZCg0";

  console.log("\n=== TEST: oRPC Client Direct ===\n");

  // Capture all console logs
  page.on("console", (msg) => {
    console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`);
  });

  page.on("pageerror", (error) => {
    console.log(`[PAGE ERROR] ${error.message}`);
  });

  // Step 1: Login first
  console.log("Step 1: Login");
  await page.goto("https://gcmc.karetechsolutions.com/login");
  await page.waitForLoadState("networkidle");

  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: SIGN_IN_REGEX }).click();

  await page.waitForURL("**/app**", { timeout: 10_000 }).catch(() => {
    /* ignore timeout */
  });
  console.log(`  URL: ${page.url()}`);

  // Wait for app to initialize
  await page.waitForTimeout(3000);

  // Step 2: Test oRPC client
  console.log("\nStep 2: Test oRPC client functionality");

  const result = await page.evaluate(async () => {
    // Try to import the oRPC module dynamically
    const logs: string[] = [];

    logs.push("Starting oRPC test...");

    // Manually recreate what the oRPC client does
    const baseUrl = "/rpc";
    const procedurePath = "settings.getStaffStatus";
    const url = `${baseUrl}/${procedurePath}`;

    logs.push(`Constructed URL: ${url}`);

    // Test the URL normalization logic
    try {
      const urlObj = new URL(url, window.location.origin);
      logs.push(`Before normalization: ${urlObj.pathname}`);

      if (
        urlObj.pathname.startsWith("/rpc/") &&
        urlObj.pathname.includes(".")
      ) {
        urlObj.pathname = urlObj.pathname.replace(/\./g, "/");
        logs.push(`After normalization: ${urlObj.pathname}`);
      }

      logs.push(`Full URL: ${urlObj.toString()}`);

      // Make the fetch request
      const response = await fetch(urlObj.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        credentials: "include",
      });

      logs.push(`Response status: ${response.status}`);

      const text = await response.text();
      logs.push(`Response body: ${text.slice(0, 200)}`);

      return {
        success: true,
        logs,
        status: response.status,
        body: text,
      };
    } catch (error) {
      logs.push(`Error: ${error}`);
      return {
        success: false,
        logs,
        error: String(error),
      };
    }
  });

  console.log("\nResult:");
  for (const log of result.logs || []) {
    console.log(`  ${log}`);
  }

  // Step 3: Check what URL format oRPC uses
  console.log("\nStep 3: Check cookies");
  const cookies = await page.context().cookies();
  console.log(`  Cookies: ${cookies.length}`);
  for (const c of cookies) {
    console.log(`    ${c.name}: domain=${c.domain}`);
  }

  // Step 4: Check page state
  console.log("\nStep 4: Page state after test");
  const hasAccessPending = await page
    .getByText("Access Pending")
    .isVisible()
    .catch(() => false);
  const hasLoading = await page
    .getByText("Loading...")
    .isVisible()
    .catch(() => false);
  console.log(`  Access Pending: ${hasAccessPending}`);
  console.log(`  Loading: ${hasLoading}`);

  await page.screenshot({ path: "test-orpc-direct.png", fullPage: true });
});
