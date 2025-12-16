import { test } from "@playwright/test";

test("deep debug - check query behavior", async ({ page }) => {
  const EMAIL = "kareemschultz46@gmail.com";
  const PASSWORD = "oxAiA5tUnAHYFJN2Qa8mQEoFVXDgZCg0";

  console.log("\n=== DEEP DEBUG ===\n");

  // Capture ALL console messages
  page.on("console", (msg) => {
    console.log("[CONSOLE " + msg.type() + "] " + msg.text());
  });

  page.on("pageerror", (error) => {
    console.log("[PAGE ERROR] " + error.message);
    console.log("[PAGE ERROR STACK] " + error.stack?.slice(0, 500));
  });

  // Track ALL network requests
  page.on("request", (req) => {
    const url = req.url();
    if (
      url.includes("/rpc/") ||
      url.includes("getStaff") ||
      url.includes("settings")
    ) {
      console.log("[REQ] " + req.method() + " " + url);
    }
  });

  page.on("requestfailed", (req) => {
    console.log("[REQ FAILED] " + req.url() + " - " + req.failure()?.errorText);
  });

  // Login
  console.log("Step 1: Login");
  await page.goto("https://gcmc.karetechsolutions.com/login");
  await page.waitForLoadState("networkidle");

  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();

  try {
    await page.waitForURL("**/app**", { timeout: 15_000 });
    console.log("  Navigated to: " + page.url());
  } catch {
    console.log("  Still on: " + page.url());
  }

  // Inject debugging into the page
  console.log("\nStep 2: Injecting debug code...");
  await page.waitForTimeout(2000);

  const debugResult = await page.evaluate(async () => {
    const results: string[] = [];

    // Test direct fetch
    results.push("=== Testing direct fetch ===");
    try {
      const res = await fetch("/rpc/settings/getStaffStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        credentials: "include",
      });
      const text = await res.text();
      results.push("Direct fetch status: " + res.status);
      results.push("Direct fetch body: " + text.slice(0, 200));
    } catch (e) {
      results.push("Direct fetch error: " + String(e));
    }

    // Check for any uncaught errors in window
    results.push("=== Checking window errors ===");
    results.push("Window onerror defined: " + String(!!window.onerror));

    return results;
  });

  console.log("\nStep 3: Debug results:");
  for (const r of debugResult) {
    console.log("  " + r);
  }

  // Wait and check state
  console.log("\nStep 4: Waiting 5s more...");
  await page.waitForTimeout(5000);

  const state = await page.evaluate(() => ({
    body: document.body.innerText.slice(0, 200),
    hasLoading: document.body.innerHTML.includes("Loading..."),
    hasAccessPending: document.body.innerHTML.includes("Access Pending"),
    hasWelcome: document.body.innerHTML.includes("Welcome back"),
  }));
  console.log("  State: " + JSON.stringify(state, null, 2));

  await page.screenshot({ path: "debug-deep.png", fullPage: true });
});
