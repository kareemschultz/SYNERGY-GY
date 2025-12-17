import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Calendar,
  KeyRound,
  Loader2,
  Lock,
  Monitor,
  Shield,
  ShieldCheck,
  Smartphone,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { authClient } from "@/lib/auth-client";
import { client } from "@/utils/orpc";

export function SecuritySettings() {
  const queryClient = useQueryClient();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sessionToRevoke, setSessionToRevoke] = useState<string | null>(null);

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["activeSessions"],
    queryFn: () => client.settings.getActiveSessions(),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      // Use better-auth's built-in password change functionality
      const result = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      if (result.error) {
        throw new Error(result.error.message || "Failed to change password");
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to change password"
      );
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) =>
      client.settings.revokeSession({ sessionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeSessions"] });
      toast.success("Session revoked successfully");
      setSessionToRevoke(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to revoke session"
      );
      setSessionToRevoke(null);
    },
  });

  const handleChangePassword = () => {
    if (!currentPassword.trim()) {
      toast.error("Current password is required");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const getUserAgent = (
    userAgent: string
  ): { icon: typeof Monitor; label: string } => {
    const ua = userAgent.toLowerCase();
    if (
      ua.includes("mobile") ||
      ua.includes("android") ||
      ua.includes("iphone")
    ) {
      return { icon: Smartphone, label: "Mobile Device" };
    }
    return { icon: Monitor, label: "Desktop" };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-2xl">Security</h2>
        <p className="text-muted-foreground text-sm">
          Manage your account security and active sessions
        </p>
      </div>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              type="password"
              value={currentPassword}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter a new password"
              type="password"
              value={newPassword}
            />
            <p className="text-muted-foreground text-xs">
              Password must be at least 8 characters long
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              type="password"
              value={confirmPassword}
            />
          </div>

          {!!newPassword &&
            confirmPassword &&
            newPassword !== confirmPassword && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p className="text-red-800 text-sm dark:text-red-200">
                  Passwords do not match
                </p>
              </div>
            )}

          <div className="pt-2">
            <Button
              disabled={
                changePasswordMutation.isPending ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword
              }
              onClick={handleChangePassword}
              type="button"
            >
              {!!changePasswordMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            Two-Factor Authentication
            <Badge className="ml-2" variant="outline">
              Coming Soon
            </Badge>
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="rounded bg-muted p-2">
                <KeyRound className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">Authenticator App</p>
                <p className="text-muted-foreground text-xs">
                  Use an authenticator app like Google Authenticator or Authy
                </p>
              </div>
            </div>
            <Switch disabled />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="rounded bg-muted p-2">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">SMS Verification</p>
                <p className="text-muted-foreground text-xs">
                  Receive a code via SMS when signing in
                </p>
              </div>
            </div>
            <Switch disabled />
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
            <div className="flex gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-blue-900 text-sm dark:text-blue-200">
                  Enhanced Security
                </p>
                <p className="text-blue-800 text-xs dark:text-blue-300">
                  Two-factor authentication adds an extra layer of security by
                  requiring a second form of verification when signing in. This
                  feature will be available in a future update.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage devices where you're currently logged in
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
            // biome-ignore lint/nursery/noLeakedRender: Auto-fix
            // biome-ignore lint/style/noNestedTernary: Auto-fix
          ) : sessions && sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((session) => {
                const { icon: DeviceIcon, label: deviceLabel } = getUserAgent(
                  session.userAgent
                );

                return (
                  <div
                    className="flex items-start justify-between rounded-lg border p-4"
                    key={session.id}
                  >
                    <div className="flex gap-3">
                      <div className="rounded bg-muted p-2">
                        <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{deviceLabel}</p>
                          {!!session.current && (
                            <span className="rounded bg-green-500/10 px-2 py-0.5 font-medium text-green-600 text-xs">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="space-y-0.5 text-muted-foreground text-xs">
                          <p className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Last active:{" "}
                            {new Date(session.createdAt).toLocaleDateString()}
                          </p>
                          <p>IP: {session.ipAddress}</p>
                          <p className="line-clamp-1">
                            Browser: {session.userAgent}
                          </p>
                        </div>
                      </div>
                    </div>
                    {!session.current && (
                      <Button
                        onClick={() => setSessionToRevoke(session.id)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No active sessions
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Tips Card */}
      <Card>
        <CardHeader>
          <CardTitle>Security Tips</CardTitle>
          <CardDescription>Keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span className="text-muted-foreground">
                Use a strong, unique password that you don't use anywhere else
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span className="text-muted-foreground">
                Review your active sessions regularly and revoke any you don't
                recognize
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span className="text-muted-foreground">
                Never share your password with anyone
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span className="text-muted-foreground">
                If you notice suspicious activity, change your password
                immediately
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Revoke Session Confirmation Dialog */}
      <AlertDialog
        onOpenChange={(open: boolean) => !open && setSessionToRevoke(null)}
        open={sessionToRevoke !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will log out the selected device. You'll need to sign in
              again on that device to continue using GK-Nexus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={revokeSessionMutation.isPending}
              onClick={() => {
                if (sessionToRevoke) {
                  revokeSessionMutation.mutate(sessionToRevoke);
                }
              }}
            >
              {!!revokeSessionMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Revoke Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
