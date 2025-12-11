# GK-Nexus Design System

This document defines the comprehensive design system for GK-Nexus, built with shadcn/ui components and Tailwind CSS.

---

## Design Philosophy

**Modern, Intuitive, Accessible, Responsive, Polished, Interactive**

Create a modern, sleek, intuitive, and highly polished user interface using shadcn/ui components and Tailwind CSS. The UI prioritizes exceptional user-friendliness, clear navigation, intuitive interaction patterns, and a premium product feel.

Design everything with a mobile-first, fully responsive, and accessible approach following WCAG best practices. The visual style should be minimal, elegant, and professional—similar to a refined modern SaaS application—with harmonious spacing, strong hierarchy, subtle micro-interactions, and smooth motion.

---

## Core Design Requirements

- Clean, minimal, modern UI with high visual clarity
- Cohesive layout system with balanced spacing and clear hierarchy
- Fully responsive: mobile-first, adapting gracefully to tablets and desktops
- Highly intuitive interactions with predictable behavior
- Polished and consistent styling using shadcn/ui + Tailwind utility classes
- Light mode + dark mode theming with smooth transitions

---

## 1. Design Tokens

### Color Palette

All colors use CSS custom properties for theme support.

#### Primary Colors (Legal Professional Blue)

```css
--primary: 221.2 83.2% 53.3%;        /* #3b82f6 */
--primary-foreground: 210 40% 98%;
```

#### Semantic Colors

| Purpose | Light Mode | Dark Mode | Usage |
|---------|-----------|-----------|-------|
| Success | `#10b981` (green-500) | `#34d399` | Completed tasks, positive status, successful actions |
| Error/Destructive | `#ef4444` (red-500) | `#f87171` | Errors, delete actions, overdue items |
| Warning | `#f59e0b` (amber-500) | `#fbbf24` | Warnings, approaching deadlines |
| Info | `#3b82f6` (blue-500) | `#60a5fa` | Information, links, primary actions |
| Muted | `#6b7280` (gray-500) | `#9ca3af` | Disabled elements, subtle text |

#### Background & Surface Colors

```css
/* Light Mode */
--background: 0 0% 100%;
--foreground: 222.2 84% 4.9%;
--card: 0 0% 100%;
--card-foreground: 222.2 84% 4.9%;
--muted: 210 40% 96.1%;
--muted-foreground: 215.4 16.3% 46.9%;

/* Dark Mode */
--background: 222.2 84% 4.9%;
--foreground: 210 40% 98%;
--card: 222.2 84% 4.9%;
--card-foreground: 210 40% 98%;
--muted: 217.2 32.6% 17.5%;
--muted-foreground: 215 20.2% 65.1%;
```

### Typography Scale

Using Inter or system font stack for optimal readability.

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Display | 48px (3rem) | 700 | 1.1 |
| H1 | 36px (2.25rem) | 600 | 1.2 |
| H2 | 30px (1.875rem) | 600 | 1.25 |
| H3 | 24px (1.5rem) | 600 | 1.3 |
| H4 | 20px (1.25rem) | 600 | 1.35 |
| Body Large | 18px (1.125rem) | 400 | 1.5 |
| Body | 16px (1rem) | 400 | 1.5 |
| Body Small | 14px (0.875rem) | 400 | 1.5 |
| Caption | 12px (0.75rem) | 400 | 1.4 |
| Overline | 12px (0.75rem) | 500 | 1.4 |

### Spacing System (8px Base)

```
space-0.5: 2px
space-1: 4px
space-2: 8px
space-3: 12px
space-4: 16px
space-5: 20px
space-6: 24px
space-8: 32px
space-10: 40px
space-12: 48px
space-16: 64px
space-20: 80px
space-24: 96px
```

### Border Radius

```css
--radius-sm: 0.375rem;    /* 6px - small elements */
--radius-md: 0.5rem;      /* 8px - buttons, inputs */
--radius-lg: 0.75rem;     /* 12px - cards, modals */
--radius-xl: 1rem;        /* 16px - large cards */
--radius-full: 9999px;    /* pills, avatars */
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
```

### Z-Index Scale

```css
--z-dropdown: 50;
--z-sticky: 100;
--z-fixed: 150;
--z-overlay: 200;
--z-modal: 300;
--z-popover: 400;
--z-tooltip: 500;
--z-toast: 600;
```

---

## 2. Component Variants

### Button Variants

| Variant | Usage | Visual |
|---------|-------|--------|
| `default` (Primary) | Main actions | Solid blue background |
| `secondary` | Alternative actions | Muted background |
| `outline` | Tertiary actions | Bordered, transparent |
| `ghost` | Low-priority actions | No border or background |
| `destructive` | Dangerous actions | Solid red background |
| `link` | Navigation | Underlined text |

### Button Sizes

| Size | Height | Padding | Font Size |
|------|--------|---------|-----------|
| `sm` | 32px | 12px 16px | 14px |
| `default` | 40px | 16px 24px | 14px |
| `lg` | 48px | 20px 32px | 16px |
| `icon` | 40px | 10px | - |

### Input Variants

- **Default**: Standard bordered input
- **Focused**: Blue ring/border
- **Error**: Red border with error message
- **Success**: Green border/checkmark
- **Disabled**: Reduced opacity, not interactive

---

## 3. Icons

Use **Lucide React** icons consistently throughout the application.

### Icon Specifications

- **Stroke Width**: 2 (default)
- **Size**: 16px inline, 20-24px buttons, 32-48px empty states
- **Color**: Inherit from parent text color

### Common Icon Mappings

| Action | Icon | Usage |
|--------|------|-------|
| Add/Create | `Plus`, `PlusCircle` | Primary creation actions |
| Edit | `Pencil`, `Edit` | Modify existing items |
| Delete | `Trash2` | Remove items |
| Archive | `Archive` | Archive items |
| Download | `Download` | Export/Download files |
| Upload | `Upload` | Import/Upload files |
| Search | `Search` | Search functionality |
| Filter | `Filter`, `SlidersHorizontal` | Filter controls |
| Calendar | `Calendar` | Dates, deadlines |
| User | `User`, `Users` | People, clients |
| Briefcase | `Briefcase` | Matters, cases |
| Document | `FileText`, `File` | Documents |
| Notification | `Bell` | Alerts, notifications |
| Settings | `Settings`, `Cog` | Configuration |
| Menu | `Menu` | Mobile navigation |
| Close | `X` | Close modals, dismiss |
| Chevron | `ChevronRight`, `ChevronDown` | Navigation, expand |
| Check | `Check`, `CheckCircle` | Success, selected |
| Warning | `AlertTriangle` | Warnings |
| Error | `AlertCircle`, `XCircle` | Errors |
| Info | `Info` | Information |

---

## 4. System States

### Loading States

1. **Skeleton Loaders**: For pages, lists, cards
   - Use `animate-pulse` with gray placeholder shapes
   - Match the expected content layout

2. **Spinners**: For quick operations (< 3 seconds)
   - Use `Loader2` icon with `animate-spin`
   - Size: 16-24px depending on context

3. **Progress Bars**: For operations with known duration
   - Show percentage for uploads/downloads
   - Animate smoothly

### Error States

- Red border/background
- Clear error message below the element
- Icon: `AlertCircle` or `XCircle`
- Suggested action when possible

### Success States

- Green border/checkmark
- Brief success message
- Icon: `CheckCircle` or `Check`
- Auto-dismiss toasts after 4-5 seconds

### Warning States

- Amber/yellow border
- Warning message with guidance
- Icon: `AlertTriangle`
- Actionable when possible

### Disabled States

- Reduced opacity (50%)
- Cursor: not-allowed
- No hover/focus effects
- ARIA: `aria-disabled="true"`

### Empty States

- Centered illustration/icon
- Clear message explaining what's missing
- Primary CTA button
- Helpful secondary text

---

## 5. Animations & Micro-Interactions

### Timing Functions

```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Duration Guidelines

| Type | Duration | Usage |
|------|----------|-------|
| Instant | 0-100ms | Micro-interactions, hover states |
| Fast | 150ms | Button clicks, checkbox toggles |
| Normal | 200-250ms | Dropdowns, modals entering |
| Slow | 300-400ms | Page transitions, complex animations |

### Standard Animations

```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide Up */
@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Scale In */
@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
```

### Hover States

- Buttons: Slight darken/lighten of background
- Cards: Subtle shadow lift
- Links: Underline or color change
- Icons: Scale to 1.1x

### Focus States

- Visible focus ring (2px, primary color)
- Offset: 2px from element
- Works on all backgrounds

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 6. Responsive Breakpoints

### Standard Breakpoints

```css
/* Mobile First */
sm: 640px   /* Small tablets, large phones */
md: 768px   /* Tablets */
lg: 1024px  /* Small laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

### Layout Adaptations

| Viewport | Sidebar | Grid Columns | Card Layout |
|----------|---------|--------------|-------------|
| < 640px | Hidden (hamburger) | 1 | Stack |
| 640-768px | Hidden (hamburger) | 2 | Stack |
| 768-1024px | Collapsible | 2-3 | Grid |
| > 1024px | Always visible | 3-4 | Grid |

### Touch Targets

- Minimum size: 44x44px
- Spacing between targets: 8px minimum
- Mobile buttons: Full width on xs screens

---

## 7. Accessibility Requirements

### Color Contrast (WCAG 2.1 AA)

- Normal text (< 18px): 4.5:1 minimum
- Large text (18px+ or 14px+ bold): 3:1 minimum
- UI components and graphics: 3:1 minimum

### Keyboard Navigation

- All interactive elements focusable
- Logical tab order
- Visible focus indicators
- Escape closes modals/dropdowns
- Enter/Space activates buttons

### Screen Reader Support

- Semantic HTML elements
- ARIA labels for icon-only buttons
- Live regions for dynamic updates
- Skip to main content link
- Proper heading hierarchy

### Motion Accessibility

- Respect `prefers-reduced-motion`
- Provide alternatives to animated content
- No auto-playing videos with sound

---

## 8. Form Guidelines

### Labels

- Always above input (not beside)
- Sentence case
- Required fields marked with `*`
- Connected with `htmlFor`

### Validation

- Real-time on blur
- Clear, specific error messages
- Success indicators for valid fields
- Don't validate until user interaction

### Help Text

- Below input in muted color
- Keep concise
- Show format requirements
- Link to additional help if needed

### Input States

1. **Default**: Gray border
2. **Hover**: Slightly darker border
3. **Focus**: Primary color ring
4. **Filled**: Same as default with value
5. **Error**: Red border + message
6. **Success**: Green border/check
7. **Disabled**: Reduced opacity

---

## 9. Toast & Notification System

### Toast Notifications

- Position: Top-right corner
- Duration: 4-5 seconds (auto-dismiss)
- Stack: Max 3 visible
- Action button when applicable

### Toast Variants

| Type | Icon | Color |
|------|------|-------|
| Success | `CheckCircle` | Green |
| Error | `XCircle` | Red |
| Warning | `AlertTriangle` | Amber |
| Info | `Info` | Blue |

### Notification Structure

```
[Icon] Title
Description text with details

[Action Button] [Dismiss]
```

---

## 10. Modal & Dialog Guidelines

### Modal Sizes

| Size | Width | Usage |
|------|-------|-------|
| `sm` | 400px | Confirmations |
| `default` | 500px | Forms |
| `lg` | 640px | Complex forms |
| `xl` | 800px | Wizards |
| `full` | 90vw | Data tables |

### Modal Behavior

- Backdrop: Semi-transparent overlay
- Close: X button, Escape key, backdrop click
- Focus trap: Tab cycles within modal
- Scroll: Modal body scrolls, not page
- Animation: Scale + fade in

---

## 11. Data Table Guidelines

### Features

- Sortable columns (click header)
- Filterable data
- Row selection (checkbox)
- Pagination for large datasets
- Row actions menu

### Responsive Behavior

| Viewport | Behavior |
|----------|----------|
| Mobile | Stack as cards or horizontal scroll |
| Tablet | Show essential columns, hide others |
| Desktop | Full table view |

### Row Actions

- Show on hover (desktop)
- Three-dot menu (mobile)
- Quick actions: Edit, Delete, Archive

---

## 12. Card Component Guidelines

### Card Structure

```
┌─────────────────────────────────┐
│ Header (optional)               │
├─────────────────────────────────┤
│                                 │
│ Content                         │
│                                 │
├─────────────────────────────────┤
│ Footer / Actions (optional)     │
└─────────────────────────────────┘
```

### Card Variants

- **Default**: White background, subtle shadow
- **Bordered**: No shadow, 1px border
- **Elevated**: Larger shadow
- **Interactive**: Hover state with lifted shadow

### Card Spacing

- Padding: 16-24px (responsive)
- Gap between cards: 16-24px
- Border radius: 12px

---

## Implementation Checklist

When implementing components, verify:

- [ ] Uses design tokens (no hardcoded values)
- [ ] Supports light and dark mode
- [ ] Meets WCAG 2.1 AA contrast requirements
- [ ] Keyboard accessible
- [ ] Has proper ARIA labels
- [ ] Responsive across all breakpoints
- [ ] Has loading, error, empty states
- [ ] Animations respect reduced-motion
- [ ] Touch targets are 44px minimum
- [ ] Focus states are visible
- [ ] Follows component variant patterns

---

## File References

- Design tokens: `/apps/web/src/index.css`
- Component library: `/apps/web/src/components/ui/`
- Tailwind config: `/apps/web/tailwind.config.js`
- UX Guidelines: `/specs/ux-guidelines.md`
- UI Components: `/specs/ui-components.md`
