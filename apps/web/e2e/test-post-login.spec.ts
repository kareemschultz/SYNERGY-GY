import { test } from "@playwright/test";

// Regex patterns at top level for performance
const SIGN_IN_REGEX = /sign in/i;

test("test post-login data loading", async ({ page }) => {
  const EMAIL = "kareemschultz46@gmail.com";
  const PASSWORD = "oxAiA5tUnAHYFJN2Qa8mQEoFVXDgZCg0";

  console.log("\n=== TEST: Post-Login Data Loading ===\n");

  // Track all RPC requests
  page.on("request", (req) => {
    if (req.url().includes("/rpc/")) {
      const headers = req.headers();
      console.log(`\n[RPC REQUEST] ${req.method()} ${req.url()}`);
      console.log(`  Cookie: ${headers.cookie ? "present" : "MISSING"}`);
    }
  });

  page.on("response", async (res) => {
    if (res.url().includes("/rpc/")) {
      const status = res.status();
      const body = await res.text().catch(() => "");
      console.log(`[RPC RESPONSE] ${status} ${res.url()}`);
      console.log(`  Body: ${body.slice(0, 500)}`);
    }
  });

  // Step 1: Login
  console.log("Step 1: Navigate and login");
  await page.goto("https://gcmc.karetechsolutions.com/login");
  await page.waitForLoadState("networkidle");

  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: SIGN_IN_REGEX }).click();

  // Wait for navigation
  await page.waitForURL("**/app**", { timeout: 10_000 });
  console.log(`  URL after login: ${page.url()}`);

  // Step 2: Wait for page to fully load
  console.log("\nStep 2: Waiting for page to load (10 seconds)...");
  await page.waitForTimeout(10_000);
  await page.waitForLoadState("networkidle");

  // Step 3: Check cookies
  console.log("\nStep 3: Check cookies");
  const cookies = await page.context().cookies();
  for (const cookie of cookies) {
    console.log(`  - ${cookie.name}: ${cookie.value.slice(0, 40)}...`);
  }

  // Step 4: Check page state
  console.log("\nStep 4: Check page state");
  const pageContent = await page.textContent("body");
  console.log(`  Page text (first 300 chars): ${pageContent?.slice(0, 300)}`);

  // Check for specific elements
  const hasLoading = await page
    .getByText("Loading...")
    .isVisible()
    .catch(() => false);
  const hasAccessPending = await page
    .getByText("Access Pending")
    .isVisible()
    .catch(() => false);
  const hasOverview = await page
    .getByText("Overview")
    .isVisible()
    .catch(() => false);
  const hasSidebar = await page
    .locator("nav")
    .isVisible()
    .catch(() => false);

  console.log(`  Loading visible: ${hasLoading}`);
  console.log(`  Access Pending visible: ${hasAccessPending}`);
  console.log(`  Overview visible: ${hasOverview}`);
  console.log(`  Sidebar visible: ${hasSidebar}`);

  // Take screenshot
  await page.screenshot({ path: "test-post-login.png", fullPage: true });
  console.log("\nScreenshot saved: test-post-login.png");

  // Step 5: Try to manually make an RPC call to check staff
  console.log("\nStep 5: Manually check staff.me endpoint");
  const response = await page.evaluate(async () => {
    try {
      const res = await fetch("/rpc/staff/me", {
        method: "GET",
        credentials: "include",
      });
      const text = await res.text();
      return { status: res.status, body: text.slice(0, 500) };
    } catch (e) {
      return { error: String(e) };
    }
  });
  console.log(`  staff.me response: ${JSON.stringify(response)}`);
});
