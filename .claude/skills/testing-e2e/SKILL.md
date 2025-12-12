---
name: testing-e2e
description: Write Playwright end-to-end tests for the GK-Nexus application. Use when creating E2E tests, testing user flows, UI testing, or test automation. Triggers on: test, E2E, Playwright, testing, e2e, spec, test case.
---

# Playwright E2E Testing

## Location
E2E tests in `apps/web/e2e/` (create if not exists)

## Setup

### Install Playwright
```bash
cd apps/web
bun add -D @playwright/test
bunx playwright install
```

### Configuration File
Create `apps/web/playwright.config.ts`:
```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: "bun run dev",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
  },
});
```

## Test File Structure

```
e2e/
├── auth/
│   ├── login.spec.ts
│   └── logout.spec.ts
├── clients/
│   ├── create-client.spec.ts
│   ├── client-list.spec.ts
│   └── client-detail.spec.ts
├── matters/
│   └── matter-workflow.spec.ts
├── fixtures/
│   └── test-fixtures.ts
└── helpers/
    ├── auth-helpers.ts
    └── test-utils.ts
```

## Basic Test Pattern

```typescript
import { test, expect } from "@playwright/test";

test.describe("Client Management", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the page before each test
    await page.goto("/app/clients");
  });

  test("should display client list", async ({ page }) => {
    // Wait for content to load
    await expect(page.getByRole("heading", { name: "Clients" })).toBeVisible();

    // Check for empty state OR client list
    const emptyState = page.getByText("No clients yet");
    const clientTable = page.getByRole("table");

    await expect(emptyState.or(clientTable)).toBeVisible();
  });

  test("should create a new client", async ({ page }) => {
    // Click add button
    await page.getByRole("button", { name: /add client/i }).click();

    // Fill form
    await page.getByLabel("Display Name").fill("Test Client");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Phone").fill("592-123-4567");

    // Select client type
    await page.getByRole("combobox", { name: "Type" }).click();
    await page.getByRole("option", { name: "Individual" }).click();

    // Submit
    await page.getByRole("button", { name: "Save" }).click();

    // Verify success
    await expect(page.getByText("Client created successfully")).toBeVisible();
  });
});
```

## Authentication Helper

```typescript
// e2e/helpers/auth-helpers.ts
import { Page } from "@playwright/test";

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();

  // Wait for redirect to dashboard
  await page.waitForURL("/app");
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: /user menu/i }).click();
  await page.getByRole("menuitem", { name: "Sign Out" }).click();
  await page.waitForURL("/login");
}
```

## Test with Authentication

```typescript
import { test, expect } from "@playwright/test";
import { login } from "../helpers/auth-helpers";

test.describe("Authenticated Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page, "staff@example.com", "password123");
  });

  test("should access dashboard", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });
});
```

## Page Object Pattern

```typescript
// e2e/pages/client-page.ts
import { Page, Locator, expect } from "@playwright/test";

export class ClientPage {
  readonly page: Page;
  readonly addButton: Locator;
  readonly searchInput: Locator;
  readonly clientTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addButton = page.getByRole("button", { name: /add client/i });
    this.searchInput = page.getByPlaceholder("Search clients...");
    this.clientTable = page.getByRole("table");
  }

  async goto() {
    await this.page.goto("/app/clients");
  }

  async searchFor(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press("Enter");
  }

  async openAddDialog() {
    await this.addButton.click();
    await expect(this.page.getByRole("dialog")).toBeVisible();
  }

  async createClient(data: { name: string; email: string; phone?: string }) {
    await this.openAddDialog();
    await this.page.getByLabel("Display Name").fill(data.name);
    await this.page.getByLabel("Email").fill(data.email);
    if (data.phone) {
      await this.page.getByLabel("Phone").fill(data.phone);
    }
    await this.page.getByRole("button", { name: "Save" }).click();
  }
}
```

## Using Page Objects

```typescript
import { test, expect } from "@playwright/test";
import { ClientPage } from "../pages/client-page";
import { login } from "../helpers/auth-helpers";

test.describe("Client Management", () => {
  let clientPage: ClientPage;

  test.beforeEach(async ({ page }) => {
    await login(page, "staff@example.com", "password123");
    clientPage = new ClientPage(page);
    await clientPage.goto();
  });

  test("should search for clients", async ({ page }) => {
    await clientPage.searchFor("John");
    // Assert results or empty state
  });
});
```

## Test Data Cleanup

```typescript
import { test as base, expect } from "@playwright/test";

// Extend test with cleanup fixture
export const test = base.extend<{ cleanup: () => Promise<void> }>({
  cleanup: async ({ page }, use) => {
    // Track created items
    const createdIds: string[] = [];

    // Provide cleanup function to tests
    await use(async () => {
      // Cleanup logic via API or UI
      for (const id of createdIds) {
        // Delete created test data
      }
    });

    // Auto cleanup after test
    // Note: Only clean up data you created in this test
  },
});
```

## Running Tests

```bash
# Run all tests
bunx playwright test

# Run with UI mode
bunx playwright test --ui

# Run specific file
bunx playwright test e2e/clients/create-client.spec.ts

# Run in headed mode
bunx playwright test --headed

# Generate test from actions
bunx playwright codegen http://localhost:3001
```

## Common Assertions

```typescript
// Visibility
await expect(element).toBeVisible();
await expect(element).toBeHidden();

// Text content
await expect(element).toHaveText("Expected text");
await expect(element).toContainText("partial");

// Attributes
await expect(element).toHaveAttribute("href", "/path");
await expect(element).toHaveClass(/active/);

// Form state
await expect(input).toHaveValue("value");
await expect(checkbox).toBeChecked();
await expect(button).toBeDisabled();

// Count
await expect(page.getByRole("row")).toHaveCount(5);

// URL
await expect(page).toHaveURL("/app/clients");
await expect(page).toHaveTitle(/GK-Nexus/);
```

## Testing Loading States

```typescript
test("should show loading state", async ({ page }) => {
  await page.goto("/app/clients");

  // Wait for skeleton to appear then disappear
  await expect(page.getByTestId("skeleton")).toBeVisible();
  await expect(page.getByTestId("skeleton")).toBeHidden();

  // Now content should be visible
  await expect(page.getByRole("table")).toBeVisible();
});
```

## Testing Error States

```typescript
test("should handle API error gracefully", async ({ page }) => {
  // Mock API failure
  await page.route("**/api/clients", (route) =>
    route.fulfill({
      status: 500,
      body: JSON.stringify({ error: "Server error" }),
    })
  );

  await page.goto("/app/clients");

  // Should show error message
  await expect(page.getByText(/something went wrong/i)).toBeVisible();

  // Should have retry button
  await expect(page.getByRole("button", { name: /retry/i })).toBeVisible();
});
```

## Critical Rules

1. **NO MOCK DATA** - Tests must work with real user flows, not seeded data
2. **Clean up after tests** - Delete any data created during tests
3. **Use data-testid sparingly** - Prefer accessible selectors (role, label, text)
4. **Test user journeys** - Focus on workflows, not individual components
5. **Handle async properly** - Use Playwright's auto-waiting, avoid arbitrary delays
6. **Test mobile too** - Include mobile viewport tests
7. **Keep tests independent** - Each test should work in isolation
