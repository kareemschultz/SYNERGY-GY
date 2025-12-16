import { test } from "@playwright/test";

test("test oRPC client directly", async ({ page }) => {
  const EMAIL = "kareemschultz46@gmail.com";
  const PASSWORD = "oxAiA5tUnAHYFJN2Qa8mQEoFVXDgZCg0";

  console.log("\n=== TEST oRPC CLIENT DIRECTLY ===\n");

  page.on("request", (req) => {
    if (req.url().includes("/rpc/")) {
      console.log("[REQ] " + req.method() + " " + req.url());
    }
  });

  page.on("response", async (res) => {
    if (res.url().includes("/rpc/")) {
      const body = await res.text().catch(() => "");
      console.log("[RES] " + res.status() + " " + res.url());
      console.log("  Body: " + body.slice(0, 150));
    }
  });

  page.on("console", (msg) => {
    console.log("[CONSOLE " + msg.type() + "] " + msg.text());
  });

  page.on("pageerror", (error) => {
    console.log("[PAGE ERROR] " + error.message);
    console.log("  Stack: " + (error.stack?.slice(0, 400) || ""));
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
    console.log("\nStep 2: Navigated to " + page.url());
  } catch {
    console.log("\nStep 2: Still at " + page.url());
  }

  await page.waitForTimeout(2000);

  // Step 3: Try to access the oRPC client module
  console.log(
    "\nStep 3: Try to call client.settings.getStaffStatus() directly"
  );

  // We can't directly access the module, but we can add a script that tests it
  // Add a debug script to the page
  await page.addScriptTag({
    content: `
      window.testOrpcClient = async () => {
        const logs = [];
        try {
          // Try to create a simple fetch-based test
          // This simulates what the oRPC client should do
          const url = window.location.origin + '/rpc/settings.getStaffStatus';
          logs.push('Testing URL: ' + url);

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
            credentials: 'include'
          });

          logs.push('Response status: ' + res.status);
          const text = await res.text();
          logs.push('Response: ' + text.slice(0, 150));
        } catch (e) {
          logs.push('Error: ' + e.message);
        }
        return logs;
      };
    `,
  });

  const testResult = await page.evaluate(
    async () => await (window as any).testOrpcClient()
  );

  console.log("Client test results:");
  for (const log of testResult || []) {
    console.log("  " + log);
  }

  // Step 4: Check what URL the oRPC link would generate
  console.log("\nStep 4: Check URL construction");
  const urlTest = await page.evaluate(() => {
    const origin = window.location.origin;
    const base = origin + "/rpc";
    const path = "settings.getStaffStatus";

    // Test URL construction like oRPC does
    const constructed = base + "/" + path;

    return {
      origin,
      base,
      path,
      constructed,
      normalized: constructed.replace(/\./g, "/"),
    };
  });
  console.log("  URL construction: " + JSON.stringify(urlTest, null, 2));

  // Step 5: Check final state
  await page.waitForTimeout(3000);
  const state = await page.evaluate(() =>
    document.body.innerText.slice(0, 200)
  );
  console.log("\nFinal state: " + state);

  await page.screenshot({ path: "test-orpc-client.png", fullPage: true });
});
