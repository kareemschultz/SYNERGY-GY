import { test } from "@playwright/test";

// Regex patterns at top level for performance
const SIGN_IN_REGEX = /sign in/i;

test("verify oRPC fix - check console and network", async ({ page }) => {
  const EMAIL = "kareemschultz46@gmail.com";
  const PASSWORD = "oxAiA5tUnAHYFJN2Qa8mQEoFVXDgZCg0";

  console.log("\n=== VERIFY oRPC FIX ===\n");

  // Capture ALL console messages
  page.on("console", (msg) => {
    console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`);
  });

  page.on("pageerror", (error) => {
    console.log(`[PAGE ERROR] ${error.message}`);
  });

  // Track all network
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("/rpc/") || url.includes("getStaff")) {
      console.log(`[REQ] ${req.method()} ${url}`);
    }
  });

  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("/rpc/")) {
      const body = await res.text().catch(() => "");
      console.log(`[RPC RES] ${res.status()} ${url}`);
      console.log(`  Body: ${body.slice(0, 200)}`);
    }
  });

  // Step 1: Login
  console.log("Step 1: Login");
  await page.goto("https://gcmc.karetechsolutions.com/login");
  await page.waitForLoadState("networkidle");

  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: SIGN_IN_REGEX }).click();

  // Wait for navigation
  try {
    await page.waitForURL("**/app**", { timeout: 15_000 });
    console.log(`  Navigated to: ${page.url()}`);
  } catch {
    console.log(`  Still on: ${page.url()}`);
  }

  // Step 2: Wait longer for queries
  console.log("\nStep 2: Waiting 15s for TanStack Query to execute...");
  await page.waitForTimeout(15_000);

  // Step 3: Page state
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

  console.log("\nStep 3: Page state");
  console.log(`  Access Pending: ${hasAccessPending}`);
  console.log(`  Loading: ${hasLoading}`);
  console.log(`  Welcome: ${hasWelcome}`);

  // Step 4: Check React state
  console.log("\nStep 4: Check React Query state");
  const debugInfo = await page.evaluate(() => {
    // Try to find React Query state
    const body = document.body.innerText;
    return {
      bodyPreview: body.slice(0, 300),
      htmlHas: {
        loading: document.body.innerHTML.includes("Loading"),
        accessPending: document.body.innerHTML.includes("Access Pending"),
        welcome: document.body.innerHTML.includes("Welcome"),
      },
    };
  });
  console.log(`  Debug: ${JSON.stringify(debugInfo, null, 2)}`);

  await page.screenshot({ path: "verify-fix.png", fullPage: true });
});
