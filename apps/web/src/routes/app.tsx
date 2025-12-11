import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import { MobileSidebar, Sidebar } from "@/components/layout/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import UserMenu from "@/components/user-menu";
import { useMediaQuery } from "@/hooks/use-media-query";
import { authClient } from "@/lib/auth-client";
import { client } from "@/utils/orpc";

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

  // Check if user has staff profile
  const { data: staffStatus, isLoading: staffLoading } = useQuery({
    queryKey: ["staffStatus"],
    queryFn: () => client.settings.getStaffStatus(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Show loading state while checking staff status
  if (staffLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show "Access Pending" message if user doesn't have a staff profile
  if (!staffStatus?.hasStaffProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-800">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Pending</CardTitle>
            <CardDescription>
              Your account is not yet configured for staff access.
              <br />
              Please contact an administrator to complete your setup.
            </CardDescription>
            <div className="mt-4 pt-4">
              <Button
                onClick={async () => {
                  await authClient.signOut();
                  window.location.href = "/login";
                }}
                variant="outline"
              >
                Sign Out
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show "Account Deactivated" if staff profile exists but is inactive
  if (!staffStatus?.isActive) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-800">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Account Deactivated</CardTitle>
            <CardDescription>
              Your staff account has been deactivated.
              <br />
              Please contact an administrator if you believe this is an error.
            </CardDescription>
            <div className="mt-4 pt-4">
              <Button
                onClick={async () => {
                  await authClient.signOut();
                  window.location.href = "/login";
                }}
                variant="outline"
              >
                Sign Out
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

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
