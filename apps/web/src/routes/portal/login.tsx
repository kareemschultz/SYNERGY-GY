import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { client as api } from "@/utils/orpc";

export const Route = createFileRoute("/portal/login")({
  component: PortalLogin,
});

function PortalLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await api.portal.auth.login({
        email,
        password,
      });

      if (result.success && result.sessionToken) {
        // Store portal session token
        localStorage.setItem("portal-session", result.sessionToken);
        localStorage.setItem("portal-user", JSON.stringify(result.user));

        // Navigate to portal dashboard
        await navigate({ to: "/portal" });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-800">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center font-bold text-2xl">
            Client Portal
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to access your matters and documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleLogin}>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                autoComplete="email"
                disabled={isLoading}
                id="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                type="email"
                value={email}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                autoComplete="current-password"
                disabled={isLoading}
                id="password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                type="password"
                value={password}
              />
            </div>

            <Button className="w-full" disabled={isLoading} type="submit">
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-muted-foreground text-sm">
          <a
            className="transition-colors hover:text-foreground"
            href="/portal/forgot-password"
          >
            Forgot your password?
          </a>
          <p className="text-center">
            Need access? Contact your case manager for an invitation.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
