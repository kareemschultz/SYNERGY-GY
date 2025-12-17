import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
  component: RootRedirect,
});

function RootRedirect() {
  const [_isChecking, _setIsChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await authClient.getSession();

        if (session?.data?.user) {
          // User is authenticated, redirect to app
          window.location.href = "/app";
        } else {
          // No session, redirect to login
          window.location.href = "/login";
        }
      } catch (error) {
        // Error checking auth, default to login
        console.error("Auth check failed:", error);
        window.location.href = "/login";
      }
    }

    checkAuth();
  }, []);

  // Show loading state while checking auth
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Loading application...</p>
      </div>
    </div>
  );
}
