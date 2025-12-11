# Mobile Sidebar Visual Test Guide

## Quick Test Instructions

This guide provides step-by-step instructions for manually testing the mobile sidebar implementation.

## Prerequisites

1. Dev server running: `bun run dev`
2. Frontend accessible at: `http://localhost:3003` (or `http://localhost:5173`)
3. Browser with DevTools (Chrome, Firefox, Safari, or Edge)

## Test Scenarios

### Test 1: Desktop View (>= 640px)

**Viewport**: 1920x1080 (or any size >= 640px)

**Steps**:
1. Open browser DevTools (F12)
2. Set viewport to Desktop (1920x1080)
3. Navigate to `http://localhost:3003/app` (requires login)
4. Observe the layout

**Expected Results**:
- ✅ Sidebar visible on left side (256px width)
- ✅ Hamburger menu button NOT visible in header
- ✅ Sidebar shows all navigation items
- ✅ Sidebar shows business badges (GCMC, KAJ)
- ✅ No horizontal scroll

**Screenshot Location**: `tests/screenshots/desktop-sidebar.png`

---

### Test 2: Mobile View - Sidebar Closed (< 640px)

**Viewport**: 375x667 (iPhone SE)

**Steps**:
1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M or Cmd+Shift+M)
3. Select "iPhone SE" or set custom size 375x667
4. Navigate to `http://localhost:3003/app`
5. Observe initial state

**Expected Results**:
- ✅ Sidebar NOT visible
- ✅ Hamburger menu button visible in header (top-left)
- ✅ Hamburger icon is 5x5 (20px with proper padding)
- ✅ Button is ghost variant (no background)
- ✅ No horizontal scroll
- ✅ Content area fills full width

**Screenshot Location**: `tests/screenshots/mobile-sidebar-closed.png`

---

### Test 3: Mobile View - Opening Sidebar

**Viewport**: 375x667 (iPhone SE)

**Steps**:
1. Continue from Test 2
2. Click the hamburger menu button
3. Observe animation

**Expected Results**:
- ✅ Sidebar slides in from left
- ✅ Animation is smooth (200ms)
- ✅ Semi-transparent backdrop appears
- ✅ Backdrop has blur effect
- ✅ Sidebar width is 280px
- ✅ Sidebar shows all navigation items
- ✅ Focus moves to sidebar (first focusable element)

**Screenshot Location**: `tests/screenshots/mobile-sidebar-open.png`

---

### Test 4: Mobile View - Sidebar Interactions

**Viewport**: 375x667 (iPhone SE)

**Steps**:
1. Continue from Test 3 (sidebar open)
2. Try each closing method:

**Test 4a: Close via Navigation**
- Click any navigation link (e.g., "Clients")
- Expected: Sidebar closes, navigates to page

**Test 4b: Close via Backdrop**
- Open sidebar again
- Click on backdrop (dark area outside sidebar)
- Expected: Sidebar closes, stays on current page

**Test 4c: Close via Escape Key**
- Open sidebar again
- Press Escape key
- Expected: Sidebar closes

**Test 4d: Close via X Button**
- Open sidebar again
- Click X button in top-right corner of sidebar
- Expected: Sidebar closes

**Screenshot Location**:
- `tests/screenshots/mobile-sidebar-backdrop.png`
- `tests/screenshots/mobile-sidebar-x-button.png`

---

### Test 5: Tablet View (640px - 1024px)

**Viewport**: 768x1024 (iPad)

**Steps**:
1. Open browser DevTools
2. Toggle device toolbar
3. Select "iPad" or set custom size 768x1024
4. Navigate to `http://localhost:3003/app`

**Expected Results**:
- ✅ Sidebar visible (desktop mode, >= 640px)
- ✅ Hamburger button NOT visible
- ✅ Layout adapts to medium screen
- ✅ No horizontal scroll

**Screenshot Location**: `tests/screenshots/tablet-sidebar.png`

---

### Test 6: Responsive Breakpoint (640px)

**Viewport**: Transition from 639px to 640px

**Steps**:
1. Open browser DevTools
2. Set custom viewport to 639px width
3. Observe layout (should show hamburger)
4. Resize to 640px width
5. Observe layout change

**Expected Results**:
- ✅ At 639px: Hamburger visible, sidebar hidden
- ✅ At 640px: Sidebar visible, hamburger hidden
- ✅ Transition is smooth (no flashing)
- ✅ No layout shift or jump

---

### Test 7: Keyboard Navigation

**Viewport**: 375x667 (iPhone SE)

**Steps**:
1. Navigate to app with keyboard only (no mouse)
2. Tab to hamburger button
3. Press Enter to open sidebar
4. Tab through navigation items
5. Press Enter on a link
6. Re-open sidebar
7. Press Escape

**Expected Results**:
- ✅ Hamburger button receives focus (visible outline)
- ✅ Enter key opens sidebar
- ✅ Focus moves into sidebar
- ✅ Tab navigates through all links
- ✅ Tab stays within sidebar (focus trap)
- ✅ Enter key activates link and closes sidebar
- ✅ Escape key closes sidebar
- ✅ Focus returns to hamburger button after close

---

### Test 8: Screen Reader Compatibility

**Tools**: NVDA (Windows), VoiceOver (Mac), or TalkBack (Android)

**Steps**:
1. Enable screen reader
2. Navigate to hamburger button
3. Listen to announcement
4. Activate button
5. Listen to announcements

**Expected Announcements**:
- Hamburger button: "Open navigation menu, button, collapsed"
- When opened: "Navigation Menu, dialog"
- Navigation items: "Dashboard, link, current page" (if active)
- Close button: "Close, button"

**Expected Results**:
- ✅ All elements announced properly
- ✅ State changes announced
- ✅ Current page indicated
- ✅ Navigation structure clear

---

### Test 9: Touch Interactions (Physical Device)

**Device**: iPhone, Android phone, or tablet

**Steps**:
1. Open app on physical device
2. Tap hamburger button
3. Tap navigation links
4. Tap backdrop
5. Test all interactions

**Expected Results**:
- ✅ Hamburger button easy to tap (44px target)
- ✅ Navigation links easy to tap
- ✅ No accidental taps
- ✅ Smooth animations (60fps)
- ✅ No lag or jank

---

### Test 10: Dark Mode

**Viewport**: All sizes

**Steps**:
1. Open app
2. Toggle dark mode (button in header)
3. Test sidebar on mobile
4. Test sidebar on desktop

**Expected Results**:
- ✅ Backdrop visible in dark mode
- ✅ Sidebar background adapts to theme
- ✅ Text readable in both modes
- ✅ Backdrop has proper contrast
- ✅ Animation smooth in both modes

**Screenshot Location**:
- `tests/screenshots/mobile-sidebar-dark.png`
- `tests/screenshots/mobile-sidebar-light.png`

---

### Test 11: Animation Performance

**Viewport**: 375x667 (iPhone SE)

**Tools**: Chrome DevTools > Performance

**Steps**:
1. Open Performance panel
2. Start recording
3. Open and close sidebar 3 times
4. Stop recording
5. Analyze frame rate

**Expected Results**:
- ✅ 60fps maintained during animation
- ✅ No frame drops
- ✅ No layout recalculation spikes
- ✅ Animation completes in ~200ms
- ✅ No memory leaks

---

### Test 12: Cross-Browser Compatibility

**Browsers**: Chrome, Firefox, Safari, Edge

**Steps**:
1. Test mobile sidebar in each browser
2. Test on mobile viewport (375x667)
3. Verify all interactions

**Expected Results**:
- ✅ Chrome: Works perfectly
- ✅ Firefox: Works perfectly
- ✅ Safari: Works perfectly (test backdrop blur)
- ✅ Edge: Works perfectly
- ✅ Mobile Chrome: Works perfectly
- ✅ Mobile Safari: Works perfectly

---

## Accessibility Audit Checklist

### ARIA Attributes
- [ ] Hamburger button has `aria-label="Open navigation menu"`
- [ ] Hamburger button has `aria-expanded` (true when open, false when closed)
- [ ] Sidebar has `aria-label="Mobile navigation menu"`
- [ ] Sidebar has `aria-hidden` (true when closed, false when open)
- [ ] Active navigation items have `aria-current="page"`
- [ ] Close button has screen reader text "Close"

### Keyboard Support
- [ ] Hamburger button is keyboard focusable
- [ ] Enter/Space activates hamburger button
- [ ] Focus trap works (Tab stays within sidebar)
- [ ] Escape closes sidebar
- [ ] All navigation links are keyboard accessible
- [ ] Focus visible on all interactive elements

### Color Contrast
- [ ] Hamburger icon: sufficient contrast (4.5:1)
- [ ] Navigation text: sufficient contrast (4.5:1)
- [ ] Active link: sufficient contrast (3:1)
- [ ] Focus indicators: sufficient contrast (3:1)

### Touch Targets
- [ ] Hamburger button: minimum 44x44px
- [ ] Navigation links: minimum 44px height
- [ ] Close button: minimum 44x44px
- [ ] Backdrop: full screen, easy to tap

---

## Automated Test Script (Optional)

Create a Playwright test to automate visual regression:

```typescript
// tests/mobile-sidebar.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Mobile Sidebar', () => {
  test('should hide sidebar and show hamburger on mobile', async ({ page }) => {
    await page.goto('/app');
    await page.setViewportSize({ width: 375, height: 667 });

    // Sidebar should be hidden
    const sidebar = page.locator('aside[aria-label="Sidebar navigation"]');
    await expect(sidebar).not.toBeVisible();

    // Hamburger should be visible
    const hamburger = page.locator('button[aria-label="Open navigation menu"]');
    await expect(hamburger).toBeVisible();

    // Take screenshot
    await expect(page).toHaveScreenshot('mobile-sidebar-closed.png');
  });

  test('should open sidebar on hamburger click', async ({ page }) => {
    await page.goto('/app');
    await page.setViewportSize({ width: 375, height: 667 });

    // Click hamburger
    const hamburger = page.locator('button[aria-label="Open navigation menu"]');
    await hamburger.click();

    // Sidebar should be visible
    const drawer = page.locator('[aria-label="Mobile navigation menu"]');
    await expect(drawer).toBeVisible();

    // aria-expanded should be true
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');

    // Take screenshot
    await expect(page).toHaveScreenshot('mobile-sidebar-open.png');
  });

  test('should close sidebar on backdrop click', async ({ page }) => {
    await page.goto('/app');
    await page.setViewportSize({ width: 375, height: 667 });

    // Open sidebar
    await page.click('button[aria-label="Open navigation menu"]');

    // Click backdrop
    await page.click('.bg-black\\/50');

    // Sidebar should be hidden
    const drawer = page.locator('[aria-label="Mobile navigation menu"]');
    await expect(drawer).not.toBeVisible();
  });

  test('should close sidebar on Escape key', async ({ page }) => {
    await page.goto('/app');
    await page.setViewportSize({ width: 375, height: 667 });

    // Open sidebar
    await page.click('button[aria-label="Open navigation menu"]');

    // Press Escape
    await page.keyboard.press('Escape');

    // Sidebar should be hidden
    const drawer = page.locator('[aria-label="Mobile navigation menu"]');
    await expect(drawer).not.toBeVisible();
  });

  test('should close sidebar on navigation', async ({ page }) => {
    await page.goto('/app');
    await page.setViewportSize({ width: 375, height: 667 });

    // Open sidebar
    await page.click('button[aria-label="Open navigation menu"]');

    // Click a navigation link
    await page.click('a[href="/app/clients"]');

    // Sidebar should be hidden
    const drawer = page.locator('[aria-label="Mobile navigation menu"]');
    await expect(drawer).not.toBeVisible();

    // Should navigate to clients page
    await expect(page).toHaveURL('/app/clients');
  });
});
```

Run with:
```bash
npx playwright test tests/mobile-sidebar.spec.ts
```

---

## Issue Reporting Template

If you find any issues during testing, report them using this template:

```markdown
### Issue: [Brief description]

**Severity**: Critical / High / Medium / Low

**Environment**:
- Browser: [Chrome 120.0.0]
- OS: [Windows 11 / macOS 14 / iOS 17]
- Viewport: [375x667]

**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Screenshot**:
[Attach screenshot if applicable]

**Console Errors**:
[Paste any console errors]
```

---

## Sign-Off

After completing all tests, sign off below:

| Test Category | Status | Tester | Date | Notes |
|---------------|--------|--------|------|-------|
| Desktop View | ☐ Pass ☐ Fail | | | |
| Mobile View | ☐ Pass ☐ Fail | | | |
| Tablet View | ☐ Pass ☐ Fail | | | |
| Animations | ☐ Pass ☐ Fail | | | |
| Keyboard Navigation | ☐ Pass ☐ Fail | | | |
| Screen Reader | ☐ Pass ☐ Fail | | | |
| Touch Interactions | ☐ Pass ☐ Fail | | | |
| Dark Mode | ☐ Pass ☐ Fail | | | |
| Performance | ☐ Pass ☐ Fail | | | |
| Cross-Browser | ☐ Pass ☐ Fail | | | |

---

**Test Completed**: [Date]
**Overall Status**: ☐ Approved ☐ Needs Revision
**Approver**: ___________________________
