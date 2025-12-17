import { test } from "@playwright/test";

// Regex patterns at top level for performance
const SIGN_IN_REGEX = /sign in/i;

test("trace URL construction error", async ({ page }) => {
  const EMAIL = "kareemschultz46@gmail.com";
  const PASSWORD = "oxAiA5tUnAHYFJN2Qa8mQEoFVXDgZCg0";

  console.log("\n=== TRACE URL ERROR ===\n");

  // Capture ALL console messages including errors with full details
  page.on("console", (msg) => {
    const type = msg.type();
    const text = msg.text();
    // Log everything for debugging
    console.log(`[CONSOLE ${type}] ${text}`);

    // Get location for errors
    if (type === "error") {
      const location = msg.location();
      console.log(
        `  Location: ${location.url}:${location.lineNumber}:${location.columnNumber}`
      );
    }
  });

  page.on("pageerror", (error) => {
    console.log(`[PAGE ERROR] ${error.message}`);
    console.log(`[STACK] ${error.stack || "no stack"}`);
  });

  // Login
  console.log("Step 1: Login");
  await page.goto("https://gcmc.karetechsolutions.com/login");
  await page.waitForLoadState("networkidle");

  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: SIGN_IN_REGEX }).click();

  try {
    await page.waitForURL("**/app**", { timeout: 15_000 });
    console.log(`Step 2: Navigated to ${page.url()}`);
  } catch {
    console.log(`Step 2: Still at ${page.url()}`);
  }

  // Step 3: Inject code to test URL construction
  console.log("\nStep 3: Testing URL construction in browser");
  const urlTest = await page.evaluate(() => {
    const results: string[] = [];

    // Test various URL constructions
    const tests = [
      { url: "/rpc", base: window.location.origin },
      { url: "/rpc/settings/getStaffStatus", base: window.location.origin },
      { url: "settings.getStaffStatus", base: "/rpc" },
      { url: "/rpc/settings.getStaffStatus", base: window.location.origin },
      { url: undefined as any, base: window.location.origin },
      { url: "", base: window.location.origin },
    ];

    for (const t of tests) {
      try {
        const u = new URL(t.url, t.base);
        results.push(`OK: URL(${t.url}, ${t.base}) = ${u.toString()}`);
      } catch (e) {
        results.push(`ERROR: URL(${t.url}, ${t.base}) - ${String(e)}`);
      }
    }

    return results;
  });

  for (const r of urlTest) {
    console.log(`  ${r}`);
  }

  // Step 4: Check what oRPC is trying to do
  console.log("\nStep 4: Testing queryOptions output");
  const queryOptionsTest = await page.evaluate(async () => {
    // Try to simulate what queryOptions does
    // This tests if the procedure path is correctly formed
    const paths = [
      "settings.getStaffStatus",
      "/rpc/settings.getStaffStatus",
      "/rpc/settings/getStaffStatus",
    ];

    const results: string[] = [];
    for (const path of paths) {
      try {
        // Test the path transformation
        const base = "/rpc";
        const fullPath = `${base}/${path}`;
        if (fullPath.includes(".")) {
          const transformed = fullPath.replace(/\./g, "/");
          results.push(`Path: ${path} -> ${transformed}`);
        } else {
          results.push(`Path: ${path} (no dots)`);
        }
      } catch (e) {
        results.push(`Error processing ${path}: ${String(e)}`);
      }
    }
    return results;
  });

  for (const r of queryOptionsTest) {
    console.log(`  ${r}`);
  }

  // Wait to see if any errors appear
  console.log("\nStep 5: Waiting 5s for any delayed errors...");
  await page.waitForTimeout(5000);

  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("\nFinal body text:");
  console.log(bodyText.slice(0, 500));

  await page.screenshot({ path: "trace-url-error.png", fullPage: true });
});
