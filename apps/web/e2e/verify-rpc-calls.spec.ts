import { test } from "@playwright/test";

test("verify RPC calls are being made", async ({ page }) => {
  const EMAIL = "kareemschultz46@gmail.com";
  const PASSWORD = "oxAiA5tUnAHYFJN2Qa8mQEoFVXDgZCg0";

  console.log("\n=== VERIFY RPC CALLS ===\n");

  let rpcCallsMade = 0;
  const rpcResponses: string[] = [];

  // Track ALL requests
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("/rpc/")) {
      rpcCallsMade++;
      console.log(
        "[RPC REQUEST " + rpcCallsMade + "] " + req.method() + " " + url
      );
    }
  });

  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("/rpc/")) {
      const body = await res.text().catch(() => "");
      const preview = body.slice(0, 150);
      rpcResponses.push(url + " -> " + res.status() + ": " + preview);
      console.log("[RPC RESPONSE] " + res.status() + " " + url);
      console.log("  Body: " + preview);
    }
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log("[CONSOLE ERROR] " + msg.text());
    }
  });

  page.on("pageerror", (error) => {
    console.log("[PAGE ERROR] " + error.message);
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

  // Wait for queries to execute
  console.log("\nStep 3: Waiting 10s for TanStack Query to execute...");
  await page.waitForTimeout(10_000);

  // Summary
  console.log("\n=== SUMMARY ===");
  console.log("Total RPC calls made: " + rpcCallsMade);
  if (rpcResponses.length > 0) {
    console.log("RPC responses:");
    for (const r of rpcResponses) {
      console.log("  " + r);
    }
  } else {
    console.log("NO RPC RESPONSES RECEIVED");
  }

  // Check page state
  const hasAccessPending = await page
    .getByText("Access Pending")
    .isVisible()
    .catch(() => false);
  const hasLoading = await page
    .getByText("Loading...")
    .isVisible()
    .catch(() => false);
  const hasWelcome = await page
    .getByText("Welcome back")
    .isVisible()
    .catch(() => false);

  console.log("\nPage state:");
  console.log("  Access Pending: " + hasAccessPending);
  console.log("  Loading: " + hasLoading);
  console.log("  Welcome: " + hasWelcome);

  await page.screenshot({ path: "verify-rpc-calls.png", fullPage: true });
});
