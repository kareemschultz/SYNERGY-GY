import { test } from "@playwright/test";

// Regex patterns at top level for performance
const SIGN_IN_REGEX = /sign in/i;

test("fresh login with clean browser context", async ({ browser }) => {
  const EMAIL = "kareemschultz46@gmail.com";
  const PASSWORD = "oxAiA5tUnAHYFJN2Qa8mQEoFVXDgZCg0";

  console.log("\n=== TEST: Fresh Login (Clean Context) ===\n");

  // Create a fresh context with no storage
  const context = await browser.newContext({
    storageState: undefined,
  });
  const page = await context.newPage();

  // Clear storage
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Track console
  page.on("console", (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (
      type === "error" ||
      type === "warning" ||
      text.includes("RPC") ||
      text.includes("staff")
    ) {
      console.log(`[CONSOLE ${type}] ${text.slice(0, 200)}`);
    }
  });

  page.on("pageerror", (error) => {
    console.log(`[PAGE ERROR] ${error.message}`);
  });

  // Track network
  page.on("request", async (req) => {
    const url = req.url();
    if (url.includes("/rpc/") || url.includes("/api/")) {
      console.log(`[REQ] ${req.method()} ${url}`);
    }
  });

  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("/rpc/") || url.includes("/api/")) {
      const status = res.status();
      const body = await res.text().catch(() => "");
      const isJson = res.headers()["content-type"]?.includes("json");
      console.log(`[RES] ${status} ${url}`);
      if (isJson && url.includes("/rpc/")) {
        console.log(`  Body: ${body.slice(0, 300)}`);
      }
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
  await page.waitForURL("**/app**", { timeout: 15_000 }).catch(() => {
    console.log("  Navigation timed out");
  });
  console.log(`  URL: ${page.url()}`);

  // Step 2: Check cookies
  const cookies = await context.cookies();
  console.log(`\nStep 2: Cookies (${cookies.length})`);
  for (const c of cookies) {
    console.log(`  ${c.name}: ${c.value.slice(0, 30)}...`);
  }

  // Step 3: Wait and observe
  console.log("\nStep 3: Waiting for RPC calls (20s)...");
  await page.waitForTimeout(20_000);

  // Step 4: Page state
  console.log("\nStep 4: Page state");
  const hasLoading = await page
    .getByText("Loading...")
    .isVisible()
    .catch(() => false);
  const hasVerifying = await page
    .getByText("Verifying access...")
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

  console.log(`  Loading: ${hasLoading}`);
  console.log(`  Verifying: ${hasVerifying}`);
  console.log(`  Access Pending: ${hasAccessPending}`);
  console.log(`  Overview: ${hasOverview}`);

  // Step 5: Manually try to trigger RPC call
  console.log("\nStep 5: Manually triggering RPC call from browser...");
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
  console.log(`  Manual RPC result: ${JSON.stringify(rpcResult)}`);

  // Screenshot
  await page.screenshot({ path: "fresh-login.png", fullPage: true });
  console.log("\nScreenshot: fresh-login.png");

  await context.close();
});
