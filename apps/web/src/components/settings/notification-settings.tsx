import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Loader2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { client } from "@/utils/orpc";

type NotificationPreferences = {
  emailNotifications: boolean;
  deadlineReminders: boolean;
  activityUpdates: boolean;
};

export function NotificationSettings() {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    deadlineReminders: true,
    activityUpdates: false,
  });
  const [hasChanges, setHasChanges] = useState(false);

  const { data: savedPreferences, isLoading } = useQuery({
    queryKey: ["notificationPreferences"],
    queryFn: () => client.settings.getNotificationPreferences(),
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (data: NotificationPreferences) =>
      client.settings.updateNotificationPreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationPreferences"] });
      toast.success("Notification preferences updated");
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update preferences"
      );
    },
  });

  // Initialize preferences when data loads
  useEffect(() => {
    if (savedPreferences) {
      setPreferences(savedPreferences);
    }
  }, [savedPreferences]);

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updatePreferencesMutation.mutate(preferences);
  };

  const handleReset = () => {
    if (savedPreferences) {
      setPreferences(savedPreferences);
      setHasChanges(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-2xl">Notifications</h2>
        <p className="text-muted-foreground text-sm">
          Manage how you receive updates and alerts
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Choose what notifications you want to receive via email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications Toggle */}
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label
                  className="font-medium text-base"
                  htmlFor="emailNotifications"
                >
                  Email Notifications
                </Label>
              </div>
              <p className="text-muted-foreground text-sm">
                Receive general notifications via email
              </p>
            </div>
            <Switch
              checked={preferences.emailNotifications}
              id="emailNotifications"
              onCheckedChange={(checked) =>
                handleToggle("emailNotifications", checked)
              }
            />
          </div>

          {/* Deadline Reminders Toggle */}
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Label
                  className="font-medium text-base"
                  htmlFor="deadlineReminders"
                >
                  Deadline Reminders
                </Label>
              </div>
              <p className="text-muted-foreground text-sm">
                Get reminded about upcoming deadlines and important dates
              </p>
            </div>
            <Switch
              checked={preferences.deadlineReminders}
              disabled={!preferences.emailNotifications}
              id="deadlineReminders"
              onCheckedChange={(checked) =>
                handleToggle("deadlineReminders", checked)
              }
            />
          </div>

          {/* Activity Updates Toggle */}
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Label
                  className="font-medium text-base"
                  htmlFor="activityUpdates"
                >
                  Activity Updates
                </Label>
              </div>
              <p className="text-muted-foreground text-sm">
                Receive notifications when there are updates to your matters or
                documents
              </p>
            </div>
            <Switch
              checked={preferences.activityUpdates}
              disabled={!preferences.emailNotifications}
              id="activityUpdates"
              onCheckedChange={(checked) =>
                handleToggle("activityUpdates", checked)
              }
            />
          </div>

          {/* Info Box */}
          {!preferences.emailNotifications && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
              <div className="flex items-start gap-3">
                <div className="rounded bg-yellow-100 p-2 dark:bg-yellow-900">
                  <Mail className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-medium text-sm text-yellow-900 dark:text-yellow-100">
                    Email notifications are disabled
                  </p>
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    Enable email notifications to receive deadline reminders and
                    activity updates
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!!hasChanges && (
            <div className="flex gap-2 pt-4">
              <Button
                disabled={updatePreferencesMutation.isPending}
                onClick={handleSave}
                type="button"
              >
                {!!updatePreferencesMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
              <Button
                disabled={updatePreferencesMutation.isPending}
                onClick={handleReset}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Delivery</CardTitle>
          <CardDescription>How notifications are sent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Email notifications are sent to:{" "}
              <span className="font-medium text-foreground">
                {savedPreferences ? "your registered email" : "loading..."}
              </span>
            </p>
            <p className="text-muted-foreground">
              Deadline reminders are sent 24 hours before the due date.
            </p>
            <p className="text-muted-foreground">
              Activity updates are sent in real-time when changes occur.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
