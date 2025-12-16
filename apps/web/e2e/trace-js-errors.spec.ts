import { test } from "@playwright/test";

test("trace all JavaScript errors", async ({ page }) => {
  const EMAIL = "kareemschultz46@gmail.com";
  const PASSWORD = "oxAiA5tUnAHYFJN2Qa8mQEoFVXDgZCg0";

  console.log("\n=== TRACE JS ERRORS ===\n");

  const errors: string[] = [];
  const logs: string[] = [];

  // Capture ALL console messages including stack traces
  page.on("console", (msg) => {
    const text = msg.text();
    const type = msg.type();
    logs.push("[" + type + "] " + text);
    if (type === "error" || type === "warning") {
      console.log("[CONSOLE " + type.toUpperCase() + "] " + text);
    }
  });

  page.on("pageerror", (error) => {
    errors.push(error.message + "\n" + (error.stack || ""));
    console.log("[PAGE ERROR] " + error.message);
    console.log("[STACK] " + (error.stack?.slice(0, 500) || "no stack"));
  });

  // Track network failures
  page.on("requestfailed", (req) => {
    const failure = req.failure();
    console.log(
      "[REQUEST FAILED] " +
        req.url() +
        " - " +
        (failure?.errorText || "unknown")
    );
  });

  // Track RPC requests
  page.on("request", (req) => {
    if (req.url().includes("/rpc/")) {
      console.log("[RPC REQUEST] " + req.method() + " " + req.url());
    }
  });

  page.on("response", async (res) => {
    if (res.url().includes("/rpc/")) {
      const status = res.status();
      const body = await res.text().catch(() => "");
      console.log("[RPC RESPONSE] " + status + " " + res.url());
      console.log("  Body: " + body.slice(0, 150));
    }
  });

  // Login
  console.log("Step 1: Navigate to login");
  await page.goto("https://gcmc.karetechsolutions.com/login");
  await page.waitForLoadState("networkidle");

  console.log("Step 2: Fill credentials and submit");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait for navigation
  try {
    await page.waitForURL("**/app**", { timeout: 15_000 });
    console.log("Step 3: Navigated to " + page.url());
  } catch {
    console.log("Step 3: Still at " + page.url());
  }

  // Wait and watch
  console.log("Step 4: Waiting 10s for queries to execute...");
  await page.waitForTimeout(10_000);

  // Final state
  console.log("\nStep 5: Final state check");
  const bodyText = await page
    .evaluate(() => document.body.innerText.slice(0, 300))
    .catch(() => "error getting text");
  console.log("  Body: " + bodyText);

  console.log("\nTotal console logs: " + logs.length);
  console.log("Total page errors: " + errors.length);

  if (errors.length > 0) {
    console.log("\nAll page errors:");
    for (const e of errors) {
      console.log("---");
      console.log(e);
    }
  }

  // Check for specific query-related logs
  const queryLogs = logs.filter(
    (l) =>
      l.includes("query") ||
      l.includes("Query") ||
      l.includes("staff") ||
      l.includes("Staff") ||
      l.includes("error") ||
      l.includes("Error")
  );
  if (queryLogs.length > 0) {
    console.log("\nQuery/Error related logs:");
    for (const l of queryLogs.slice(0, 20)) {
      console.log("  " + l);
    }
  }

  await page.screenshot({ path: "trace-js-errors.png", fullPage: true });
});
