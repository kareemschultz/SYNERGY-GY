import { test } from "@playwright/test";

test("test complete auth flow with env credentials", async ({ page }) => {
  // Credentials from .env
  const EMAIL = "kareemschultz46@gmail.com";
  const PASSWORD = "oxAiA5tUnAHYFJN2Qa8mQEoFVXDgZCg0";

  console.log("\n=== TEST: Complete Auth Flow ===\n");

  // Track Set-Cookie headers
  const setCookieHeaders: string[] = [];

  page.on("response", async (res) => {
    const setCookie = res.headers()["set-cookie"];
    if (setCookie) {
      setCookieHeaders.push(setCookie);
      console.log(`[SET-COOKIE] ${res.url()}`);
      console.log(`  Header: ${setCookie.slice(0, 150)}...`);
    }

    // Log auth responses
    if (res.url().includes("/api/auth")) {
      const status = res.status();
      const body = await res.text().catch(() => "");
      console.log(`[AUTH] ${status} ${res.url()}`);
      if (status !== 200) {
        console.log(`  Body: ${body.slice(0, 300)}`);
      }
    }
  });

  // Step 1: Navigate to login
  console.log("Step 1: Navigate to login page");
  await page.goto("https://gcmc.karetechsolutions.com/login");
  await page.waitForLoadState("networkidle");
  console.log(`  Current URL: ${page.url()}`);

  // Check initial cookies
  const initialCookies = await page.context().cookies();
  console.log(`  Initial cookies: ${initialCookies.length}`);

  // Step 2: Fill login form
  console.log("\nStep 2: Fill login form");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  console.log(`  Email: ${EMAIL}`);
  console.log("  Password: [filled]");

  // Step 3: Submit login
  console.log("\nStep 3: Submit login");
  const loginButton = page.getByRole("button", { name: /sign in/i });
  await loginButton.click();

  // Wait for navigation or response
  await page.waitForTimeout(3000);
  await page.waitForLoadState("networkidle");

  // Step 4: Check cookies after login
  console.log("\nStep 4: Check cookies after login");
  const postLoginCookies = await page.context().cookies();
  console.log(`  Cookies count: ${postLoginCookies.length}`);
  for (const cookie of postLoginCookies) {
    console.log(
      `  - ${cookie.name}: ${cookie.value.slice(0, 40)}... (domain: ${cookie.domain}, secure: ${cookie.secure}, httpOnly: ${cookie.httpOnly})`
    );
  }

  // Step 5: Check current page
  console.log("\nStep 5: Check current page");
  const currentUrl = page.url();
  console.log(`  URL: ${currentUrl}`);

  // Look for specific elements
  const hasAccessPending = await page
    .getByText("Access Pending")
    .isVisible()
    .catch(() => false);
  const hasOverview = await page
    .getByText("Overview")
    .isVisible()
    .catch(() => false);
  const hasSignOut = await page
    .getByText("Sign Out")
    .isVisible()
    .catch(() => false);
  const hasError = await page
    .getByText(/error|invalid|incorrect/i)
    .isVisible()
    .catch(() => false);

  console.log(`  Access Pending visible: ${hasAccessPending}`);
  console.log(`  Overview visible: ${hasOverview}`);
  console.log(`  Sign Out visible: ${hasSignOut}`);
  console.log(`  Error visible: ${hasError}`);

  // Step 6: Check Set-Cookie headers received
  console.log("\nStep 6: Set-Cookie headers summary");
  console.log(
    `  Total Set-Cookie headers received: ${setCookieHeaders.length}`
  );
  if (setCookieHeaders.length === 0) {
    console.log("  WARNING: No Set-Cookie headers received from server!");
  }

  // Step 7: Take screenshot
  await page.screenshot({ path: "test-auth-flow.png", fullPage: true });
  console.log("\nScreenshot saved: test-auth-flow.png");

  // Summary
  console.log("\n=== SUMMARY ===");
  if (postLoginCookies.length === 0 && setCookieHeaders.length === 0) {
    console.log("ISSUE: Server is not sending Set-Cookie headers");
    console.log("Possible causes:");
    console.log(
      "  1. Cookie attributes (SameSite, Secure, Domain) blocking storage"
    );
    console.log("  2. Proxy/Pangolin stripping Set-Cookie headers");
    console.log("  3. Auth endpoint not returning cookies");
  } else if (postLoginCookies.length === 0 && setCookieHeaders.length > 0) {
    console.log("ISSUE: Set-Cookie headers received but not stored in browser");
    console.log("Possible causes:");
    console.log("  1. Domain mismatch");
    console.log("  2. Secure flag on non-HTTPS");
    console.log("  3. SameSite attribute blocking");
  } else if (hasAccessPending) {
    console.log("ISSUE: Logged in but showing Access Pending");
    console.log(
      "Cookies ARE being stored - issue is in backend session/staff lookup"
    );
  } else if (hasOverview) {
    console.log("SUCCESS: Login working correctly!");
  }
});
