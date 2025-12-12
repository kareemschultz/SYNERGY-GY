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

type NotificationPreferences = {
  emailNotifications: boolean;
  deadlineReminders: boolean;
  activityUpdates: boolean;
};

const STORAGE_KEY = "gk-nexus-notification-preferences";
const DEFAULT_PREFERENCES: NotificationPreferences = {
  emailNotifications: true,
  deadlineReminders: true,
  activityUpdates: false,
};

// Helper to get preferences from localStorage
function getStoredPreferences(): NotificationPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_PREFERENCES;
}

// Helper to save preferences to localStorage
function savePreferences(prefs: NotificationPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage errors
  }
}

export function NotificationSettings() {
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const stored = getStoredPreferences();
    setPreferences(stored);
    setIsLoading(false);
  }, []);

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate a brief save delay for UX
    setTimeout(() => {
      savePreferences(preferences);
      setHasChanges(false);
      setIsSaving(false);
      toast.success("Notification preferences saved");
    }, 300);
  };

  const handleReset = () => {
    const stored = getStoredPreferences();
    setPreferences(stored);
    setHasChanges(false);
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
              <Button disabled={isSaving} onClick={handleSave} type="button">
                {!!isSaving && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
              <Button
                disabled={isSaving}
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
              Email notifications will be sent to your registered email address
              when email integration is enabled.
            </p>
            <p className="text-muted-foreground">
              Deadline reminders will be sent 24 hours before the due date.
            </p>
            <p className="text-muted-foreground">
              Activity updates will be sent when changes occur to matters or
              documents you're associated with.
            </p>
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
              <p className="text-blue-800 text-xs dark:text-blue-200">
                Note: These preferences are stored locally in your browser.
                Email delivery will be available once email integration is
                configured.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
