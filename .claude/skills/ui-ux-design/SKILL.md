---
name: ui-ux-design
description: Generate complete, modern, accessible, highly polished UI/UX specifications, component architecture, and implementation guidance using shadcn/ui and Tailwind CSS. Use when creating user interfaces, designing pages, planning layouts, implementing components, handling states, or improving user experience. Triggers on: UI, UX, design, layout, responsive, accessibility, Shadcn, Tailwind, styling, CSS, component, page, dashboard, form, navigation, theme, dark mode, animation, loading, skeleton.
---

# UI/UX Design System & Architecture

## Overview

Generate production-ready, accessible, mobile-first UI specifications for GK-Nexus using shadcn/ui components and Tailwind CSS. This skill covers layout, theming, accessibility, motion design, component patterns, responsive behaviors, and user-experience best practices.

---

## 1. Design Philosophy

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Modern** | Clean, minimal aesthetics with refined visual hierarchy |
| **Intuitive** | Predictable patterns, clear navigation, obvious actions |
| **Accessible** | WCAG AA compliant, keyboard navigable, screen-reader friendly |
| **Responsive** | Mobile-first, adapts gracefully across all viewports |
| **Polished** | Subtle animations, consistent spacing, premium feel |
| **Performant** | Fast loading, optimistic updates, perceived speed |

### Visual Style

```
- Clean, minimal UI with high visual clarity
- Cohesive layout with balanced spacing
- Strong hierarchy through size, weight, color
- Subtle micro-interactions and smooth motion
- Light + dark mode with seamless transitions
- Professional SaaS aesthetic
```

---

## 2. Design System Tokens

### Color Palette

#### Brand Colors

```css
/* CSS Custom Properties */
--primary: 221.2 83.2% 53.3%;        /* #3b82f6 - Blue */
--primary-foreground: 210 40% 98%;
--secondary: 210 40% 96.1%;
--secondary-foreground: 222.2 47.4% 11.2%;
--accent: 210 40% 96.1%;
--accent-foreground: 222.2 47.4% 11.2%;
```

#### Semantic Colors

| Purpose | Light Mode | Dark Mode | Tailwind | Usage |
|---------|------------|-----------|----------|-------|
| Success | `#10b981` | `#34d399` | `green-500` | Completed, positive, active |
| Error | `#ef4444` | `#f87171` | `red-500` | Errors, destructive, overdue |
| Warning | `#f59e0b` | `#fbbf24` | `amber-500` | Warnings, attention, pending |
| Info | `#3b82f6` | `#60a5fa` | `blue-500` | Information, links, primary |
| Muted | `#6b7280` | `#9ca3af` | `gray-500` | Disabled, subtle, secondary |

#### Background & Surface Colors

```css
/* Light Mode */
--background: 0 0% 100%;           /* White */
--foreground: 222.2 84% 4.9%;      /* Near black */
--card: 0 0% 100%;
--card-foreground: 222.2 84% 4.9%;
--muted: 210 40% 96.1%;            /* Light gray */
--muted-foreground: 215.4 16.3% 46.9%;
--border: 214.3 31.8% 91.4%;

/* Dark Mode */
--background: 222.2 84% 4.9%;      /* Near black */
--foreground: 210 40% 98%;         /* Off white */
--card: 222.2 84% 4.9%;
--card-foreground: 210 40% 98%;
--muted: 217.2 32.6% 17.5%;        /* Dark gray */
--muted-foreground: 215 20.2% 65.1%;
--border: 217.2 32.6% 17.5%;
```

#### Status Badge Colors

```tsx
const statusColors = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  draft: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400",
};
```

### Typography Scale

| Element | Size | Weight | Line Height | Tailwind |
|---------|------|--------|-------------|----------|
| Display | 48px | 700 | 1.1 | `text-5xl font-bold` |
| H1 | 36px | 600 | 1.2 | `text-4xl font-semibold` |
| H2 | 30px | 600 | 1.25 | `text-3xl font-semibold` |
| H3 | 24px | 600 | 1.3 | `text-2xl font-semibold` |
| H4 | 20px | 600 | 1.35 | `text-xl font-semibold` |
| H5 | 18px | 500 | 1.4 | `text-lg font-medium` |
| Body Large | 18px | 400 | 1.5 | `text-lg` |
| Body | 16px | 400 | 1.5 | `text-base` |
| Body Small | 14px | 400 | 1.5 | `text-sm` |
| Caption | 12px | 400 | 1.4 | `text-xs` |
| Overline | 12px | 500 | 1.4 | `text-xs font-medium uppercase tracking-wider` |

### Spacing System (8px Base)

```
space-0.5: 2px   - Micro spacing
space-1:   4px   - Tight spacing
space-1.5: 6px   - Compact
space-2:   8px   - Small gaps
space-3:   12px  - Medium gaps
space-4:   16px  - Standard spacing
space-5:   20px  - Comfortable
space-6:   24px  - Section gaps
space-8:   32px  - Large sections
space-10:  40px  - Major sections
space-12:  48px  - Page sections
space-16:  64px  - Hero sections
space-20:  80px  - Full-page sections
space-24:  96px  - Maximum spacing
```

### Border Radius

```css
--radius-none: 0;
--radius-sm: 0.375rem;   /* 6px - small elements */
--radius-md: 0.5rem;     /* 8px - buttons, inputs */
--radius-lg: 0.75rem;    /* 12px - cards */
--radius-xl: 1rem;       /* 16px - large cards, modals */
--radius-2xl: 1.5rem;    /* 24px - hero cards */
--radius-full: 9999px;   /* Pills, avatars */
```

### Shadows

```css
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
--shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
```

### Z-Index Scale

```css
--z-dropdown: 50;    /* Dropdowns, select menus */
--z-sticky: 100;     /* Sticky headers */
--z-fixed: 150;      /* Fixed elements */
--z-overlay: 200;    /* Backdrop overlays */
--z-modal: 300;      /* Modal dialogs */
--z-popover: 400;    /* Popovers, tooltips */
--z-tooltip: 500;    /* Tooltips */
--z-toast: 600;      /* Toast notifications */
```

---

## 3. Information Architecture

### App Layout Structure

```
┌────────────────────────────────────────────────────────────────┐
│ Header (sticky): Logo, Search, User Menu, Notifications        │
├──────────┬─────────────────────────────────────────────────────┤
│          │ Breadcrumbs (optional)                              │
│ Sidebar  ├─────────────────────────────────────────────────────┤
│ (fixed)  │ Page Header: Title, Description, Actions            │
│          ├─────────────────────────────────────────────────────┤
│ - Nav    │                                                     │
│ - Groups │                 Main Content                        │
│ - Footer │                                                     │
│          │ - Filters/Tabs                                      │
│          │ - Data Display (table/grid/list)                    │
│          │ - Pagination                                        │
│          │                                                     │
└──────────┴─────────────────────────────────────────────────────┘
```

### Navigation Hierarchy

```tsx
// Primary Navigation (Sidebar)
const navigation = [
  { name: "Dashboard", href: "/app", icon: LayoutDashboard },
  { name: "Clients", href: "/app/clients", icon: Users },
  { name: "Matters", href: "/app/matters", icon: Briefcase },
  { name: "Documents", href: "/app/documents", icon: FileText },
  { name: "Deadlines", href: "/app/deadlines", icon: Calendar },
  { name: "Invoices", href: "/app/invoices", icon: Receipt },
  // Divider
  { name: "Settings", href: "/app/settings", icon: Settings },
  { name: "Help", href: "/app/help", icon: HelpCircle },
];
```

### Page Structure Pattern

```tsx
function PageTemplate() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Page Title</h1>
          <p className="text-muted-foreground">Brief description</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Secondary Action</Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Primary Action
          </Button>
        </div>
      </div>

      {/* Filters/Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <SearchInput />
          <FilterDropdown />
        </div>
      </div>

      {/* Main Content */}
      <div className="rounded-lg border bg-card">
        {/* Data display */}
      </div>

      {/* Pagination */}
      <Pagination />
    </div>
  );
}
```

---

## 4. Component Library

### Button Variants

| Variant | Usage | Visual Style |
|---------|-------|--------------|
| `default` | Primary actions | Solid primary color |
| `secondary` | Alternative actions | Muted background |
| `outline` | Tertiary actions | Border only |
| `ghost` | Low-priority actions | No background |
| `destructive` | Dangerous actions | Red background |
| `link` | Navigation | Underlined text |

### Button Sizes

| Size | Height | Padding | Font | Touch Target |
|------|--------|---------|------|--------------|
| `sm` | 32px | 12px 16px | 14px | 44px (with margin) |
| `default` | 40px | 16px 24px | 14px | 44px |
| `lg` | 48px | 20px 32px | 16px | 48px |
| `icon` | 40px | 10px | - | 44px |

### Button Pattern with Loading

```tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Processing...
    </>
  ) : (
    <>
      <Check className="h-4 w-4 mr-2" />
      Confirm
    </>
  )}
</Button>
```

### Card Variants

```tsx
// Default Card
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Actions</CardFooter>
</Card>

// Interactive Card (clickable)
<Card className="cursor-pointer transition-shadow hover:shadow-md">
  ...
</Card>

// Selected Card
<Card className="border-primary ring-1 ring-primary">
  ...
</Card>

// Elevated Card
<Card className="shadow-lg">
  ...
</Card>
```

### Input States

```tsx
// Default
<Input className="border-input" />

// Focus
<Input className="border-input focus:border-primary focus:ring-1 focus:ring-primary" />

// Error
<Input className="border-destructive focus:border-destructive focus:ring-destructive" />

// Success
<Input className="border-green-500 focus:border-green-500 focus:ring-green-500" />

// Disabled
<Input className="opacity-50 cursor-not-allowed" disabled />
```

### Data Table Pattern

```tsx
<div className="rounded-lg border">
  <Table>
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        <TableHead className="w-12">
          <Checkbox />
        </TableHead>
        <TableHead>Name</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Date</TableHead>
        <TableHead className="w-12" />
      </TableRow>
    </TableHeader>
    <TableBody>
      {items.map((item) => (
        <TableRow key={item.id}>
          <TableCell>
            <Checkbox />
          </TableCell>
          <TableCell className="font-medium">{item.name}</TableCell>
          <TableCell>
            <Badge className={statusColors[item.status]}>{item.status}</Badge>
          </TableCell>
          <TableCell className="text-muted-foreground">
            {formatDate(item.date)}
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

---

## 5. State Management & Feedback

### Complete State Pattern

```tsx
function DataDisplay() {
  const { data, isLoading, error, refetch } = useQuery(...);

  // 1. Loading State
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // 2. Error State
  if (error) {
    return (
      <ErrorState
        title="Failed to load data"
        message={error.message}
        action={{ label: "Try again", onClick: refetch }}
      />
    );
  }

  // 3. Empty State
  if (!data?.length) {
    return (
      <EmptyState
        icon={Inbox}
        title="No items yet"
        description="Get started by creating your first item."
        action={{ label: "Create Item", onClick: openCreateDialog }}
      />
    );
  }

  // 4. Success State
  return <DataList items={data} />;
}
```

### Loading State Components

```tsx
// Skeleton for cards
function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  );
}

// Skeleton for table rows
function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
    </TableRow>
  );
}

// Full page skeleton
function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
```

### Error State Component

```tsx
function ErrorState({
  icon: Icon = AlertCircle,
  title = "Something went wrong",
  message,
  action,
}: {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <Card className="border-destructive/50">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-destructive/10 p-3 mb-4">
          <Icon className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {message && (
          <p className="text-muted-foreground mt-1 max-w-sm">{message}</p>
        )}
        {action && (
          <Button variant="outline" className="mt-4" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

### Empty State Component

```tsx
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground mt-1 max-w-sm">{description}</p>
        {action && (
          <Button className="mt-6" onClick={action.onClick}>
            <Plus className="h-4 w-4 mr-2" />
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

### Toast Notification Patterns

```tsx
import { toast } from "sonner";

// Success with context
toast.success("Client created", {
  description: "John Doe has been added to your clients.",
});

// Error with action
toast.error("Failed to save", {
  description: "Please check your connection and try again.",
  action: {
    label: "Retry",
    onClick: () => retry(),
  },
});

// Warning
toast.warning("Session expiring", {
  description: "Your session will expire in 5 minutes.",
  action: {
    label: "Extend",
    onClick: () => extendSession(),
  },
});

// Promise-based (loading → success/error)
toast.promise(saveData(), {
  loading: "Saving changes...",
  success: "Changes saved successfully",
  error: "Failed to save changes",
});

// Undo action
toast("Item deleted", {
  action: {
    label: "Undo",
    onClick: () => undoDelete(),
  },
  duration: 5000,
});
```

### Confirmation Dialog Pattern

```tsx
function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            className={variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Usage
<ConfirmDialog
  open={showDeleteDialog}
  onOpenChange={setShowDeleteDialog}
  title="Delete Client?"
  description="This will permanently delete this client and all associated data. This action cannot be undone."
  confirmLabel="Delete Client"
  variant="destructive"
  onConfirm={handleDelete}
/>
```

---

## 6. Interaction & Motion Design

### Animation Timing

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 100ms | ease-out | Hover, focus states |
| Fast | 150ms | ease-out | Button press, toggles |
| Normal | 200ms | ease-in-out | Dropdowns, tooltips |
| Medium | 250ms | ease-in-out | Modals, drawers |
| Slow | 300ms | ease-in-out | Page transitions |
| Deliberate | 400ms | ease-in-out | Complex animations |

### Easing Functions

```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Micro-Interactions

```tsx
// Button hover
<Button className="transition-colors duration-150 hover:bg-primary/90">

// Card hover lift
<Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">

// Icon button scale
<Button
  variant="ghost"
  size="icon"
  className="transition-transform duration-150 hover:scale-110 active:scale-95"
>

// Focus ring
<Input className="transition-shadow duration-150 focus:ring-2 focus:ring-primary/20">

// Checkbox check animation
<Checkbox className="transition-all duration-150 data-[state=checked]:bg-primary">
```

### Entry Animations

```tsx
// Fade in
<div className="animate-in fade-in duration-200">

// Slide up from bottom
<div className="animate-in slide-in-from-bottom-4 duration-300">

// Slide in from right (for drawers)
<div className="animate-in slide-in-from-right duration-300">

// Scale in (for modals)
<div className="animate-in zoom-in-95 fade-in duration-200">

// Stagger children
<div className="space-y-2">
  {items.map((item, i) => (
    <div
      key={item.id}
      className="animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${i * 50}ms` }}
    >
      ...
    </div>
  ))}
</div>
```

### Exit Animations

```tsx
// Fade out
<div className="animate-out fade-out duration-150">

// Slide out
<div className="animate-out slide-out-to-right duration-200">

// Scale out
<div className="animate-out zoom-out-95 fade-out duration-150">
```

### Loading Animations

```tsx
// Spinner
<Loader2 className="h-4 w-4 animate-spin" />

// Pulse (for skeletons)
<div className="animate-pulse bg-muted rounded" />

// Shimmer effect
<div className="relative overflow-hidden bg-muted rounded">
  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
</div>

// Progress bar
<div className="h-1 bg-muted rounded-full overflow-hidden">
  <div
    className="h-full bg-primary transition-all duration-300 ease-out"
    style={{ width: `${progress}%` }}
  />
</div>
```

### Reduced Motion Support

```tsx
// Use motion-safe and motion-reduce
<div className="motion-safe:animate-in motion-safe:fade-in motion-reduce:opacity-100">

// CSS media query
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

// Hook for programmatic control
function useReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(query.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
}
```

---

## 7. Form Experience

### Form Layout Pattern

```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
    {/* Form sections */}
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Personal Information</h3>

      {/* Two-column layout on larger screens */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField ... />
        <FormField ... />
      </div>

      {/* Full-width field */}
      <FormField ... />
    </div>

    <Separator />

    {/* Another section */}
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Contact Details</h3>
      ...
    </div>

    {/* Form actions */}
    <div className="flex gap-2 justify-end pt-4">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Changes"
        )}
      </Button>
    </div>
  </form>
</Form>
```

### Field Components

```tsx
// Text Input with all states
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>
        Email <span className="text-destructive">*</span>
      </FormLabel>
      <FormControl>
        <div className="relative">
          <Input
            type="email"
            placeholder="you@example.com"
            {...field}
          />
          {/* Success indicator */}
          {field.value && !form.formState.errors.email && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
          )}
        </div>
      </FormControl>
      <FormDescription>
        We'll never share your email with anyone.
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>

// Select with search
<FormField
  control={form.control}
  name="client"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Client</FormLabel>
      <FormControl>
        <Combobox
          options={clients}
          value={field.value}
          onValueChange={field.onChange}
          placeholder="Select a client..."
          searchPlaceholder="Search clients..."
          emptyText="No clients found."
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

// Date picker
<FormField
  control={form.control}
  name="dueDate"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Due Date</FormLabel>
      <FormControl>
        <DatePicker
          date={field.value}
          onDateChange={field.onChange}
          placeholder="Pick a date"
        />
      </FormControl>
      <FormDescription>
        Select when this task is due.
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Real-Time Validation

```tsx
// Zod schema with custom messages
const formSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  phone: z
    .string()
    .regex(/^592-\d{3}-\d{4}$/, "Phone must be in format: 592-XXX-XXXX"),
});

// Password strength indicator
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "One uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "One number", valid: /[0-9]/.test(password) },
    { label: "One special character", valid: /[!@#$%^&*]/.test(password) },
  ];

  return (
    <div className="space-y-2 mt-2">
      {checks.map((check) => (
        <div key={check.label} className="flex items-center gap-2 text-sm">
          {check.valid ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <X className="h-3 w-3 text-muted-foreground" />
          )}
          <span className={check.valid ? "text-green-600" : "text-muted-foreground"}>
            {check.label}
          </span>
        </div>
      ))}
    </div>
  );
}
```

### Smart Defaults

```tsx
// Pre-fill based on context
const form = useForm({
  defaultValues: {
    // Default to user's business
    business: currentUser.primaryBusiness,
    // Default deadline to tomorrow
    dueDate: addDays(new Date(), 1),
    // Default status
    status: "ACTIVE",
    // Pre-fill from related entity
    clientId: selectedClient?.id,
  },
});

// Remember user preferences
useEffect(() => {
  const savedFilters = localStorage.getItem("clientFilters");
  if (savedFilters) {
    form.reset(JSON.parse(savedFilters));
  }
}, []);
```

### Error Recovery

```tsx
// Form-level error display
{form.formState.errors.root && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>
      {form.formState.errors.root.message}
    </AlertDescription>
  </Alert>
)}

// Inline field errors with context
<FormMessage>
  {form.formState.errors.email?.message}
  {form.formState.errors.email?.type === "validate" && (
    <Button
      type="button"
      variant="link"
      className="h-auto p-0 ml-1"
      onClick={() => checkEmailAvailability(form.getValues("email"))}
    >
      Check availability
    </Button>
  )}
</FormMessage>

// Save draft functionality
const saveDraft = useDebouncedCallback(() => {
  localStorage.setItem("formDraft", JSON.stringify(form.getValues()));
  toast.info("Draft saved");
}, 2000);

// Restore draft
const restoreDraft = () => {
  const draft = localStorage.getItem("formDraft");
  if (draft) {
    form.reset(JSON.parse(draft));
    toast.success("Draft restored");
  }
};
```

---

## 8. Accessibility (WCAG 2.1 AA/AAA)

### Color Contrast Requirements

| Content Type | Minimum Ratio | Target Ratio |
|--------------|---------------|--------------|
| Normal text (< 18px) | 4.5:1 | 7:1 (AAA) |
| Large text (≥ 18px or ≥ 14px bold) | 3:1 | 4.5:1 (AAA) |
| UI components | 3:1 | 4.5:1 |
| Graphical objects | 3:1 | 4.5:1 |
| Focus indicators | 3:1 | 4.5:1 |

### Keyboard Navigation

```tsx
// Skip to main content
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:ring-2 focus:ring-primary focus:rounded"
>
  Skip to main content
</a>

// Focus trap in modals
<Dialog>
  <DialogContent>
    <FocusTrap>
      {/* Modal content */}
    </FocusTrap>
  </DialogContent>
</Dialog>

// Keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Cmd/Ctrl + K for search
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      openSearch();
    }
    // Escape to close
    if (e.key === "Escape") {
      closeDialog();
    }
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, []);
```

### ARIA Patterns

```tsx
// Live region for dynamic updates
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {notification}
</div>

// Loading state announcement
<div aria-busy={isLoading} aria-describedby="loading-message">
  {isLoading && (
    <span id="loading-message" className="sr-only">
      Loading data, please wait...
    </span>
  )}
  {content}
</div>

// Form error summary
<div role="alert" aria-labelledby="error-summary">
  <h2 id="error-summary">Please fix the following errors:</h2>
  <ul>
    {Object.entries(errors).map(([field, error]) => (
      <li key={field}>
        <a href={`#${field}`}>{error.message}</a>
      </li>
    ))}
  </ul>
</div>

// Icon button with label
<Button variant="ghost" size="icon" aria-label="Delete item">
  <Trash2 className="h-4 w-4" aria-hidden="true" />
</Button>

// Expandable section
<div>
  <Button
    aria-expanded={isExpanded}
    aria-controls="details-panel"
    onClick={() => setIsExpanded(!isExpanded)}
  >
    {isExpanded ? "Hide" : "Show"} Details
    <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
  </Button>
  <div id="details-panel" hidden={!isExpanded}>
    {/* Content */}
  </div>
</div>

// Tab panel
<Tabs>
  <TabsList role="tablist" aria-label="Account settings">
    <TabsTrigger role="tab" aria-selected={activeTab === "profile"}>
      Profile
    </TabsTrigger>
    <TabsTrigger role="tab" aria-selected={activeTab === "security"}>
      Security
    </TabsTrigger>
  </TabsList>
  <TabsContent role="tabpanel" aria-labelledby="profile-tab">
    {/* Profile content */}
  </TabsContent>
</Tabs>
```

### Screen Reader Announcements

```tsx
// Status updates
function useAnnounce() {
  const [message, setMessage] = useState("");

  const announce = useCallback((text: string, priority: "polite" | "assertive" = "polite") => {
    setMessage(text);
    setTimeout(() => setMessage(""), 1000);
  }, []);

  return {
    announce,
    Announcer: () => (
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {message}
      </div>
    ),
  };
}

// Usage
const { announce, Announcer } = useAnnounce();

// In component
<Announcer />

// When data loads
useEffect(() => {
  if (data) {
    announce(`Loaded ${data.length} items`);
  }
}, [data]);
```

### Focus Management

```tsx
// Return focus after modal closes
function useReturnFocus() {
  const triggerRef = useRef<HTMLElement | null>(null);

  const saveTrigger = useCallback(() => {
    triggerRef.current = document.activeElement as HTMLElement;
  }, []);

  const returnFocus = useCallback(() => {
    triggerRef.current?.focus();
  }, []);

  return { saveTrigger, returnFocus };
}

// Auto-focus first error
function useAutoFocusError(errors: Record<string, unknown>) {
  useEffect(() => {
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      document.getElementById(firstErrorField)?.focus();
    }
  }, [errors]);
}

// Focus new item after creation
function useAutoFocusNew(items: Item[]) {
  const prevLength = useRef(items.length);

  useEffect(() => {
    if (items.length > prevLength.current) {
      const newItem = document.querySelector(`[data-item-id="${items[items.length - 1].id}"]`);
      (newItem as HTMLElement)?.focus();
    }
    prevLength.current = items.length;
  }, [items]);
}
```

---

## 9. Responsive Design

### Breakpoint Strategy

```
Mobile-first approach:
  Base styles → Mobile (< 640px)
  sm: → Small tablets (640px)
  md: → Tablets (768px)
  lg: → Laptops (1024px)
  xl: → Desktops (1280px)
  2xl: → Large screens (1536px)
```

### Layout Adaptations

| Viewport | Sidebar | Grid | Navigation | Touch |
|----------|---------|------|------------|-------|
| < 640px | Hidden (hamburger) | 1 col | Bottom nav | 44px targets |
| 640-768px | Collapsible | 2 col | Side nav | 44px targets |
| 768-1024px | Collapsible | 2-3 col | Side nav | Standard |
| > 1024px | Always visible | 3-4 col | Side nav | Standard |

### Mobile Navigation Pattern

```tsx
function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Hamburger button (mobile only) */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
        aria-expanded={isOpen}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile sidebar overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          isOpen ? "block" : "hidden"
        )}
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />

        {/* Sidebar */}
        <nav
          className={cn(
            "fixed inset-y-0 left-0 w-72 bg-background border-r p-6",
            "transform transition-transform duration-300 ease-out",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex justify-between items-center mb-6">
            <Logo />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <NavigationLinks onNavigate={() => setIsOpen(false)} />
        </nav>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 border-r">
        <nav className="flex flex-col flex-1 p-6">
          <Logo />
          <NavigationLinks />
        </nav>
      </aside>
    </>
  );
}
```

### Responsive Grid Patterns

```tsx
// Auto-fit grid (responsive without breakpoints)
<div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>

// Explicit breakpoint grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
  {items.map(item => <Card key={item.id} />)}
</div>

// Dashboard grid
<div className="grid gap-4 md:gap-6">
  {/* Stats row */}
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard />
    <StatCard />
    <StatCard />
    <StatCard />
  </div>

  {/* Main content + sidebar */}
  <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
    <div className="lg:col-span-2">
      <MainContent />
    </div>
    <div>
      <Sidebar />
    </div>
  </div>
</div>
```

### Responsive Tables

```tsx
// Option 1: Horizontal scroll
<div className="overflow-x-auto -mx-4 sm:mx-0">
  <div className="inline-block min-w-full align-middle">
    <Table>...</Table>
  </div>
</div>

// Option 2: Stack as cards on mobile
<div className="hidden md:block">
  <Table>...</Table>
</div>
<div className="md:hidden space-y-4">
  {items.map(item => (
    <Card key={item.id}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground">{item.email}</p>
          </div>
          <Badge>{item.status}</Badge>
        </div>
      </CardContent>
    </Card>
  ))}
</div>

// Option 3: Collapsible rows
<Table>
  <TableBody>
    {items.map(item => (
      <Collapsible key={item.id} asChild>
        <>
          <TableRow>
            <TableCell className="md:hidden">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
            </TableCell>
            <TableCell>{item.name}</TableCell>
            <TableCell className="hidden md:table-cell">{item.email}</TableCell>
            <TableCell className="hidden md:table-cell">{item.phone}</TableCell>
          </TableRow>
          <CollapsibleContent asChild>
            <TableRow className="md:hidden bg-muted/50">
              <TableCell colSpan={2}>
                <div className="py-2 space-y-1">
                  <p><strong>Email:</strong> {item.email}</p>
                  <p><strong>Phone:</strong> {item.phone}</p>
                </div>
              </TableCell>
            </TableRow>
          </CollapsibleContent>
        </>
      </Collapsible>
    ))}
  </TableBody>
</Table>
```

---

## 10. Performance & Perceived Speed

### Loading Strategies

```tsx
// 1. Skeleton screens (perceived faster)
function DataList() {
  const { data, isLoading } = useQuery(...);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return <ActualList data={data} />;
}

// 2. Optimistic updates
const mutation = useMutation({
  mutationFn: updateItem,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ["items"] });

    // Snapshot current state
    const previous = queryClient.getQueryData(["items"]);

    // Optimistically update
    queryClient.setQueryData(["items"], (old) =>
      old.map((item) => (item.id === newData.id ? { ...item, ...newData } : item))
    );

    return { previous };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(["items"], context.previous);
    toast.error("Failed to update");
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["items"] });
  },
});

// 3. Prefetching on hover
function ItemLink({ item }: { item: Item }) {
  const queryClient = useQueryClient();

  const prefetch = () => {
    queryClient.prefetchQuery({
      queryKey: ["item", item.id],
      queryFn: () => fetchItem(item.id),
      staleTime: 60000,
    });
  };

  return (
    <Link
      to={`/items/${item.id}`}
      onMouseEnter={prefetch}
      onFocus={prefetch}
    >
      {item.name}
    </Link>
  );
}
```

### Lazy Loading

```tsx
// Lazy load heavy components
const HeavyChart = lazy(() => import("./HeavyChart"));

function Dashboard() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <HeavyChart />
    </Suspense>
  );
}

// Lazy load below fold content
function useLazyLoad() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

// Usage
function LazySection() {
  const { ref, isVisible } = useLazyLoad();

  return (
    <div ref={ref}>
      {isVisible ? <HeavyContent /> : <Skeleton className="h-64" />}
    </div>
  );
}
```

### Avoid Layout Shift

```tsx
// Reserve space for images
<div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
  <img
    src={image}
    alt={alt}
    className="absolute inset-0 w-full h-full object-cover"
    loading="lazy"
  />
</div>

// Reserve space for dynamic content
<div className="min-h-[200px]">
  {isLoading ? <Skeleton className="h-[200px]" /> : <Content />}
</div>

// Fixed dimensions for avatars
<Avatar className="h-10 w-10">
  <AvatarImage src={user.avatar} />
  <AvatarFallback>{user.initials}</AvatarFallback>
</Avatar>
```

### Virtualization for Long Lists

```tsx
import { useVirtualizer } from "@tanstack/react-virtual";

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-[400px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ItemRow item={items[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 11. Icons (Lucide React)

### Icon Sizes

| Context | Size | Class |
|---------|------|-------|
| Inline text | 14px | `h-3.5 w-3.5` |
| Button icon | 16px | `h-4 w-4` |
| Icon button | 20px | `h-5 w-5` |
| Feature icon | 24px | `h-6 w-6` |
| Empty state | 48px | `h-12 w-12` |
| Hero icon | 64px | `h-16 w-16` |

### Complete Icon Mapping

| Category | Icons |
|----------|-------|
| **Actions** | Plus, Pencil, Trash2, Copy, Download, Upload, Share, Send, Archive, RotateCcw |
| **Navigation** | ChevronRight, ChevronDown, ChevronLeft, ChevronUp, ArrowLeft, ArrowRight, ExternalLink, Menu, X |
| **Status** | Check, CheckCircle, X, XCircle, AlertCircle, AlertTriangle, Info, HelpCircle |
| **Objects** | User, Users, Briefcase, FileText, Folder, Calendar, Clock, Mail, Phone, Building |
| **UI** | Search, Filter, SlidersHorizontal, Settings, MoreHorizontal, MoreVertical, Eye, EyeOff |
| **Feedback** | Loader2, RefreshCw, Bell, BellOff, ThumbsUp, ThumbsDown, Star, Heart |

### Icon Usage Patterns

```tsx
// With text
<Button>
  <Plus className="h-4 w-4 mr-2" />
  Add Item
</Button>

// Icon only (requires aria-label)
<Button variant="ghost" size="icon" aria-label="Edit">
  <Pencil className="h-4 w-4" />
</Button>

// In badges
<Badge>
  <CheckCircle className="h-3 w-3 mr-1" />
  Active
</Badge>

// Status indicators
<span className="flex items-center gap-1.5 text-green-600">
  <CheckCircle className="h-4 w-4" />
  Completed
</span>

// Loading state
<Button disabled>
  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
  Loading...
</Button>
```

---

## 12. Dark Mode Implementation

### Theme Toggle

```tsx
function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="h-4 w-4 mr-2" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="h-4 w-4 mr-2" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="h-4 w-4 mr-2" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Dark Mode Color Patterns

```tsx
// Background variations
<div className="bg-white dark:bg-gray-950">
<div className="bg-gray-50 dark:bg-gray-900">
<div className="bg-gray-100 dark:bg-gray-800">

// Text variations
<p className="text-gray-900 dark:text-gray-100">
<p className="text-gray-600 dark:text-gray-400">
<p className="text-gray-500 dark:text-gray-500">

// Border variations
<div className="border-gray-200 dark:border-gray-800">
<div className="border-gray-300 dark:border-gray-700">

// Status colors that work in both modes
<Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
<Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
```

---

## Critical Implementation Checklist

### Every Component Must Have:

- [ ] Loading state (skeleton or spinner)
- [ ] Error state with retry option
- [ ] Empty state with call-to-action
- [ ] Keyboard accessibility
- [ ] Focus indicators
- [ ] ARIA labels for non-text elements
- [ ] Touch targets ≥ 44px
- [ ] Responsive layout (mobile-first)
- [ ] Dark mode support
- [ ] Reduced motion support

### Every Page Must Have:

- [ ] Clear page title and description
- [ ] Breadcrumb navigation (if nested)
- [ ] Primary action button
- [ ] Search/filter capability (if list)
- [ ] Pagination (if > 20 items)
- [ ] Skip to main content link
- [ ] Proper heading hierarchy
- [ ] Meta title for browser tab

### Every Form Must Have:

- [ ] Clear labels above inputs
- [ ] Required field indicators (*)
- [ ] Helper text for complex fields
- [ ] Real-time validation on blur
- [ ] Clear error messages
- [ ] Success indicators
- [ ] Submit button with loading state
- [ ] Cancel/reset option
- [ ] Keyboard navigation (Tab, Enter)

### Performance Must Include:

- [ ] Skeleton loading states
- [ ] Optimistic updates where appropriate
- [ ] Prefetching on hover/focus
- [ ] Lazy loading for heavy components
- [ ] Reserved space to prevent layout shift
- [ ] Virtualization for long lists (> 100 items)

---

## NO MOCK DATA POLICY

**CRITICAL**: Never use mock data, placeholder content, or fake records.

- All UI must work with real, user-created data
- Empty states are mandatory for zero-data scenarios
- Test with actual user flows, not seeded data
- This ensures data integrity and production readiness
