import { createFileRoute } from "@tanstack/react-router";
import { Bell, Info, Shield, Sun, User } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { AboutSettings } from "@/components/settings/about-settings";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { SecuritySettings } from "@/components/settings/security-settings";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/settings/")({
  component: SettingsPage,
});

type SettingsSection =
  | "profile"
  | "appearance"
  | "notifications"
  | "security"
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
  { id: "about", label: "About", icon: Info },
];

function SettingsPage() {
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("profile");

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
      case "about":
        return <AboutSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        description="Manage your account settings and preferences"
        title="Settings"
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden w-64 border-r bg-card md:block">
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

        {/* Mobile Navigation */}
        <div className="block border-b md:hidden">
          <ScrollArea className="w-full">
            <div className="flex gap-1 p-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <button
                    className={cn(
                      "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 font-medium text-sm transition-colors",
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
          </ScrollArea>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-4xl p-6">{renderSection()}</div>
        </div>
      </div>
    </div>
  );
}
