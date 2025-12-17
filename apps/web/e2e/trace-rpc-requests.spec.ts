import { test } from "@playwright/test";

// Regex patterns at top level for performance
const SIGN_IN_REGEX = /sign in/i;

test("trace frontend RPC requests", async ({ page }) => {
  const EMAIL = "kareemschultz46@gmail.com";
  const PASSWORD = "oxAiA5tUnAHYFJN2Qa8mQEoFVXDgZCg0";

  console.log("\n=== TRACE: Frontend RPC Requests ===\n");

  // Track ALL requests
  page.on("request", (req) => {
    const url = req.url();
    const headers = req.headers();
    if (url.includes("/rpc/")) {
      console.log(`\n[RPC REQ] ${req.method()} ${url}`);
      console.log(
        `  Cookie header: ${headers.cookie ? `${headers.cookie.slice(0, 80)}...` : "NONE"}`
      );
    }
  });

  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("/rpc/")) {
      const status = res.status();
      const body = await res.text().catch(() => "");
      console.log(`[RPC RES] ${status} ${url}`);
      const contentType = res.headers()["content-type"];
      console.log(`  Content-Type: ${contentType}`);
      if (contentType?.includes("application/json")) {
        console.log(`  Body: ${body.slice(0, 200)}`);
      } else {
        console.log(
          `  Body type: ${body.slice(0, 50).includes("<!DOCTYPE") ? "HTML (ERROR!)" : "other"}`
        );
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
  await page.waitForURL("**/app**", { timeout: 10_000 });
  console.log(`\n  Navigated to: ${page.url()}`);

  // Step 2: Check cookies before staff check
  const cookies = await page.context().cookies();
  console.log(`\n  Browser cookies: ${cookies.length}`);
  for (const c of cookies) {
    console.log(`    ${c.name}: ${c.domain} (secure=${c.secure})`);
  }

  // Step 3: Wait for frontend to make RPC calls
  console.log("\nStep 2: Waiting for RPC calls (15 seconds)...");
  await page.waitForTimeout(15_000);

  // Step 4: Screenshot
  await page.screenshot({ path: "trace-rpc.png", fullPage: true });
  console.log("\nScreenshot: trace-rpc.png");

  // Step 5: Final page state
  const hasAccessPending = await page
    .getByText("Access Pending")
    .isVisible()
    .catch(() => false);
  const hasOverview = await page
    .getByText("Overview")
    .isVisible()
    .catch(() => false);
  console.log(`\n  Access Pending visible: ${hasAccessPending}`);
  console.log(`  Overview visible: ${hasOverview}`);
});
