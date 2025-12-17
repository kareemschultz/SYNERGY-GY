import { test } from "@playwright/test";

// Regex patterns at top level for performance
const SIGN_IN_REGEX = /sign in/i;

test("debug login and cookie setting", async ({ page }) => {
  // Log Set-Cookie headers from responses
  page.on("response", async (res) => {
    const setCookie = res.headers()["set-cookie"];
    if (setCookie) {
      console.log(`[SET-COOKIE] ${res.url()}`);
      console.log(`  ${setCookie.slice(0, 200)}`);
    }

    if (res.url().includes("/api/auth")) {
      const body = await res.text().catch(() => "");
      console.log(`[AUTH RESPONSE] ${res.status()} ${res.url()}`);
      console.log(`  Body: ${body.slice(0, 200)}`);
    }
  });

  // Step 1: Go to login
  console.log("\n=== Go to login page ===");
  await page.goto("http://45.32.169.215:8843/login");
  await page.waitForLoadState("networkidle");

  // Check cookies before login
  const cookiesBefore = await page.context().cookies();
  console.log(`\n[COOKIES BEFORE LOGIN] Count: ${cookiesBefore.length}`);
  for (const c of cookiesBefore) {
    console.log(`  ${c.name}: ${c.value.slice(0, 30)}...`);
  }

  // Step 2: Enter credentials and login
  console.log("\n=== Attempting login ===");
  await page.getByLabel("Email").fill("kareemschultz46@gmail.com");
  await page.getByLabel("Password").fill("TestPassword123!"); // Replace with actual password if needed

  // Click login
  await page.getByRole("button", { name: SIGN_IN_REGEX }).click();

  // Wait for response
  await page.waitForTimeout(3000);
  await page.waitForLoadState("networkidle");

  // Check cookies after login attempt
  const cookiesAfter = await page.context().cookies();
  console.log(`\n[COOKIES AFTER LOGIN] Count: ${cookiesAfter.length}`);
  for (const c of cookiesAfter) {
    console.log(
      `  ${c.name}: ${c.value.slice(0, 30)}... (domain: ${c.domain})`
    );
  }

  // Check URL
  console.log(`\n[FINAL URL] ${page.url()}`);

  // Screenshot
  await page.screenshot({ path: "debug-login-cookies.png", fullPage: true });
});
