import { test } from "@playwright/test";

test("full debug - login and check staff status", async ({ page }) => {
  // Capture console logs
  page.on("console", (msg) => {
    console.log(`[CONSOLE ${msg.type()}]`, msg.text());
  });

  // Capture all network
  page.on("request", (req) => {
    const headers = req.headers();
    if (req.url().includes("/rpc/") || req.url().includes("/api/")) {
      console.log(`\n[REQUEST] ${req.method()} ${req.url()}`);
      if (headers.cookie) {
        console.log(`[COOKIE] ${headers.cookie.slice(0, 150)}`);
      } else {
        console.log("[COOKIE] NONE");
      }
    }
  });

  page.on("response", async (res) => {
    if (res.url().includes("/rpc/") || res.url().includes("/api/")) {
      const body = await res.text().catch(() => "");
      console.log(`[RESPONSE] ${res.status()} ${res.url()}`);
      console.log(`[BODY] ${body.slice(0, 300)}`);
    }
  });

  // Go to login
  console.log("\n=== STEP 1: Navigate to app ===");
  await page.goto("https://gcmc.karetechsolutions.com/app");
  await page.waitForLoadState("networkidle");

  console.log(`[URL] ${page.url()}`);

  // Check if we need to login
  if (page.url().includes("/login")) {
    console.log("\n=== STEP 2: Login required ===");

    // Get password from user - for now use test
    const email = "kareemschultz46@gmail.com";

    await page.getByLabel("Email").fill(email);

    // Wait for user to manually enter password or use stored session
    console.log("[INFO] Need to login - checking for stored session...");

    // Check browser cookies
    const cookies = await page.context().cookies();
    console.log(
      `[BROWSER COOKIES] ${JSON.stringify(cookies.map((c) => c.name))}`
    );
  } else {
    console.log("\n=== Already logged in ===");
  }

  // Check current state
  console.log("\n=== STEP 3: Check page content ===");
  const hasAccessPending = await page
    .getByText("Access Pending")
    .isVisible()
    .catch(() => false);
  const hasDashboard = await page
    .getByText("Overview")
    .isVisible()
    .catch(() => false);

  console.log(`[ACCESS PENDING] ${hasAccessPending}`);
  console.log(`[DASHBOARD] ${hasDashboard}`);

  // Get all cookies
  const allCookies = await page.context().cookies();
  console.log("\n=== ALL BROWSER COOKIES ===");
  for (const cookie of allCookies) {
    console.log(
      `${cookie.name}: ${cookie.value.slice(0, 50)}... (domain: ${cookie.domain})`
    );
  }

  // Screenshot
  await page.screenshot({ path: "debug-full.png", fullPage: true });
  console.log("\n[SCREENSHOT] Saved to debug-full.png");
});
