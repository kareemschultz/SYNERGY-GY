import { test } from "@playwright/test";

test("debug QueryClient state", async ({ page }) => {
  const EMAIL = "kareemschultz46@gmail.com";
  const PASSWORD = "oxAiA5tUnAHYFJN2Qa8mQEoFVXDgZCg0";

  console.log("\n=== DEBUG QUERY CLIENT ===\n");

  // Track RPC calls
  let rpcCallsMade = 0;
  page.on("request", (req) => {
    if (req.url().includes("/rpc/")) {
      rpcCallsMade++;
      console.log("[RPC] " + req.method() + " " + req.url());
    }
  });

  page.on("console", (msg) => {
    console.log("[CONSOLE " + msg.type() + "] " + msg.text().slice(0, 200));
  });

  page.on("pageerror", (error) => {
    console.log("[PAGE ERROR] " + error.message);
    console.log("[STACK] " + (error.stack?.slice(0, 300) || ""));
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
    console.log("Step 2: Navigated to " + page.url());
  } catch {
    console.log("Step 2: Still at " + page.url());
  }

  // Wait briefly
  await page.waitForTimeout(3000);

  // Step 3: Test if the client itself works by making a manual call
  console.log("\nStep 3: Testing oRPC client directly...");
  const clientTest = await page.evaluate(async () => {
    const results: string[] = [];

    // Try direct fetch first
    try {
      const res = await fetch("/rpc/settings/getStaffStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        credentials: "include",
      });
      const text = await res.text();
      results.push("Direct fetch: " + res.status + " - " + text.slice(0, 100));
    } catch (e) {
      results.push("Direct fetch error: " + String(e));
    }

    // Try with full URL
    try {
      const fullUrl = window.location.origin + "/rpc/settings/getStaffStatus";
      results.push("Full URL would be: " + fullUrl);
      const res2 = await fetch(fullUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        credentials: "include",
      });
      const text2 = await res2.text();
      results.push(
        "Full URL fetch: " + res2.status + " - " + text2.slice(0, 100)
      );
    } catch (e) {
      results.push("Full URL fetch error: " + String(e));
    }

    return results;
  });

  for (const r of clientTest) {
    console.log("  " + r);
  }

  // Step 4: Check for any React Query devtools or state
  console.log("\nStep 4: Wait and check final state...");
  await page.waitForTimeout(5000);

  console.log("\nRPC calls made during test: " + rpcCallsMade);

  const state = await page.evaluate(() => ({
    body: document.body.innerText.slice(0, 300),
    hasAccessPending: document.body.innerHTML.includes("Access Pending"),
    hasWelcome: document.body.innerHTML.includes("Welcome back"),
    hasLoading: document.body.innerHTML.includes("Loading..."),
  }));
  console.log("Final state: " + JSON.stringify(state, null, 2));

  await page.screenshot({ path: "debug-query-client.png", fullPage: true });
});
