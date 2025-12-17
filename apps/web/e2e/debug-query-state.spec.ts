import { test } from "@playwright/test";

// Regex patterns at top level for performance
const SIGN_IN_REGEX = /sign in/i;

test("debug TanStack Query state", async ({ page }) => {
  const EMAIL = "kareemschultz46@gmail.com";
  const PASSWORD = "oxAiA5tUnAHYFJN2Qa8mQEoFVXDgZCg0";

  console.log("\n=== DEBUG: TanStack Query State ===\n");

  // Capture ALL console logs
  page.on("console", (msg) => {
    console.log(`[CONSOLE ${msg.type()}] ${msg.text().slice(0, 300)}`);
  });

  page.on("pageerror", (error) => {
    console.log(`[PAGE ERROR] ${error.message}`);
  });

  // Track network
  page.on("request", (req) => {
    if (req.url().includes("/rpc/") || req.url().includes("/api/")) {
      console.log(`[NET REQ] ${req.method()} ${req.url()}`);
    }
  });

  // Step 1: Login
  console.log("Step 1: Login");
  await page.goto("https://gcmc.karetechsolutions.com/login");
  await page.waitForLoadState("networkidle");

  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: SIGN_IN_REGEX }).click();

  await page.waitForURL("**/app**", { timeout: 10_000 }).catch(() => {});
  console.log(`  URL: ${page.url()}`);

  // Wait a bit for queries to potentially run
  await page.waitForTimeout(5000);

  // Step 2: Inject debug code to inspect React Query
  console.log("\nStep 2: Inspecting React Query state...");

  const queryState = await page.evaluate(() => {
    // Try to find QueryClient in React tree
    const app = document.getElementById("app");
    if (!app) {
      return { error: "No app element" };
    }

    // Try to access React internals
    const reactRoot = (app as any)._reactRootContainer?._internalRoot?.current;
    if (!reactRoot) {
      // Try React 18 pattern
      const reactFiber = Object.keys(app).find((key) =>
        key.startsWith("__reactFiber")
      );
      if (!reactFiber) {
        return { error: "No React fiber found" };
      }
    }

    // Try to find window globals
    const globals = {
      hasReactQueryDevtools:
        typeof (window as any).__REACT_QUERY_DEVTOOLS_EXTENSION__ !==
        "undefined",
      hasReactQueryGlobal:
        typeof (window as any).__REACT_QUERY_STATE__ !== "undefined",
    };

    // Try to find QueryClient via module scope (won't work but try)
    return {
      globals,
      documentReady: document.readyState,
      bodyContent: document.body.innerText.slice(0, 200),
    };
  });

  console.log(`  Query state: ${JSON.stringify(queryState, null, 2)}`);

  // Step 3: Try to manually trigger the RPC call via the browser's oRPC client
  console.log("\nStep 3: Try to access window.__orpc__ or similar...");

  const orpcState = await page.evaluate(async () => {
    // Check for any exposed globals
    const keys = Object.keys(window).filter(
      (k) =>
        k.toLowerCase().includes("rpc") ||
        k.toLowerCase().includes("query") ||
        k.toLowerCase().includes("tanstack")
    );

    return {
      windowKeys: keys,
      // Try direct fetch
      manualFetch: await fetch("/rpc/settings/getStaffStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        credentials: "include",
      })
        .then((r) => r.text())
        .catch((e) => String(e)),
    };
  });

  console.log(`  oRPC state: ${JSON.stringify(orpcState, null, 2)}`);

  // Step 4: Check page content
  console.log("\nStep 4: Page content");
  const pageText = await page.textContent("body");
  console.log(`  Body: ${pageText?.slice(0, 300)}`);

  await page.screenshot({ path: "debug-query.png", fullPage: true });
});
