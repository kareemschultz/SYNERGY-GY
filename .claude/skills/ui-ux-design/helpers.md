# UI/UX Helper Utilities & Patterns

Supplementary patterns, animations, hooks, and utility functions for the UI/UX design system.

---

## Animation Keyframes (Add to CSS)

```css
/* Add to apps/web/src/index.css */

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

@keyframes bounce-in {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes slide-up-fade {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-ring {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
}

@keyframes typewriter {
  from { width: 0; }
  to { width: 100%; }
}

@keyframes blink-cursor {
  0%, 100% { border-color: transparent; }
  50% { border-color: currentColor; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes success-checkmark {
  0% { stroke-dashoffset: 50; }
  100% { stroke-dashoffset: 0; }
}

/* Utility classes */
.animate-shimmer {
  animation: shimmer 2s infinite;
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}

.animate-bounce-in {
  animation: bounce-in 0.5s ease-out;
}

.animate-slide-up-fade {
  animation: slide-up-fade 0.3s ease-out;
}

.animate-pulse-ring {
  animation: pulse-ring 1.5s infinite;
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
```

---

## Custom Hooks

### useDebounce

```tsx
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage
const [search, setSearch] = useState("");
const debouncedSearch = useDebounce(search, 300);

useEffect(() => {
  // Only triggers after 300ms of no input
  fetchResults(debouncedSearch);
}, [debouncedSearch]);
```

### useMediaQuery

```tsx
import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

// Usage
const isMobile = useMediaQuery("(max-width: 640px)");
const isTablet = useMediaQuery("(max-width: 1024px)");
const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
```

### useLocalStorage

```tsx
import { useState, useEffect } from "react";

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  return [storedValue, setValue];
}

// Usage
const [filters, setFilters] = useLocalStorage("clientFilters", { status: "all" });
```

### useClickOutside

```tsx
import { useEffect, useRef } from "react";

export function useClickOutside<T extends HTMLElement>(
  handler: () => void
): React.RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [handler]);

  return ref;
}

// Usage
const dropdownRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false));
return <div ref={dropdownRef}>...</div>;
```

### useCopyToClipboard

```tsx
import { useState, useCallback } from "react";
import { toast } from "sonner";

export function useCopyToClipboard(): {
  copy: (text: string) => Promise<boolean>;
  copied: boolean;
} {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      toast.error("Failed to copy");
      return false;
    }
  }, []);

  return { copy, copied };
}

// Usage
const { copy, copied } = useCopyToClipboard();
<Button onClick={() => copy(item.id)}>
  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
</Button>
```

### useIntersectionObserver

```tsx
import { useEffect, useRef, useState } from "react";

interface UseIntersectionOptions {
  threshold?: number;
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionOptions = {}
): { ref: React.RefObject<HTMLDivElement>; isVisible: boolean } {
  const { threshold = 0, root = null, rootMargin = "0px", freezeOnceVisible = false } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);
        if (visible && freezeOnceVisible) {
          observer.disconnect();
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, root, rootMargin, freezeOnceVisible]);

  return { ref, isVisible };
}

// Usage - Lazy load content when visible
const { ref, isVisible } = useIntersectionObserver({ freezeOnceVisible: true });
<div ref={ref}>
  {isVisible ? <HeavyComponent /> : <Skeleton />}
</div>
```

### useKeyboardShortcut

```tsx
import { useEffect, useCallback } from "react";

type KeyCombo = {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
};

export function useKeyboardShortcut(
  keyCombo: KeyCombo,
  callback: () => void,
  deps: React.DependencyList = []
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { key, ctrl, alt, shift, meta } = keyCombo;

      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        !!event.ctrlKey === !!ctrl &&
        !!event.altKey === !!alt &&
        !!event.shiftKey === !!shift &&
        !!event.metaKey === !!meta
      ) {
        event.preventDefault();
        callback();
      }
    },
    [keyCombo, callback, ...deps]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// Usage
useKeyboardShortcut({ key: "k", meta: true }, () => setSearchOpen(true));
useKeyboardShortcut({ key: "Escape" }, () => setDialogOpen(false));
useKeyboardShortcut({ key: "s", ctrl: true }, () => saveDocument());
```

---

## Utility Functions

### cn (Class Name Merger)

```tsx
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Usage
<div className={cn(
  "base-class",
  isActive && "active-class",
  variant === "primary" ? "bg-blue-500" : "bg-gray-500"
)} />
```

### formatDate

```tsx
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  }).format(d);
}

// Variants
export const formatDateTime = (date: Date | string) =>
  formatDate(date, { hour: "2-digit", minute: "2-digit" });

export const formatRelative = (date: Date | string): string => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(date);
};
```

### formatCurrency

```tsx
export function formatCurrency(
  amount: number,
  currency: string = "GYD"
): string {
  return new Intl.NumberFormat("en-GY", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

// Usage
formatCurrency(1500000) // "$1,500,000.00"
```

### truncate

```tsx
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

// Usage
<p>{truncate(description, 100)}</p>
```

### slugify

```tsx
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Usage
slugify("Hello World!") // "hello-world"
```

### getInitials

```tsx
export function getInitials(name: string, maxLength: number = 2): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, maxLength);
}

// Usage
getInitials("John Doe") // "JD"
getInitials("Green Crescent Management") // "GC"
```

---

## Ready-to-Use Components

### Shimmer Skeleton

```tsx
function ShimmerSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-muted rounded", className)}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}
```

### Avatar with Status

```tsx
function AvatarWithStatus({
  src,
  name,
  status,
}: {
  src?: string;
  name: string;
  status?: "online" | "offline" | "away" | "busy";
}) {
  const statusColors = {
    online: "bg-green-500",
    offline: "bg-gray-400",
    away: "bg-yellow-500",
    busy: "bg-red-500",
  };

  return (
    <div className="relative">
      <Avatar className="h-10 w-10">
        <AvatarImage src={src} alt={name} />
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
      </Avatar>
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
            statusColors[status]
          )}
        />
      )}
    </div>
  );
}
```

### Progress Steps

```tsx
interface Step {
  id: string;
  title: string;
  description?: string;
}

function ProgressSteps({
  steps,
  currentStep,
}: {
  steps: Step[];
  currentStep: number;
}) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={cn(
              "relative",
              index !== steps.length - 1 && "pr-8 sm:pr-20"
            )}
          >
            <div className="flex items-center">
              <div
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-full",
                  index < currentStep
                    ? "bg-primary text-primary-foreground"
                    : index === currentStep
                    ? "border-2 border-primary bg-background"
                    : "border-2 border-muted bg-background"
                )}
              >
                {index < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-sm">{index + 1}</span>
                )}
              </div>
              {index !== steps.length - 1 && (
                <div
                  className={cn(
                    "absolute left-8 top-4 -ml-px h-0.5 w-full sm:w-20",
                    index < currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
            <div className="mt-2">
              <span
                className={cn(
                  "text-sm font-medium",
                  index <= currentStep ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
              {step.description && (
                <p className="text-xs text-muted-foreground">{step.description}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

### Copy Button

```tsx
function CopyButton({ text }: { text: string }) {
  const { copy, copied } = useCopyToClipboard();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => copy(text)}
      className="h-8 w-8"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}
```

### File Upload Zone

```tsx
function FileUploadZone({
  onFilesSelected,
  accept,
  maxFiles = 5,
}: {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).slice(0, maxFiles);
    onFilesSelected(files);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={maxFiles > 1}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            onFilesSelected(Array.from(e.target.files).slice(0, maxFiles));
          }
        }}
      />
      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
      <p className="text-sm font-medium">
        Drop files here or click to upload
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Up to {maxFiles} files
      </p>
    </div>
  );
}
```

### Stat Card

```tsx
function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="rounded-full bg-primary/10 p-2">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          {change && (
            <span
              className={cn(
                "text-sm font-medium flex items-center gap-1",
                trend === "up" && "text-green-600",
                trend === "down" && "text-red-600",
                trend === "neutral" && "text-muted-foreground"
              )}
            >
              {trend === "up" && <TrendingUp className="h-4 w-4" />}
              {trend === "down" && <TrendingDown className="h-4 w-4" />}
              {change}
            </span>
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Usage
<StatCard
  title="Total Clients"
  value={245}
  change="+12%"
  icon={Users}
  trend="up"
/>
```

### Countdown Timer

```tsx
function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const diff = targetDate.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex gap-4">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="text-center">
          <div className="text-2xl font-bold tabular-nums">
            {String(value).padStart(2, "0")}
          </div>
          <div className="text-xs text-muted-foreground uppercase">{unit}</div>
        </div>
      ))}
    </div>
  );
}
```

### Keyboard Shortcut Hint

```tsx
function KeyboardShortcut({ keys }: { keys: string[] }) {
  return (
    <span className="hidden sm:flex items-center gap-1">
      {keys.map((key, i) => (
        <kbd
          key={i}
          className="px-1.5 py-0.5 text-xs font-medium bg-muted rounded border"
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}

// Usage
<KeyboardShortcut keys={["⌘", "K"]} />
<KeyboardShortcut keys={["Ctrl", "S"]} />
```

### Command Palette Trigger

```tsx
function SearchButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      className="w-full justify-start text-muted-foreground"
      onClick={onClick}
    >
      <Search className="h-4 w-4 mr-2" />
      <span className="hidden sm:inline-flex flex-1">Search...</span>
      <KeyboardShortcut keys={["⌘", "K"]} />
    </Button>
  );
}
```

---

## Icon Sets by Context

### Navigation Icons

```tsx
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Calendar,
  Receipt,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
} from "lucide-react";
```

### Action Icons

```tsx
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  Download,
  Upload,
  Share,
  Send,
  Archive,
  RotateCcw,
  Save,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  RefreshCw,
} from "lucide-react";
```

### Status Icons

```tsx
import {
  Check,
  CheckCircle,
  CheckCircle2,
  X,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  Clock,
  Timer,
  Hourglass,
} from "lucide-react";
```

### Communication Icons

```tsx
import {
  Mail,
  Phone,
  MessageSquare,
  MessageCircle,
  AtSign,
  Send,
  Inbox,
  Bell,
  BellOff,
} from "lucide-react";
```

### Document Icons

```tsx
import {
  File,
  FileText,
  FileImage,
  FilePdf,
  FileSpreadsheet,
  Folder,
  FolderOpen,
  FolderPlus,
  Paperclip,
  Link,
} from "lucide-react";
```

### Finance Icons

```tsx
import {
  DollarSign,
  CreditCard,
  Wallet,
  Receipt,
  Calculator,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  BarChart,
  PieChart,
} from "lucide-react";
```

---

## Accessibility Utilities

### Screen Reader Only Text

```tsx
function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

// Usage
<Button>
  <Trash2 className="h-4 w-4" />
  <ScreenReaderOnly>Delete item</ScreenReaderOnly>
</Button>
```

### Focus Visible Ring

```tsx
// Add to components that need focus indicators
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

<Button className={cn(focusRing, "...")}>
```

### Skip Link

```tsx
function SkipLink({ href = "#main-content" }: { href?: string }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded focus:ring-2 focus:ring-ring"
    >
      Skip to main content
    </a>
  );
}
```

---

## Performance Utilities

### Debounced Callback

```tsx
import { useMemo, useRef, useEffect, useCallback } from "react";

export function useDebouncedCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;
}

// Usage
const debouncedSearch = useDebouncedCallback((query: string) => {
  fetchResults(query);
}, 300);
```

### Throttled Callback

```tsx
export function useThrottledCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T {
  const lastRan = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRan = now - lastRan.current;

      if (timeSinceLastRan >= delay) {
        callback(...args);
        lastRan.current = now;
      } else {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRan.current = Date.now();
        }, delay - timeSinceLastRan);
      }
    },
    [callback, delay]
  ) as T;
}

// Usage - for scroll handlers
const throttledScroll = useThrottledCallback(() => {
  updateScrollPosition();
}, 100);
```

---

## Color Utilities

### Status Color Getter

```tsx
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    archived: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
    draft: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    confirmed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    requested: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  };

  return colors[status.toLowerCase()] || colors.draft;
}

// Usage
<Badge className={getStatusColor(item.status)}>{item.status}</Badge>
```

### Priority Color Getter

```tsx
export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    urgent: "text-red-600 dark:text-red-400",
    high: "text-orange-600 dark:text-orange-400",
    medium: "text-yellow-600 dark:text-yellow-400",
    low: "text-green-600 dark:text-green-400",
  };

  return colors[priority.toLowerCase()] || "text-muted-foreground";
}
```

---

This helpers file provides additional utilities, hooks, and components that complement the main UI/UX skill. Copy and adapt these patterns as needed.
