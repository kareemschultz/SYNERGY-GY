import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Sidebar } from "@/components/layout/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import UserMenu from "@/components/user-menu";
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

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-14 items-center justify-between border-b bg-card px-6">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              Welcome back, {session.user.name}
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
