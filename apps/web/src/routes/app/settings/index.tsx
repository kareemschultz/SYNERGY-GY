import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { Archive, Bell, Calendar, Info, Shield, Sun, User } from "lucide-react";
import { z } from "zod";
import { PageHeader } from "@/components/layout/page-header";
import { AboutSettings } from "@/components/settings/about-settings";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { AvailabilitySettings } from "@/components/settings/availability-settings";
import { BackupSettings } from "@/components/settings/backup-settings";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { SecuritySettings } from "@/components/settings/security-settings";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  tab: z
    .enum([
      "profile",
      "appearance",
      "notifications",
      "security",
      "availability",
      "backup",
      "about",
    ])
    .optional()
    .catch("profile"),
  // Google Drive OAuth callback params
  google_drive_connected: z.string().optional(),
  google_drive_error: z.string().optional(),
});

export const Route = createFileRoute("/app/settings/")({
  component: SettingsPage,
  validateSearch: searchSchema,
});

type SettingsSection =
  | "profile"
  | "appearance"
  | "notifications"
  | "security"
  | "availability"
  | "backup"
  | "about";

type NavItem = {
  id: SettingsSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Sun },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "availability", label: "Availability", icon: Calendar },
  { id: "backup", label: "Backup", icon: Archive },
  { id: "about", label: "About", icon: Info },
];

function SettingsPage() {
  const search = useSearch({ from: "/app/settings/" });
  const navigate = useNavigate({ from: "/app/settings/" });
  const activeSection = (search.tab || "profile") as SettingsSection;

  const setActiveSection = (section: SettingsSection) => {
    navigate({ search: { tab: section } });
  };

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return <ProfileSettings />;
      case "appearance":
        return <AppearanceSettings />;
      case "notifications":
        return <NotificationSettings />;
      case "security":
        return <SecuritySettings />;
      case "availability":
        return <AvailabilitySettings />;
      case "backup":
        return <BackupSettings />;
      case "about":
        return <AboutSettings />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        description="Manage your account settings and preferences"
        title="Settings"
      />

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Mobile Navigation - horizontal scrollable tabs */}
        <div className="shrink-0 overflow-x-auto border-b md:hidden">
          <div className="flex gap-1 p-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  className={cn(
                    "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 font-medium text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  type="button"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop Sidebar Navigation */}
        <aside className="hidden w-64 shrink-0 border-r bg-card md:block">
          <ScrollArea className="h-full py-4">
            <nav className="space-y-1 px-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <button
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left font-medium text-sm transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    type="button"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </ScrollArea>
        </aside>

        {/* Content Area */}
        <div className="min-h-0 flex-1 overflow-auto">
          <div className="mx-auto max-w-4xl p-4 md:p-6">{renderSection()}</div>
        </div>
      </div>
    </div>
  );
}
