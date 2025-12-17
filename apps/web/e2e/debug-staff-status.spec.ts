import { test } from "@playwright/test";

// Regex patterns at top level for performance
const SIGN_IN_REGEX = /sign in/i;

test("debug staff status API", async ({ page }) => {
  // Capture all network requests
  const requests: Array<{ url: string; method: string }> = [];
  const responses: Array<{ url: string; status: number; body: string }> = [];

  page.on("request", (req) => {
    if (req.url().includes("/rpc/") || req.url().includes("/api/")) {
      requests.push({ url: req.url(), method: req.method() });
      console.log(`[REQ] ${req.method()} ${req.url()}`);
    }
  });

  page.on("response", async (res) => {
    if (res.url().includes("/rpc/") || res.url().includes("/api/")) {
      const body = await res.text().catch(() => "");
      responses.push({ url: res.url(), status: res.status(), body });
      console.log(`[RES] ${res.status()} ${res.url()}`);
      console.log(`[BODY] ${body.slice(0, 500)}`);
    }
  });

  // Go to login
  await page.goto("https://gcmc.karetechsolutions.com/login");
  await page.waitForLoadState("networkidle");

  // Fill login form
  await page.getByLabel("Email").fill("kareemschultz46@gmail.com");
  await page.getByLabel("Password").fill("Karetech232628!!");

  // Click sign in
  await page.getByRole("button", { name: SIGN_IN_REGEX }).click();

  // Wait for navigation
  await page.waitForTimeout(5000);

  // Take screenshot
  await page.screenshot({ path: "debug-staff-status.png", fullPage: true });

  // Log current URL
  console.log(`[URL] ${page.url()}`);

  // Check what we see
  const pageContent = await page.content();
  console.log(
    `[PAGE] Contains "Access Pending": ${pageContent.includes("Access Pending")}`
  );
  console.log(
    `[PAGE] Contains "Dashboard": ${pageContent.includes("Dashboard")}`
  );

  // Print all responses
  console.log("\n=== ALL API RESPONSES ===");
  for (const r of responses) {
    console.log(`${r.status} ${r.url}`);
    console.log(`Body: ${r.body.slice(0, 300)}\n`);
  }
});
