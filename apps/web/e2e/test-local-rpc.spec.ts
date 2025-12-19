import { test } from "@playwright/test";

// Regex patterns at top level for performance
const SIGN_IN_REGEX = /sign in/i;

test("test RPC via local server", async ({ page }) => {
  const EMAIL = "kareemschultz46@gmail.com";
  const PASSWORD = "oxAiA5tUnAHYFJN2Qa8mQEoFVXDgZCg0";
  // Use local IP to bypass any proxy issues
  const BASE_URL = "http://45.32.169.215:8843";

  console.log("\n=== TEST: Local RPC Calls ===\n");

  // Track network
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("/rpc/") || url.includes("/api/")) {
      console.log(`[REQ] ${req.method()} ${url}`);
    }
  });

  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("/rpc/")) {
      const status = res.status();
      const body = await res.text().catch(() => "");
      const isHtml = body.includes("<!DOCTYPE");
      console.log(`[RPC RES] ${status} ${url}`);
      console.log(`  IsHTML: ${isHtml}, Body: ${body.slice(0, 150)}`);
    }
  });

  page.on("console", (msg) => {
    const text = msg.text();
    if (
      msg.type() === "error" ||
      text.includes("Error") ||
      text.includes("RPC")
    ) {
      console.log(`[CONSOLE ${msg.type()}] ${text.slice(0, 200)}`);
    }
  });

  // Step 1: Login via local
  console.log("Step 1: Login");
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState("networkidle");

  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: SIGN_IN_REGEX }).click();

  // Wait for navigation
  await page.waitForURL("**/app**", { timeout: 15_000 }).catch(() => {
    console.log("  Navigation timeout - checking current URL");
  });
  console.log(`  URL: ${page.url()}`);

  // Step 2: Check cookies
  const cookies = await page.context().cookies();
  console.log(`\nStep 2: Cookies (${cookies.length})`);
  for (const c of cookies) {
    console.log(`  ${c.name}: ${c.domain}`);
  }

  // Step 3: Wait for RPC calls
  console.log("\nStep 3: Waiting for frontend RPC calls (10s)...");
  await page.waitForTimeout(10_000);

  // Step 4: Check page state
  const hasAccessPending = await page
    .getByText("Access Pending")
    .isVisible()
    .catch(() => false);
  const hasLoading = await page
    .getByText("Loading...")
    .isVisible()
    .catch(() => false);
  const hasOverview = await page
    .getByText("Overview")
    .isVisible()
    .catch(() => false);

  console.log("\nStep 4: Page state");
  console.log(`  Access Pending: ${hasAccessPending}`);
  console.log(`  Loading: ${hasLoading}`);
  console.log(`  Overview: ${hasOverview}`);

  // Step 5: Manual RPC test
  console.log("\nStep 5: Manual RPC call");
  const rpcResult = await page.evaluate(async () => {
    try {
      const res = await fetch("/rpc/settings/getStaffStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        credentials: "include",
      });
      const text = await res.text();
      return { status: res.status, body: text.slice(0, 300) };
    } catch (e) {
      return { error: String(e) };
    }
  });
  console.log(`  Manual RPC: ${JSON.stringify(rpcResult)}`);

  await page.screenshot({ path: "test-local.png", fullPage: true });
  console.log("\nScreenshot: test-local.png");
});
