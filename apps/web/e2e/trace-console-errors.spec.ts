import { test } from "@playwright/test";

// Regex patterns at top level for performance
const SIGN_IN_REGEX = /sign in/i;

test("trace console errors and RPC calls", async ({ page }) => {
  const EMAIL = "kareemschultz46@gmail.com";
  const PASSWORD = "oxAiA5tUnAHYFJN2Qa8mQEoFVXDgZCg0";

  console.log("\n=== TRACE: Console Errors and RPC Calls ===\n");

  // Track console messages
  page.on("console", (msg) => {
    const type = msg.type();
    if (type === "error" || type === "warning") {
      console.log(`[CONSOLE ${type.toUpperCase()}] ${msg.text()}`);
    }
  });

  // Track page errors
  page.on("pageerror", (error) => {
    console.log(`[PAGE ERROR] ${error.message}`);
  });

  // Track request failures
  page.on("requestfailed", (req) => {
    console.log(`[REQUEST FAILED] ${req.url()} - ${req.failure()?.errorText}`);
  });

  // Track ALL network requests
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("/rpc/") || url.includes("/api/")) {
      console.log(`[REQ] ${req.method()} ${url}`);
    }
  });

  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("/rpc/") || url.includes("/api/")) {
      const status = res.status();
      console.log(`[RES] ${status} ${url}`);
      if (url.includes("/rpc/")) {
        const body = await res.text().catch(() => "");
        const contentType = res.headers()["content-type"] || "";
        if (contentType.includes("json")) {
          console.log(`  JSON: ${body.slice(0, 300)}`);
        } else {
          console.log(
            `  Type: ${contentType} (HTML? ${body.includes("<!DOCTYPE")})`
          );
        }
      }
    }
  });

  // Step 1: Go to login and check for initial errors
  console.log("Step 1: Go to login page");
  await page.goto("https://gcmc.karetechsolutions.com/login");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  // Step 2: Login
  console.log("\nStep 2: Login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: SIGN_IN_REGEX }).click();

  // Wait for navigation
  await page.waitForURL("**/app**", { timeout: 10_000 });
  console.log(`  URL: ${page.url()}`);

  // Step 3: Check cookies
  const cookies = await page.context().cookies();
  console.log(`  Cookies: ${cookies.length}`);

  // Step 4: Wait for frontend to make requests
  console.log("\nStep 3: Waiting for frontend requests (15s)...");
  await page.waitForTimeout(15_000);

  // Step 5: Check if there's a visible loading state
  const bodyText = await page.textContent("body");
  const hasLoading = bodyText?.includes("Loading");
  const hasVerifying = bodyText?.includes("Verifying");
  const hasAccessPending = bodyText?.includes("Access Pending");

  console.log("\nPage state:");
  console.log(`  Loading: ${hasLoading}`);
  console.log(`  Verifying: ${hasVerifying}`);
  console.log(`  Access Pending: ${hasAccessPending}`);

  // Screenshot
  await page.screenshot({ path: "trace-console.png", fullPage: true });
  console.log("\nScreenshot: trace-console.png");
});
