import { test } from "@playwright/test";

test("final HTTPS test with full diagnostics", async ({ page }) => {
  const EMAIL = "kareemschultz46@gmail.com";
  const PASSWORD = "oxAiA5tUnAHYFJN2Qa8mQEoFVXDgZCg0";

  console.log("\n=== FINAL HTTPS TEST ===\n");

  // Track all network
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("/rpc/") || url.includes("/api/")) {
      const headers = req.headers();
      console.log(`[REQ] ${req.method()} ${url}`);
      if (url.includes("/rpc/")) {
        console.log(
          `  Cookie: ${headers.cookie ? "present (" + headers.cookie.length + " chars)" : "NONE"}`
        );
      }
    }
  });

  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("/rpc/")) {
      const status = res.status();
      const body = await res.text().catch(() => "");
      const isJson = res.headers()["content-type"]?.includes("json");
      console.log(`[RPC RES] ${status} ${url}`);
      console.log(`  JSON: ${isJson}, Body: ${body.slice(0, 200)}`);
    }
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log(`[CONSOLE ERROR] ${msg.text().slice(0, 150)}`);
    }
  });

  // Step 1: Login
  console.log("Step 1: Login to HTTPS");
  await page.goto("https://gcmc.karetechsolutions.com/login");
  await page.waitForLoadState("networkidle");

  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait for navigation
  try {
    await page.waitForURL("**/app**", { timeout: 10_000 });
    console.log(`  Navigated to: ${page.url()}`);
  } catch {
    console.log(`  Still on: ${page.url()}`);
  }

  // Step 2: Cookies
  const cookies = await page.context().cookies();
  console.log(`\nStep 2: Cookies (${cookies.length})`);
  for (const c of cookies) {
    console.log(
      `  ${c.name}: domain=${c.domain}, secure=${c.secure}, httpOnly=${c.httpOnly}`
    );
  }

  // Step 3: Wait for frontend to make RPC calls
  console.log("\nStep 3: Waiting for RPC calls (10s)...");
  await page.waitForTimeout(10_000);

  // Step 4: Page state
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
  const hasWelcome = await page
    .getByText("Welcome back")
    .isVisible()
    .catch(() => false);

  console.log("\nStep 4: Page state");
  console.log(`  Access Pending: ${hasAccessPending}`);
  console.log(`  Loading: ${hasLoading}`);
  console.log(`  Overview: ${hasOverview}`);
  console.log(`  Welcome: ${hasWelcome}`);

  // Step 5: Manual RPC call
  console.log("\nStep 5: Manual RPC call with credentials");
  const result = await page.evaluate(async () => {
    try {
      const res = await fetch("/rpc/settings/getStaffStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        credentials: "include",
      });
      return { status: res.status, body: await res.text() };
    } catch (e) {
      return { error: String(e) };
    }
  });
  console.log(`  Result: ${JSON.stringify(result)}`);

  // Screenshot
  await page.screenshot({ path: "final-https.png", fullPage: true });
  console.log("\nScreenshot: final-https.png");
});
