import { Link, useLocation } from "@tanstack/react-router";
import {
  Building2,
  Calendar,
  FileText,
  FolderOpen,
  Home,
  Settings,
  Users,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/app",
    icon: Home,
  },
  {
    title: "Clients",
    href: "/app/clients",
    icon: Users,
  },
  {
    title: "Matters",
    href: "/app/matters",
    icon: FolderOpen,
  },
  {
    title: "Documents",
    href: "/app/documents",
    icon: FileText,
  },
  {
    title: "Calendar",
    href: "/app/calendar",
    icon: Calendar,
  },
];

const settingsNavItems: NavItem[] = [
  {
    title: "Settings",
    href: "/app/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/app") {
      return location.pathname === "/app";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div
      className={cn("flex h-full w-64 flex-col border-r bg-card", className)}
    >
      {/* Logo/Brand */}
      <div className="flex h-14 items-center border-b px-4">
        <Link className="flex items-center gap-2" to="/app">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">GK-Nexus</span>
        </Link>
      </div>

      {/* Business Indicator */}
      <div className="border-b px-4 py-2">
        <div className="flex gap-1">
          <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600 text-xs">
            GCMC
          </span>
          <span className="rounded bg-blue-500/10 px-2 py-0.5 font-medium text-blue-600 text-xs">
            KAJ
          </span>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                key={item.href}
                to={item.href}
              >
                <Icon className="h-4 w-4" />
                {item.title}
                {item.badge && (
                  <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1">
          {settingsNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                key={item.href}
                to={item.href}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="text-muted-foreground text-xs">
          <p>Green Crescent Management</p>
          <p>KAJ Financial Services</p>
        </div>
      </div>
    </div>
  );
}
