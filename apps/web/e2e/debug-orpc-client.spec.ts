import { test } from "@playwright/test";

test("debug oRPC client internals", async ({ page }) => {
  const EMAIL = "kareemschultz46@gmail.com";
  const PASSWORD = "oxAiA5tUnAHYFJN2Qa8mQEoFVXDgZCg0";

  console.log("\n=== DEBUG: oRPC Client Internals ===\n");

  // Login first
  await page.goto("https://gcmc.karetechsolutions.com/login");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/app**", { timeout: 10_000 }).catch(() => {});
  console.log(`Logged in, URL: ${page.url()}`);

  await page.waitForTimeout(2000);

  // Test if we can access the client from the window
  const debug = await page.evaluate(async () => {
    const logs: string[] = [];

    // Try to find the client in the app's module scope
    // This is tricky because modules are isolated
    logs.push("Checking if oRPC client is accessible...");

    // The client is not on window, but we can test the fetch behavior
    // Simulate what the oRPC client should do

    // Test 1: Check what paths might be being constructed
    const paths = [
      "/rpc/settings/getStaffStatus",
      "/rpc/settings.getStaffStatus",
    ];

    for (const path of paths) {
      logs.push(`\nTesting path: ${path}`);
      try {
        const res = await fetch(path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
          credentials: "include",
        });
        logs.push(`  Status: ${res.status}`);
        const text = await res.text();
        logs.push(`  Body type: ${text.startsWith("{") ? "JSON" : "HTML"}`);
        if (text.startsWith("{")) {
          logs.push(`  Body: ${text.slice(0, 100)}`);
        }
      } catch (e) {
        logs.push(`  Error: ${e}`);
      }
    }

    // Test 2: Check if there are any pending promises
    logs.push("\n\nChecking document state...");
    logs.push(`ReadyState: ${document.readyState}`);
    logs.push(`Hidden: ${document.hidden}`);

    return { logs };
  });

  for (const log of debug.logs) {
    console.log(log);
  }

  // Check final page state
  const hasLoading = await page
    .getByText("Loading...")
    .isVisible()
    .catch(() => false);
  const hasAccessPending = await page
    .getByText("Access Pending")
    .isVisible()
    .catch(() => false);
  console.log(
    `\nFinal state: Loading=${hasLoading}, AccessPending=${hasAccessPending}`
  );
});
