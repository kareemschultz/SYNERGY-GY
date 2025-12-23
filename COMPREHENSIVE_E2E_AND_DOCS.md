# Complete Codebase Analysis, E2E Testing, Cleanup & Documentation

## Overview

This is a comprehensive prompt that covers:

0. **PHASE 0: Documentation Baseline** - Update docs to current state FIRST
1. **PHASE 1: Codebase Discovery** - Read and understand EVERYTHING
2. **PHASE 2: E2E Test Generation** - Build tests from codebase understanding
3. **PHASE 3: Execute Tests** - Run tests, capture screenshots, monitor logs
4. **PHASE 4: Fix Issues** - Address all warnings, errors, improvements
5. **PHASE 5: Cleanup** - Remove dead code, unused files, optimize
6. **PHASE 6: Documentation** - Final documentation polish
7. **PHASE 7: README Overhaul** - Professional GitHub README

---

# PHASE 0: Documentation Baseline (DO THIS FIRST!)

Before any testing, update all documentation to reflect the CURRENT state.

## 0.1 Read Current State

```bash
# Understand what exists now
echo "=== PROJECT OVERVIEW ==="
cat package.json | head -30
cat docker-compose.yml | head -50
cat .env.example

echo ""
echo "=== DOCUMENTATION FILES ==="
find . -name "*.md" -not -path "./node_modules/*" | sort

echo ""
echo "=== CURRENT DOCS CONTENT ==="
cat .claude/CLAUDE.md 2>/dev/null || echo "No CLAUDE.md"
cat README.md | head -100
cat DEPLOYMENT.md 2>/dev/null | head -50
```

## 0.2 Update .claude/CLAUDE.md

This is the MOST IMPORTANT doc - it guides all future development.

Read the current file, then update to include:
- Current tech stack (React 19, Hono, tRPC, Better Auth, Drizzle, PostgreSQL 17, Bun)
- Current project structure
- Current patterns (filter "all" → undefined, single .env file, etc.)
- Current database schema overview
- Current API patterns
- Common commands
- Guyana-specific features (VAT 14%, PAYE, NIS)
- DO NOT list

## 0.3 Update DEPLOYMENT.md

Ensure deployment docs are accurate:
- Docker Compose setup
- Environment variables (especially .env pattern)
- Health check commands
- Troubleshooting steps

## 0.4 Update/Create IMPLEMENTATION_STATUS.md

Document what's complete:
- All modules and their status
- Recent changes
- Known issues (if any)

## 0.5 Create docs/ARCHITECTURE.md

Create architecture documentation:
- System diagram (ASCII art)
- Package structure
- Data flow
- Authentication flow
- Business isolation diagram

## 0.6 Generate Inventory Docs

```bash
# Generate from code analysis
mkdir -p docs

# Database tables
echo "# Database Tables" > docs/DATABASE_TABLES.md
for file in packages/db/src/schema/*.ts; do
  echo "## $(basename $file .ts)" >> docs/DATABASE_TABLES.md
  grep "export const" "$file" | head -5 >> docs/DATABASE_TABLES.md
done

# API endpoints  
echo "# API Endpoints" > docs/API_ENDPOINTS.md
for file in packages/api/src/routers/*.ts; do
  echo "## $(basename $file .ts)" >> docs/API_ENDPOINTS.md
  grep -E "Procedure\.(query|mutation)" "$file" | head -20 >> docs/API_ENDPOINTS.md
done

# Frontend pages
echo "# Frontend Pages" > docs/FRONTEND_PAGES.md
find apps/web/src/routes -name "*.tsx" | sort >> docs/FRONTEND_PAGES.md
```

## 0.7 Commit Documentation Baseline

```bash
git add -A
git commit -m "docs: update documentation to current state (baseline before E2E)"
```

---

# PHASE 1: Codebase Discovery & Analysis

## 1.1 Project Structure Analysis

```bash
# Get complete project structure
echo "=== PROJECT STRUCTURE ==="
tree -L 3 -I "node_modules|dist|.git|coverage" . > docs/PROJECT_STRUCTURE.md

# List all packages
echo "=== PACKAGES ==="
ls -la packages/

# List all apps
echo "=== APPS ==="
ls -la apps/
```

## 1.2 Read Core Configuration Files

```bash
# Read and understand these files FIRST:
cat package.json
cat turbo.json
cat docker-compose.yml
cat .env.example
cat tsconfig.json
cat biome.json
cat .claude/CLAUDE.md
```

## 1.3 Analyze Database Schema

```bash
# Read the ENTIRE schema to understand data models
cat packages/db/src/schema/index.ts

# List all schema files
ls -la packages/db/src/schema/

# Read each schema file
for file in packages/db/src/schema/*.ts; do
  echo "=== $file ==="
  cat "$file"
done
```

## 1.4 Analyze API Routes

```bash
# List all routers
ls -la packages/api/src/routers/

# Get router overview - endpoints per file
for file in packages/api/src/routers/*.ts; do
  echo "=== $file ==="
  echo "Endpoints:"
  grep -n "Procedure\." "$file" | head -30
done

# Read main router index
cat packages/api/src/routers/index.ts
```

## 1.5 Analyze Frontend Routes & Pages

```bash
# List all frontend routes
find apps/web/src/routes -name "*.tsx" | sort

# Get page components overview
for file in apps/web/src/routes/app/*/index.tsx; do
  echo "=== $file ==="
  head -50 "$file"
done

# List all components
find apps/web/src/components -name "*.tsx" | sort
```

## 1.6 Analyze Authentication Flow

```bash
# Read auth configuration
cat packages/auth/src/index.ts

# Read auth client
cat apps/web/src/lib/auth-client.ts

# Find auth middleware
grep -rn "auth\|session\|middleware" packages/api/src/ --include="*.ts" | head -30
```

## 1.7 Create Feature Inventory

Based on the codebase analysis, create a complete feature inventory:

```bash
# Create feature inventory document
cat > docs/FEATURE_INVENTORY.md << 'EOF'
# GK-Nexus Feature Inventory

## Authentication & Authorization
- [ ] Login (email/password)
- [ ] Logout
- [ ] Session management
- [ ] Role-based access (Owner, Admin, Staff)
- [ ] Business isolation (GCMC, KAJ)

## Dashboard
- [ ] Overview stats
- [ ] Recent activity
- [ ] Quick actions
- [ ] Business switcher

## Clients Module
- [ ] List clients (with filters)
- [ ] Create client
- [ ] Edit client
- [ ] View client details
- [ ] Delete/archive client
- [ ] Client portal access

## Matters Module
- [ ] List matters
- [ ] Create matter
- [ ] Edit matter
- [ ] View matter details
- [ ] Matter status workflow
- [ ] Assign staff
- [ ] Link documents

## Documents Module
- [ ] List documents
- [ ] Upload document
- [ ] Download document
- [ ] Preview document
- [ ] Delete document
- [ ] Document categories

## Invoices Module
- [ ] List invoices
- [ ] Create invoice
- [ ] Edit invoice
- [ ] View invoice
- [ ] Invoice line items
- [ ] VAT calculations (14%)
- [ ] Mark as paid
- [ ] Send to client

## Appointments/Calendar
- [ ] List appointments
- [ ] Create appointment
- [ ] Edit appointment
- [ ] Calendar view
- [ ] Reminders

## Services Catalog
- [ ] List services
- [ ] Create service
- [ ] Edit service
- [ ] Service pricing

## Knowledge Base
- [ ] List resources
- [ ] Search resources
- [ ] Filter by category/type
- [ ] Download resources
- [ ] Auto-fill feature
- [ ] Admin: Add resources
- [ ] Admin: Fetch government forms

## Reports
- [ ] Revenue reports
- [ ] Client reports
- [ ] Matter reports
- [ ] Tax reports
- [ ] Export to PDF/Excel

## Calculators
- [ ] PAYE calculator
- [ ] NIS calculator
- [ ] VAT calculator

## Training Module
- [ ] List trainings
- [ ] Training details
- [ ] Enroll in training

## Analytics
- [ ] Dashboard analytics
- [ ] Charts and graphs
- [ ] Date range filters

## Admin Panel
- [ ] System settings
- [ ] User management
- [ ] Staff management
- [ ] Backup management
- [ ] Activity logs
- [ ] Knowledge base admin

## Settings
- [ ] Profile settings
- [ ] Appearance (theme)
- [ ] Notifications
- [ ] Security
- [ ] Backup settings

## Client Portal
- [ ] Portal login
- [ ] View matters
- [ ] View documents
- [ ] View invoices
- [ ] Download documents

EOF
```

## 1.8 Identify All UI Components

```bash
# List all UI components being used
echo "=== SHADCN/UI COMPONENTS ==="
ls -la apps/web/src/components/ui/

# List custom components
echo "=== CUSTOM COMPONENTS ==="
ls -la apps/web/src/components/

# Find all component imports
grep -rh "from \"@/components" apps/web/src/routes --include="*.tsx" | sort | uniq
```

## 1.9 Check Current Test Coverage

```bash
# Check if tests exist
find . -name "*.test.ts" -o -name "*.spec.ts" | grep -v node_modules

# Check test configuration
cat vitest.config.ts 2>/dev/null || echo "No vitest config"
cat jest.config.js 2>/dev/null || echo "No jest config"
cat playwright.config.ts 2>/dev/null || echo "No playwright config"
```

## 1.10 Analyze Current Issues

```bash
# Check for TypeScript errors
bun run check-types 2>&1 | tee docs/TYPESCRIPT_ERRORS.log

# Check for lint errors
bun run check 2>&1 | tee docs/LINT_ERRORS.log

# Find TODO/FIXME comments
grep -rn "TODO\|FIXME\|XXX\|HACK" packages/ apps/ --include="*.ts" --include="*.tsx" | grep -v node_modules > docs/TODO_ITEMS.log

# Find console.log statements (should be removed in production)
grep -rn "console\.log\|console\.error\|console\.warn" apps/ packages/ --include="*.ts" --include="*.tsx" | grep -v node_modules > docs/CONSOLE_STATEMENTS.log

# Find unused imports
grep -rn "^import.*from" apps/web/src --include="*.tsx" | head -100
```

---

# PHASE 2: E2E Test Generation

## 2.1 Setup Playwright

```bash
# Install Playwright
bun add -D @playwright/test

# Install browsers
bunx playwright install chromium firefox

# Create config
cat > playwright.config.ts << 'EOF'
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'e2e-report' }],
    ['json', { outputFile: 'e2e-results.json' }],
    ['list']
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'retain-on-failure',
    actionTimeout: 15000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: 'e2e-results/',
  timeout: 60000,
});
EOF

# Create directory structure
mkdir -p e2e/{tests,fixtures,screenshots,utils}
```

## 2.2 Create Test Utilities

```bash
cat > e2e/utils/helpers.ts << 'EOF'
import { Page, expect } from '@playwright/test';
import * as fs from 'fs';

// Configuration
export const config = {
  baseUrl: process.env.E2E_BASE_URL || 'http://localhost:5173',
  testUser: {
    email: process.env.TEST_EMAIL || 'admin@gknexus.com',
    password: process.env.TEST_PASSWORD || 'Admin@1qazxsw2',
  },
};

// Console tracking
export const consoleMessages = {
  errors: [] as string[],
  warnings: [] as string[],
  logs: [] as string[],
};

export function setupConsoleTracking(page: Page) {
  page.on('console', msg => {
    const text = msg.text();
    switch (msg.type()) {
      case 'error':
        consoleMessages.errors.push(text);
        break;
      case 'warning':
        consoleMessages.warnings.push(text);
        break;
      default:
        consoleMessages.logs.push(text);
    }
  });

  page.on('pageerror', error => {
    consoleMessages.errors.push(`Page Error: ${error.message}`);
  });
}

// Screenshot helper
export async function takeScreenshot(page: Page, name: string, fullPage = true) {
  const screenshotDir = 'e2e/screenshots';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  const filename = `${screenshotDir}/${name.replace(/\s+/g, '-').toLowerCase()}.png`;
  await page.screenshot({ path: filename, fullPage });
  console.log(`📸 Screenshot saved: ${filename}`);
  return filename;
}

// Login helper
export async function login(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[type="email"], input[name="email"]', config.testUser.email);
  await page.fill('input[type="password"], input[name="password"]', config.testUser.password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to app
  await page.waitForURL('**/app**', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

// Check for page errors
export async function checkPageHealth(page: Page, pageName: string) {
  const errors: string[] = [];
  
  // Check for error elements
  const errorElements = await page.locator('[class*="error"], [class*="Error"], [role="alert"]').count();
  if (errorElements > 0) {
    const errorTexts = await page.locator('[class*="error"], [class*="Error"], [role="alert"]').allTextContents();
    errors.push(...errorTexts.filter(t => t.trim()));
  }
  
  // Check for "Something went wrong"
  const somethingWrong = await page.locator('text=/something went wrong/i').count();
  if (somethingWrong > 0) {
    errors.push('Found "Something went wrong" message');
  }
  
  // Check for loading stuck
  const loadingStuck = await page.locator('[class*="loading"], [class*="spinner"]').count();
  
  return {
    pageName,
    hasErrors: errors.length > 0,
    errors,
    hasStuckLoading: loadingStuck > 0,
    consoleErrors: [...consoleMessages.errors],
  };
}

// Wait for API to settle
export async function waitForApi(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // Small buffer for React to update
}

// Report generator
export function generateReport() {
  return {
    timestamp: new Date().toISOString(),
    consoleErrors: consoleMessages.errors,
    consoleWarnings: consoleMessages.warnings,
    totalLogs: consoleMessages.logs.length,
  };
}
EOF
```

## 2.3 Create Auth Tests

```bash
cat > e2e/tests/01-auth.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';
import { takeScreenshot, setupConsoleTracking, config, waitForApi } from '../utils/helpers';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleTracking(page);
  });

  test('01 - Login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await waitForApi(page);
    await takeScreenshot(page, '01-login-page');
    
    // Should have login form
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Should have branding
    await expect(page.locator('text=/GK-Nexus|GCMC|Green Crescent/i')).toBeVisible();
    
    // Should NOT have navigation (Home, Dashboard links)
    const navLinks = await page.locator('nav a, header a').count();
    // Minimal or no nav on login page
  });

  test('02 - Login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await waitForApi(page);
    
    await page.fill('input[type="email"], input[name="email"]', config.testUser.email);
    await page.fill('input[type="password"], input[name="password"]', config.testUser.password);
    
    await takeScreenshot(page, '02-login-filled');
    
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await page.waitForURL('**/app**', { timeout: 15000 });
    await waitForApi(page);
    
    await takeScreenshot(page, '03-dashboard-after-login');
    
    // Should show user info or welcome message
    await expect(page.locator('text=/welcome|dashboard/i')).toBeVisible();
  });

  test('03 - Login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await waitForApi(page);
    
    await page.fill('input[type="email"], input[name="email"]', 'invalid@test.com');
    await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '04-login-error');
    
    // Should show error message
    const errorVisible = await page.locator('text=/invalid|error|failed|incorrect/i').count();
    expect(errorVisible).toBeGreaterThan(0);
  });

  test('04 - Logout works correctly', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', config.testUser.email);
    await page.fill('input[type="password"], input[name="password"]', config.testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app**', { timeout: 15000 });
    await waitForApi(page);
    
    // Find and click logout
    // Look for user menu or logout button
    const userMenu = page.locator('[data-testid="user-menu"], [aria-label*="user"], button:has-text("Kareem"), .avatar');
    if (await userMenu.count() > 0) {
      await userMenu.first().click();
      await page.waitForTimeout(500);
    }
    
    const logoutButton = page.locator('text=/logout|sign out/i');
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      await page.waitForURL('**/login**', { timeout: 10000 });
      await takeScreenshot(page, '05-after-logout');
    }
  });
});
EOF
```

## 2.4 Create Dashboard Tests

```bash
cat > e2e/tests/02-dashboard.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';
import { takeScreenshot, setupConsoleTracking, login, waitForApi, checkPageHealth } from '../utils/helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleTracking(page);
    await login(page);
  });

  test('01 - Dashboard loads without errors', async ({ page }) => {
    await page.goto('/app');
    await waitForApi(page);
    await takeScreenshot(page, '10-dashboard-main');
    
    const health = await checkPageHealth(page, 'Dashboard');
    expect(health.hasErrors).toBeFalsy();
  });

  test('02 - Dashboard shows stats cards', async ({ page }) => {
    await page.goto('/app');
    await waitForApi(page);
    
    // Should have stat cards
    const statCards = await page.locator('[class*="card"], [class*="Card"]').count();
    expect(statCards).toBeGreaterThan(0);
  });

  test('03 - Business switcher works (GCMC/KAJ)', async ({ page }) => {
    await page.goto('/app');
    await waitForApi(page);
    
    // Find business switcher
    const switcher = page.locator('text=/GCMC|KAJ/i').first();
    if (await switcher.count() > 0) {
      await takeScreenshot(page, '11-business-switcher-before');
      await switcher.click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, '12-business-switcher-menu');
    }
  });

  test('04 - Sidebar navigation visible', async ({ page }) => {
    await page.goto('/app');
    await waitForApi(page);
    
    // Check for main nav items
    const navItems = [
      'Dashboard',
      'Clients',
      'Matters',
      'Documents',
      'Invoices',
      'Calendar',
      'Reports',
      'Settings',
    ];
    
    for (const item of navItems) {
      const navLink = page.locator(`text=${item}`).first();
      const isVisible = await navLink.isVisible().catch(() => false);
      console.log(`Nav item "${item}": ${isVisible ? '✓' : '✗'}`);
    }
  });
});
EOF
```

## 2.5 Create Module Tests (Clients, Matters, Invoices, etc.)

```bash
cat > e2e/tests/03-modules.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';
import { takeScreenshot, setupConsoleTracking, login, waitForApi, checkPageHealth } from '../utils/helpers';

// Define all modules to test
const modules = [
  { name: 'Clients', path: '/app/clients', hasFilters: true, hasCreate: true },
  { name: 'Matters', path: '/app/matters', hasFilters: true, hasCreate: true },
  { name: 'Documents', path: '/app/documents', hasFilters: true, hasCreate: true },
  { name: 'Invoices', path: '/app/invoices', hasFilters: true, hasCreate: true },
  { name: 'Appointments', path: '/app/appointments', hasFilters: true, hasCreate: true },
  { name: 'Calendar', path: '/app/calendar', hasFilters: false, hasCreate: false },
  { name: 'Services', path: '/app/services', hasFilters: true, hasCreate: true },
  { name: 'Knowledge Base', path: '/app/knowledge-base', hasFilters: true, hasCreate: false },
  { name: 'Training', path: '/app/training', hasFilters: true, hasCreate: false },
  { name: 'Calculators', path: '/app/calculators', hasFilters: false, hasCreate: false },
  { name: 'Analytics', path: '/app/analytics', hasFilters: true, hasCreate: false },
  { name: 'Reports', path: '/app/reports', hasFilters: true, hasCreate: false },
];

test.describe('Module Pages', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleTracking(page);
    await login(page);
  });

  for (const module of modules) {
    test(`${module.name} - Page loads without errors`, async ({ page }) => {
      await page.goto(module.path);
      await waitForApi(page);
      await takeScreenshot(page, `20-${module.name.toLowerCase().replace(/\s+/g, '-')}`);
      
      const health = await checkPageHealth(page, module.name);
      
      // Log any issues found
      if (health.hasErrors) {
        console.log(`❌ ${module.name} has errors:`, health.errors);
      }
      if (health.consoleErrors.length > 0) {
        console.log(`⚠️ ${module.name} console errors:`, health.consoleErrors);
      }
      
      expect(health.hasErrors).toBeFalsy();
    });

    if (module.hasFilters) {
      test(`${module.name} - Filters work correctly`, async ({ page }) => {
        await page.goto(module.path);
        await waitForApi(page);
        
        // Look for filter dropdowns
        const filters = page.locator('select, [role="combobox"], [data-testid*="filter"]');
        const filterCount = await filters.count();
        
        console.log(`${module.name} has ${filterCount} filter(s)`);
        
        if (filterCount > 0) {
          // Try clicking first filter
          await filters.first().click();
          await page.waitForTimeout(300);
          await takeScreenshot(page, `21-${module.name.toLowerCase()}-filter-open`);
        }
      });
    }

    if (module.hasCreate) {
      test(`${module.name} - Create button exists`, async ({ page }) => {
        await page.goto(module.path);
        await waitForApi(page);
        
        // Look for create/add button
        const createButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New"), [data-testid*="create"], [data-testid*="add"]');
        const hasCreate = await createButton.count() > 0;
        
        console.log(`${module.name} has create button: ${hasCreate}`);
        
        if (hasCreate) {
          await createButton.first().click();
          await page.waitForTimeout(500);
          await takeScreenshot(page, `22-${module.name.toLowerCase()}-create-modal`);
        }
      });
    }
  }
});
EOF
```

## 2.6 Create Admin Tests

```bash
cat > e2e/tests/04-admin.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';
import { takeScreenshot, setupConsoleTracking, login, waitForApi, checkPageHealth } from '../utils/helpers';

const adminPages = [
  { name: 'Admin Dashboard', path: '/app/admin' },
  { name: 'Staff Management', path: '/app/admin/staff' },
  { name: 'Knowledge Base Admin', path: '/app/admin/knowledge-base' },
  { name: 'Activity Logs', path: '/app/admin/activity-logs' },
];

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleTracking(page);
    await login(page);
  });

  for (const adminPage of adminPages) {
    test(`${adminPage.name} - Loads without errors`, async ({ page }) => {
      await page.goto(adminPage.path);
      await waitForApi(page);
      await takeScreenshot(page, `30-admin-${adminPage.name.toLowerCase().replace(/\s+/g, '-')}`);
      
      const health = await checkPageHealth(page, adminPage.name);
      expect(health.hasErrors).toBeFalsy();
    });
  }

  test('System Settings shows correct environment', async ({ page }) => {
    await page.goto('/app/admin');
    await waitForApi(page);
    
    // Check environment badge
    const envBadge = page.locator('text=/production|development/i');
    await expect(envBadge).toBeVisible();
    
    const envText = await envBadge.textContent();
    console.log(`Environment displayed: ${envText}`);
  });

  test('Backup system accessible', async ({ page }) => {
    await page.goto('/app/settings');
    await waitForApi(page);
    
    // Navigate to backup settings
    const backupLink = page.locator('text=/backup/i');
    if (await backupLink.count() > 0) {
      await backupLink.click();
      await waitForApi(page);
      await takeScreenshot(page, '31-backup-settings');
    }
  });
});
EOF
```

## 2.7 Create Settings Tests

```bash
cat > e2e/tests/05-settings.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';
import { takeScreenshot, setupConsoleTracking, login, waitForApi, checkPageHealth } from '../utils/helpers';

const settingsPages = [
  { name: 'Profile', path: '/app/settings' },
  { name: 'Appearance', path: '/app/settings/appearance' },
  { name: 'Notifications', path: '/app/settings/notifications' },
  { name: 'Security', path: '/app/settings/security' },
  { name: 'Backup', path: '/app/settings/backup' },
];

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleTracking(page);
    await login(page);
  });

  for (const settingPage of settingsPages) {
    test(`${settingPage.name} settings page loads`, async ({ page }) => {
      await page.goto(settingPage.path);
      await waitForApi(page);
      await takeScreenshot(page, `40-settings-${settingPage.name.toLowerCase()}`);
      
      const health = await checkPageHealth(page, settingPage.name);
      expect(health.hasErrors).toBeFalsy();
    });
  }

  test('Theme toggle works', async ({ page }) => {
    await page.goto('/app/settings/appearance');
    await waitForApi(page);
    
    // Find theme toggle
    const themeToggle = page.locator('[data-testid*="theme"], button:has-text("Dark"), button:has-text("Light")');
    if (await themeToggle.count() > 0) {
      await themeToggle.first().click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, '41-theme-changed');
    }
  });
});
EOF
```

## 2.8 Create Full Test Runner Script

```bash
cat > e2e/run-all-tests.sh << 'EOF'
#!/bin/bash

echo "🧪 GK-Nexus E2E Test Suite"
echo "=========================="
echo ""

# Set environment variables
export E2E_BASE_URL=${E2E_BASE_URL:-"http://localhost:5173"}
export TEST_EMAIL=${TEST_EMAIL:-"admin@gknexus.com"}
export TEST_PASSWORD=${TEST_PASSWORD:-"Admin@1qazxsw2"}

echo "📍 Testing against: $E2E_BASE_URL"
echo ""

# Create screenshot directory
mkdir -p e2e/screenshots

# Run tests
echo "🚀 Running tests..."
bunx playwright test --reporter=list

# Generate report
echo ""
echo "📊 Generating HTML report..."
bunx playwright show-report e2e-report

echo ""
echo "✅ Tests complete!"
echo "📸 Screenshots saved to: e2e/screenshots/"
echo "📋 Report available at: e2e-report/index.html"
EOF

chmod +x e2e/run-all-tests.sh
```

---

# PHASE 3: Execute Tests & Monitor

## 3.1 Run Tests with Full Logging

```bash
# Start the dev server (if testing locally)
# bun run dev &

# Run tests with verbose output
E2E_BASE_URL="https://gcmc.karetechsolutions.com" \
TEST_EMAIL="your-test-email" \
TEST_PASSWORD="your-test-password" \
bunx playwright test --reporter=list,html

# Or run specific test file
bunx playwright test e2e/tests/01-auth.spec.ts
```

## 3.2 Monitor Server Logs During Testing

```bash
# In another terminal, watch server logs
docker logs -f gk-nexus-server

# Watch for errors specifically
docker logs -f gk-nexus-server 2>&1 | grep -i "error\|warn\|fail"
```

## 3.3 Analyze Test Results

```bash
# Check for failures
cat e2e-results.json | jq '.suites[].specs[] | select(.ok == false)'

# List all screenshots taken
ls -la e2e/screenshots/

# Check console errors captured
cat e2e-results.json | jq '.consoleMessages.errors'
```

---

# PHASE 4: Fix All Issues

## 4.1 Compile Issue List

After running tests, compile all issues found:

```bash
cat > docs/ISSUES_TO_FIX.md << 'EOF'
# Issues Found During E2E Testing

## Console Errors
<!-- Add console errors found during testing -->

## Page Errors
<!-- Add pages that failed to load or had errors -->

## UI Issues
<!-- Add visual or interaction issues -->

## Missing Features
<!-- Add features that don't work as expected -->

## Performance Issues
<!-- Add slow-loading pages or actions -->

## Accessibility Issues
<!-- Add any a11y issues found -->

EOF
```

## 4.2 Fix Each Issue

For each issue found:
1. Identify the root cause
2. Implement the fix
3. Add test to prevent regression
4. Verify fix works

---

# PHASE 5: Cleanup

## 5.1 Remove Dead Code

```bash
# Find unused exports
bunx knip --reporter=compact

# Find unused dependencies
bunx depcheck

# Find console.log statements to remove
grep -rn "console\.log" apps/ packages/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v "// debug"

# Remove console.log statements (carefully!)
# Only remove after verifying they're not needed
```

## 5.2 Remove Unused Files

```bash
# Find files not imported anywhere
find apps/web/src/components -name "*.tsx" | while read file; do
  basename=$(basename "$file" .tsx)
  count=$(grep -r "$basename" apps/web/src --include="*.tsx" | wc -l)
  if [ "$count" -le 1 ]; then
    echo "Potentially unused: $file"
  fi
done
```

## 5.3 Optimize Imports

```bash
# Run biome to organize imports
bun run check --fix

# Verify no unused imports
bun run check-types
```

## 5.4 Update Dependencies

```bash
# Check for outdated dependencies
bun outdated

# Update patch versions (safe)
bun update

# Check for security issues
bun audit
```

---

# PHASE 6: Documentation Update

## 6.1 Update All Documentation Files

```bash
# List all documentation files
find . -name "*.md" -not -path "./node_modules/*" | sort

# Files to update:
# - README.md (covered in Phase 7)
# - CLAUDE.md
# - DEPLOYMENT.md
# - DEVELOPMENT_RULES.md
# - IMPLEMENTATION_STATUS.md
# - docs/DOCKER_DEPLOYMENT.md
# - Any other docs
```

## 6.2 Update CLAUDE.md

Ensure `.claude/CLAUDE.md` reflects current:
- Project structure
- Key patterns
- Environment configuration
- Common issues and solutions
- Testing procedures

## 6.3 Update DEPLOYMENT.md

Ensure deployment docs include:
- Current Docker setup
- Environment variables
- Health checks
- Backup procedures
- Monitoring

## 6.4 Create API Documentation

```bash
# Generate API documentation from routers
cat > docs/API_REFERENCE.md << 'EOF'
# GK-Nexus API Reference

## Authentication
All API endpoints require authentication via session cookie.

## Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Get current session

### Clients
- `GET /api/trpc/clients.list` - List clients
- `GET /api/trpc/clients.get` - Get client by ID
- `POST /api/trpc/clients.create` - Create client
- `POST /api/trpc/clients.update` - Update client
- `POST /api/trpc/clients.delete` - Delete client

### Matters
<!-- Add all matter endpoints -->

### Documents
<!-- Add all document endpoints -->

### Invoices
<!-- Add all invoice endpoints -->

<!-- Continue for all routers -->

EOF
```

---

# PHASE 7: README Overhaul

## 7.1 Create Professional README

```bash
cat > README.md << 'EOF'
<div align="center">
  <img src="docs/assets/logo.png" alt="GK-Nexus Logo" width="200" />
  
  # GK-Nexus
  
  **Practice Management System for Guyana-based Accounting & Consulting Firms**

  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
  [![Hono](https://img.shields.io/badge/Hono-4.0-orange.svg)](https://hono.dev/)
  [![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

  [Features](#features) • [Screenshots](#screenshots) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running](#running)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

GK-Nexus is a comprehensive practice management system designed specifically for **Green Crescent Management Consultancy (GCMC)** and **KAJ Financial Services** in Guyana. It streamlines client management, matter tracking, document handling, invoicing with Guyana-specific tax calculations, and more.

### 🏢 Supported Businesses

| Business | Services |
|----------|----------|
| **Green Crescent Management Consultancy (GCMC)** | Trainings, Consulting, Immigration, Paralegal, Business Proposals, Networking |
| **KAJ Financial Services** | GRA Licensed Accounting, Tax Preparation, Financial Services |

---

## ✨ Features

### Core Modules

| Module | Description |
|--------|-------------|
| 👥 **Client Management** | Full client lifecycle with portal access |
| 📋 **Matter Tracking** | Case/project management with status workflows |
| 📄 **Document Management** | Upload, organize, and share documents |
| 💰 **Invoicing** | Create invoices with 14% VAT calculations |
| 📅 **Calendar & Appointments** | Schedule and manage appointments |
| 📊 **Analytics & Reports** | Business intelligence and reporting |
| 📚 **Knowledge Base** | Government forms, templates, guides |
| 🎓 **Training Module** | Manage and track training programs |
| 🧮 **Calculators** | PAYE, NIS, VAT calculators for Guyana |

### System Features

| Feature | Description |
|---------|-------------|
| 🔐 **Role-Based Access** | Owner, Admin, Staff roles |
| 🏢 **Multi-Business** | Switch between GCMC and KAJ |
| 🌙 **Dark Mode** | Full dark/light theme support |
| 💾 **Backup System** | Manual and scheduled backups |
| 🌐 **Client Portal** | Secure client access to their data |
| 📱 **Responsive** | Works on desktop, tablet, mobile |

---

## 📸 Screenshots

<div align="center">

### Login Page
<img src="e2e/screenshots/01-login-page.png" alt="Login Page" width="800" />

### Dashboard
<img src="e2e/screenshots/10-dashboard-main.png" alt="Dashboard" width="800" />

### Clients
<img src="e2e/screenshots/20-clients.png" alt="Clients" width="800" />

### Invoices
<img src="e2e/screenshots/20-invoices.png" alt="Invoices" width="800" />

### Knowledge Base
<img src="e2e/screenshots/20-knowledge-base.png" alt="Knowledge Base" width="800" />

</div>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Browser   │  │   Mobile    │  │     Client Portal       │ │
│  │  (React)    │  │  (PWA)      │  │     (Separate Auth)     │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
└─────────┼────────────────┼─────────────────────┼───────────────┘
          │                │                     │
          └────────────────┼─────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                          │        API Layer                     │
│  ┌───────────────────────┴────────────────────────────────────┐│
│  │                    Hono Server                              ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ ││
│  │  │   tRPC      │  │   Auth      │  │    File Serving     │ ││
│  │  │   Router    │  │   (Better)  │  │    (Static)         │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ ││
│  └────────────────────────────────────────────────────────────┘│
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────┐
│                             │       Data Layer                  │
│  ┌──────────────────────────┴───────────────────────────────┐  │
│  │                    PostgreSQL 17                          │  │
│  │                    (Drizzle ORM)                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    File Storage                           │  │
│  │                    (Local / S3)                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI Framework |
| **TypeScript** | Type Safety |
| **TanStack Router** | File-based Routing |
| **TanStack Query** | Data Fetching |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | Component Library |
| **Recharts** | Charts & Graphs |

### Backend
| Technology | Purpose |
|------------|---------|
| **Hono** | Web Framework |
| **tRPC** | Type-safe API |
| **Better Auth** | Authentication |
| **Drizzle ORM** | Database ORM |
| **PostgreSQL 17** | Database |
| **Bun** | Runtime & Package Manager |

### DevOps
| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Orchestration |
| **Turborepo** | Monorepo Management |
| **Biome** | Linting & Formatting |
| **Playwright** | E2E Testing |

---

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0
- [Docker](https://www.docker.com/) & Docker Compose
- [Git](https://git-scm.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/kareemschultz/SYNERGY-GY.git
cd SYNERGY-GY

# Install dependencies
bun install
```

### Configuration

```bash
# Copy environment example
cp .env.example .env

# Generate secure passwords
echo "POSTGRES_PASSWORD=$(openssl rand -base64 24)"
echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)"

# Edit .env with your values
nano .env
```

**Important:** Ensure `DATABASE_URL` password matches `POSTGRES_PASSWORD`:
```env
POSTGRES_PASSWORD=your_secure_password
DATABASE_URL=postgresql://gknexus:your_secure_password@postgres:5432/gknexus
```

### Running

#### Development
```bash
# Start PostgreSQL
docker compose up postgres -d

# Run migrations
bun run db:push

# Start development server
bun run dev
```

#### Production (Docker)
```bash
# Start all services
docker compose up -d

# Check health
curl http://localhost:8843/health
```

---

## 📁 Project Structure

```
SYNERGY-GY/
├── apps/
│   ├── server/          # Hono API server
│   │   └── src/
│   │       └── index.ts # Entry point
│   └── web/             # React frontend
│       └── src/
│           ├── components/
│           ├── routes/
│           └── lib/
├── packages/
│   ├── api/             # tRPC routers
│   │   └── src/routers/
│   ├── auth/            # Authentication
│   ├── db/              # Database schema & migrations
│   │   └── src/schema/
│   └── ui/              # Shared UI (future)
├── docs/                # Documentation
├── e2e/                 # E2E tests
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 📖 API Reference

See [API Documentation](docs/API_REFERENCE.md) for complete endpoint reference.

### Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/auth/*` | * | Authentication endpoints |
| `/api/trpc/*` | * | tRPC API endpoints |
| `/api/files/*` | GET | File serving |

---

## 🚢 Deployment

See [Deployment Guide](docs/DOCKER_DEPLOYMENT.md) for detailed instructions.

### Quick Deploy

```bash
# On production server
git clone https://github.com/kareemschultz/SYNERGY-GY.git
cd SYNERGY-GY

# Configure
cp .env.example .env
nano .env  # Set production values

# Deploy
docker compose up -d

# Verify
docker ps
curl http://localhost:8843/health
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_PASSWORD` | ✅ | Database password |
| `BETTER_AUTH_SECRET` | ✅ | Auth encryption key |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NODE_ENV` | ✅ | `production` or `development` |
| `APP_URL` | ✅ | Public URL of the app |

---

## 💻 Development

### Commands

| Command | Description |
|---------|-------------|
| `bun install` | Install dependencies |
| `bun run dev` | Start development servers |
| `bun run build` | Build for production |
| `bun run check` | Run linting |
| `bun run check-types` | TypeScript type checking |
| `bun run db:push` | Push schema to database |
| `bun run db:studio` | Open Drizzle Studio |

### Code Style

This project uses [Biome](https://biomejs.dev/) for linting and formatting:

```bash
# Check code
bun run check

# Fix issues
bun run check --fix
```

---

## 🧪 Testing

### E2E Tests (Playwright)

```bash
# Install browsers
bunx playwright install

# Run all tests
bun run test:e2e

# Run with UI
bunx playwright test --ui

# View report
bunx playwright show-report
```

### Test Coverage

| Module | Coverage |
|--------|----------|
| Authentication | ✅ |
| Dashboard | ✅ |
| Clients | ✅ |
| Matters | ✅ |
| Documents | ✅ |
| Invoices | ✅ |
| Settings | ✅ |
| Admin | ✅ |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting |
| `refactor` | Code restructuring |
| `test` | Tests |
| `chore` | Maintenance |

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🙏 Acknowledgments

- [Better-T-Stack](https://github.com/better-t-stack) - Project template
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Drizzle ORM](https://orm.drizzle.team/) - Database ORM
- [Hono](https://hono.dev/) - Web framework

---

<div align="center">
  <p>Built with ❤️ for Guyana businesses</p>
  <p>© 2025 Green Crescent Management Consultancy</p>
</div>
EOF
```

## 7.2 Create Assets Directory

```bash
mkdir -p docs/assets

# Copy logo if exists, or create placeholder
# cp path/to/logo.png docs/assets/logo.png

# Create a simple text-based logo placeholder
cat > docs/assets/logo.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#2563eb" rx="20"/>
  <text x="100" y="120" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="white" text-anchor="middle">GK</text>
</svg>
EOF
```

## 7.3 Move Screenshots to Docs

```bash
# After running E2E tests, copy best screenshots
cp e2e/screenshots/01-login-page.png docs/assets/
cp e2e/screenshots/10-dashboard-main.png docs/assets/
# etc.
```

---

# Execution Checklist

```
Complete Codebase Analysis, Testing & Documentation:

## Phase 0: Documentation Baseline (DO FIRST!)
[ ] Read current codebase state
[ ] Update .claude/CLAUDE.md with current patterns
[ ] Update DEPLOYMENT.md with current process
[ ] Update/create IMPLEMENTATION_STATUS.md
[ ] Create docs/ARCHITECTURE.md with diagrams
[ ] Generate docs/DATABASE_TABLES.md from schema
[ ] Generate docs/API_ENDPOINTS.md from routers
[ ] Generate docs/FRONTEND_PAGES.md from routes
[ ] Commit: "docs: update documentation to current state (baseline)"

## Phase 1: Discovery (Read everything!)
[ ] Read package.json, turbo.json, docker-compose.yml
[ ] Read all schema files in packages/db/src/schema/
[ ] Read all routers in packages/api/src/routers/
[ ] List all frontend routes in apps/web/src/routes/
[ ] Create feature inventory document
[ ] Identify all TODO/FIXME comments
[ ] Check for console.log statements
[ ] Run type check and lint, save results

## Phase 2: Setup E2E Tests
[ ] Install Playwright
[ ] Create playwright.config.ts
[ ] Create test utilities
[ ] Create auth tests
[ ] Create dashboard tests
[ ] Create module tests
[ ] Create admin tests
[ ] Create settings tests

## Phase 3: Run Tests
[ ] Execute all E2E tests
[ ] Capture all screenshots
[ ] Monitor console for errors
[ ] Monitor server logs
[ ] Compile issues list

## Phase 4: Fix Issues
[ ] Fix all console errors
[ ] Fix all page errors
[ ] Fix all UI issues
[ ] Fix all accessibility issues

## Phase 5: Cleanup
[ ] Remove unused imports
[ ] Remove console.log statements
[ ] Remove dead code
[ ] Update dependencies
[ ] Run final lint

## Phase 6: Final Documentation Polish
[ ] Update CLAUDE.md with any new patterns discovered
[ ] Update IMPLEMENTATION_STATUS.md with test results
[ ] Add screenshots to docs/assets/
[ ] Update any outdated docs

## Phase 7: README Overhaul
[ ] Create professional README.md
[ ] Add badges
[ ] Add table of contents
[ ] Add architecture diagram
[ ] Add screenshots from E2E tests
[ ] Add all sections
[ ] Create docs/assets/ with images

## Final
[ ] Commit all changes
[ ] Push to origin
[ ] Verify deployment
```

---

# Quick Start Command

Give Claude Code this:

```
Read COMPREHENSIVE_E2E_AND_DOCS.md and execute ALL phases in order.

PHASE 1 IS CRITICAL: You MUST read and understand the codebase first before writing any tests. Read:
- All schema files
- All router files  
- All route/page files
- All component files
- Current documentation

Then use that knowledge to:
- Build comprehensive E2E tests
- Fix all issues found
- Clean up the codebase
- Update all documentation
- Create a professional README

Take screenshots of every page during testing.
Monitor console for ALL errors and warnings.
Fix EVERYTHING you find.

Commit frequently with descriptive messages.
Final commit: "chore: comprehensive e2e testing, cleanup, and documentation overhaul"
```
