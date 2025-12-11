import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { client as api } from "@/utils/orpc";

export const Route = createFileRoute("/portal/register")({
  component: PortalRegister,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || "",
  }),
});

function PortalRegister() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();

  const [inviteData, setInviteData] = useState<{
    email: string;
    clientName: string;
  } | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    async function verifyInvite() {
      if (!token) {
        setError("No invitation token provided");
        setIsVerifying(false);
        return;
      }

      try {
        const result = await api.portal.invite.verify({ token });
        setInviteData({
          email: result.email,
          clientName: result.clientName || "Client",
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Invalid or expired invitation link"
        );
      } finally {
        setIsVerifying(false);
      }
    }

    verifyInvite();
  }, [token]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      await api.portal.auth.register({
        token,
        password,
      });

      // Navigate to login with success message
      await navigate({
        to: "/portal/login",
        search: { registered: "true" },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-800">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Verifying invitation...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-800">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center font-bold text-2xl">
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <Button asChild variant="outline">
                <a href="/portal/login">Go to Login</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-800">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center font-bold text-2xl">
            Welcome to Client Portal
          </CardTitle>
          <CardDescription className="text-center">
            {inviteData?.clientName ? (
              <span className="block font-medium">
                Hello, {inviteData.clientName}
              </span>
            ) : null}
            Create your password to activate your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleRegister}>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                className="bg-muted"
                disabled
                id="email"
                type="email"
                value={inviteData?.email || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                autoComplete="new-password"
                disabled={isLoading}
                id="password"
                minLength={8}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password (min. 8 characters)"
                required
                type="password"
                value={password}
              />
              <p className="text-muted-foreground text-xs">
                Must contain uppercase, lowercase, and numbers
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                autoComplete="new-password"
                disabled={isLoading}
                id="confirmPassword"
                minLength={8}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                type="password"
                value={confirmPassword}
              />
            </div>

            <Button className="w-full" disabled={isLoading} type="submit">
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
