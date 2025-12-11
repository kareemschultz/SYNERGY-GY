import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import { MobileSidebar, Sidebar } from "@/components/layout/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import UserMenu from "@/components/user-menu";
import { useMediaQuery } from "@/hooks/use-media-query";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/app")({
  component: AppLayout,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
    return { session: session.data };
  },
});

function AppLayout() {
  const { session } = Route.useRouteContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 640px)");

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar - Hidden on mobile */}
      {isDesktop ? (
        <Sidebar className="hidden sm:flex" />
      ) : (
        <MobileSidebar onOpenChange={setMobileMenuOpen} open={mobileMenuOpen} />
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 sm:px-6">
          <div className="flex items-center gap-2">
            {/* Hamburger Menu Button - Only visible on mobile */}
            {!isDesktop && (
              <Button
                aria-expanded={mobileMenuOpen}
                aria-label="Open navigation menu"
                className="sm:hidden"
                onClick={() => setMobileMenuOpen(true)}
                size="icon"
                variant="ghost"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}

            <span className="text-muted-foreground text-sm">
              Welcome back, {session?.user?.name ?? "User"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <UserMenu />
          </div>
        </header>

        {/* Page Content */}
        <ScrollArea className="flex-1">
          <main className="min-h-full">
            <Outlet />
          </main>
        </ScrollArea>
      </div>
    </div>
  );
}
