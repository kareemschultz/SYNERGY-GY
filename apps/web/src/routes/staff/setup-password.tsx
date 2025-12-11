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

export const Route = createFileRoute("/staff/setup-password")({
  component: SetupPassword,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || "",
  }),
});

function SetupPassword() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();

  const [staffData, setStaffData] = useState<{
    email: string;
    name: string;
    role: string | null;
    jobTitle: string | null;
  } | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setError("No setup token provided");
        setIsVerifying(false);
        return;
      }

      try {
        const result = await api.staffSetup.verifyToken({ token });
        setStaffData({
          email: result.email,
          name: result.name,
          role: result.role,
          jobTitle: result.jobTitle,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Invalid or expired setup link"
        );
      } finally {
        setIsVerifying(false);
      }
    }

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
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

    // Check for uppercase, lowercase, and number
    // biome-ignore lint/performance/useTopLevelRegex: Only called on form submit
    const hasUppercase = /[A-Z]/.test(password);
    // biome-ignore lint/performance/useTopLevelRegex: Only called on form submit
    const hasLowercase = /[a-z]/.test(password);
    // biome-ignore lint/performance/useTopLevelRegex: Only called on form submit
    const hasNumber = /\d/.test(password);

    if (!(hasUppercase && hasLowercase && hasNumber)) {
      setError("Password must contain uppercase, lowercase, and numbers");
      return;
    }

    setIsLoading(true);

    try {
      await api.staffSetup.completeSetup({
        token,
        password,
      });

      // Navigate to login with success message
      await navigate({
        to: "/login",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Setup failed. Please try again."
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
              Verifying setup link...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !staffData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-800">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center font-bold text-2xl">
              Invalid Setup Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <p className="mb-4 text-muted-foreground text-sm">
                Please contact your administrator for a new setup link.
              </p>
              <Button asChild variant="outline">
                <a href="/login">Go to Login</a>
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
            Welcome to GK-Nexus
          </CardTitle>
          <CardDescription className="text-center">
            {staffData?.name ? (
              <span className="block font-medium">Hello, {staffData.name}</span>
            ) : null}
            {staffData?.jobTitle ? (
              <span className="block text-muted-foreground text-sm">
                {staffData.jobTitle}
              </span>
            ) : null}
            Create your password to activate your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
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
                value={staffData?.email || ""}
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
              {isLoading ? "Setting up account..." : "Create Account"}
            </Button>
          </form>

          <p className="mt-4 text-center text-muted-foreground text-xs">
            Already have an account?{" "}
            <a className="text-primary underline" href="/login">
              Login here
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
