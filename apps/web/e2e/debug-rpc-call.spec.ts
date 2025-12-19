import { test } from "@playwright/test";

// Regex patterns at top level for performance
const SIGN_IN_REGEX = /sign in/i;

test("debug RPC call mechanism", async ({ page }) => {
  const EMAIL = "kareemschultz46@gmail.com";
  const PASSWORD = "oxAiA5tUnAHYFJN2Qa8mQEoFVXDgZCg0";

  console.log("\n=== DEBUG: RPC Call Mechanism ===\n");

  // Log all fetch calls
  await page.addInitScript(() => {
    const origFetch = window.fetch;
    window.fetch = async function (...args) {
      let url: string;
      const input = args[0];
      if (typeof input === "string") {
        url = input;
      } else if (input instanceof Request) {
        url = input.url;
      } else {
        url = input.toString();
      }
      console.log(`[FETCH CALL] ${url}`);
      try {
        const response = await origFetch.apply(this, args);
        console.log(`[FETCH RESPONSE] ${response.status} ${url}`);
        return response;
      } catch (e) {
        console.log(`[FETCH ERROR] ${url}: ${e}`);
        throw e;
      }
    };
  });

  // Log console
  page.on("console", (msg) => {
    const text = msg.text();
    if (
      text.includes("FETCH") ||
      text.includes("rpc") ||
      text.includes("staff") ||
      text.includes("error") ||
      text.includes("Error")
    ) {
      console.log(`[CONSOLE] ${text}`);
    }
  });

  page.on("pageerror", (error) => {
    console.log(`[PAGE ERROR] ${error.message}`);
  });

  // Step 1: Login
  console.log("Step 1: Login");
  await page.goto("https://gcmc.karetechsolutions.com/login");
  await page.waitForLoadState("networkidle");

  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: SIGN_IN_REGEX }).click();

  await page.waitForURL("**/app**", { timeout: 15_000 });
  console.log(`  URL: ${page.url()}`);

  // Step 2: Wait and observe
  console.log("\nStep 2: Waiting for frontend (15s)...");
  await page.waitForTimeout(15_000);

  // Step 3: Check page state
  console.log("\nStep 3: Check page state");
  const hasAccessPending = await page
    .getByText("Access Pending")
    .isVisible()
    .catch(() => false);
  const hasLoading = await page
    .getByText("Loading...")
    .isVisible()
    .catch(() => false);
  console.log(`  Access Pending: ${hasAccessPending}`);
  console.log(`  Loading: ${hasLoading}`);

  // Step 4: Check TanStack Query state
  console.log("\nStep 4: Check TanStack Query cache");
  const queryState = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryClient = (window as any).__REACT_QUERY_DEVTOOLS_STATE__?.client;
    if (queryClient) {
      const cache = queryClient.getQueryCache().getAll();
      return cache.map((q: any) => ({
        key: q.queryKey,
        state: q.state.status,
        data: q.state.data ? "present" : "null",
        error: q.state.error?.message || null,
      }));
    }
    return "QueryClient not accessible";
  });
  console.log(`  Query cache: ${JSON.stringify(queryState, null, 2)}`);

  // Step 5: Manually try RPC call
  console.log("\nStep 5: Manual RPC call from browser");
  const manualResult = await page.evaluate(async () => {
    try {
      const res = await fetch("/rpc/settings/getStaffStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        credentials: "include",
      });
      const text = await res.text();
      return { status: res.status, body: text.slice(0, 300), success: true };
    } catch (e) {
      return { error: String(e), success: false };
    }
  });
  console.log(`  Result: ${JSON.stringify(manualResult)}`);

  await page.screenshot({ path: "debug-rpc.png", fullPage: true });
});
