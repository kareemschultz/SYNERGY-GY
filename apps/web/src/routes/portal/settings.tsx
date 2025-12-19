import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Loader2,
  Lock,
  LogOut,
  Phone,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { client as api } from "@/utils/orpc";

export const Route = createFileRoute("/portal/settings")({
  component: PortalSettings,
});

type NotificationPreferences = {
  emailOnMatterUpdate: boolean;
  emailOnAppointment: boolean;
  emailOnDocumentRequest: boolean;
};

type ContactInfo = {
  phone: string | null;
  alternatePhone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  preferredContactMethod: "EMAIL" | "PHONE" | "WHATSAPP" | "IN_PERSON" | null;
  email: string | null;
};

function PortalSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Contact info form state
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [preferredContactMethod, setPreferredContactMethod] =
    useState<string>("");

  // Check authentication
  useEffect(() => {
    const sessionToken = localStorage.getItem("portal-session");
    if (sessionToken) {
      setIsAuthenticated(true);
    } else {
      navigate({ to: "/portal/login" });
    }
    setIsCheckingAuth(false);
  }, [navigate]);

  // Load notification preferences
  const { data: preferences, isLoading: prefsLoading } = useQuery({
    queryKey: ["portal", "notificationPreferences"],
    queryFn: () => api.portal.user.getNotificationPreferences(),
    enabled: isAuthenticated,
  });

  // Load contact info
  const { data: contactInfo, isLoading: contactLoading } = useQuery({
    queryKey: ["portal", "contactInfo"],
    queryFn: () => api.portal.contactInfo.get(),
    enabled: isAuthenticated,
  });

  // Initialize contact form when data loads
  useEffect(() => {
    if (contactInfo) {
      const info = contactInfo as ContactInfo;
      setPhone(info.phone || "");
      setAlternatePhone(info.alternatePhone || "");
      setAddress(info.address || "");
      setCity(info.city || "");
      setPreferredContactMethod(info.preferredContactMethod || "");
    }
  }, [contactInfo]);

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.portal.user.changePassword(data),
    onSuccess: () => {
      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to change password. Please try again.",
      });
    },
  });

  // Update notification preferences mutation
  const updatePrefsMutation = useMutation({
    mutationFn: (data: Partial<NotificationPreferences>) =>
      api.portal.user.updateNotificationPreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["portal", "notificationPreferences"],
      });
      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save preferences. Please try again.",
      });
    },
  });

  // Update contact info mutation
  const updateContactMutation = useMutation({
    mutationFn: (data: {
      phone?: string;
      alternatePhone?: string;
      address?: string;
      city?: string;
      preferredContactMethod?: "EMAIL" | "PHONE" | "WHATSAPP" | "IN_PERSON";
    }) => api.portal.contactInfo.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal", "contactInfo"] });
      toast({
        title: "Contact info updated",
        description: "Your contact information has been saved.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update contact info. Please try again.",
      });
    },
  });

  const handleChangePassword = () => {
    if (!currentPassword.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your current password.",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "New password must be at least 8 characters.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match.",
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const handleUpdateContact = () => {
    updateContactMutation.mutate({
      phone: phone || undefined,
      alternatePhone: alternatePhone || undefined,
      address: address || undefined,
      city: city || undefined,
      preferredContactMethod: preferredContactMethod as
        | "EMAIL"
        | "PHONE"
        | "WHATSAPP"
        | "IN_PERSON"
        | undefined,
    });
  };

  const handleLogout = async () => {
    try {
      await api.portal.auth.logout();
    } catch (_err) {
      // Ignore error
    } finally {
      localStorage.removeItem("portal-session");
      localStorage.removeItem("portal-user");
      await navigate({ to: "/portal/login" });
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const prefs = (preferences as NotificationPreferences) ?? {
    emailOnMatterUpdate: true,
    emailOnAppointment: true,
    emailOnDocumentRequest: true,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-slate-200 border-b bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button asChild size="icon" variant="ghost">
              <Link to="/portal">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="font-semibold text-lg">Settings</h1>
              <p className="text-muted-foreground text-sm">
                Manage your account
              </p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="ghost">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl space-y-6 p-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-muted-foreground" />
              Contact Information
            </CardTitle>
            <CardDescription>
              Keep your contact details up to date
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contactLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+592 XXX XXXX"
                      value={phone}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alternatePhone">Alternate Phone</Label>
                    <Input
                      id="alternatePhone"
                      onChange={(e) => setAlternatePhone(e.target.value)}
                      placeholder="+592 XXX XXXX"
                      value={alternatePhone}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your address"
                    rows={2}
                    value={address}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Georgetown"
                      value={city}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferredContact">
                      Preferred Contact Method
                    </Label>
                    <Select
                      onValueChange={setPreferredContactMethod}
                      value={preferredContactMethod}
                    >
                      <SelectTrigger id="preferredContact">
                        <SelectValue placeholder="Select preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMAIL">Email</SelectItem>
                        <SelectItem value="PHONE">Phone</SelectItem>
                        <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                        <SelectItem value="IN_PERSON">In Person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  disabled={updateContactMutation.isPending}
                  onClick={handleUpdateContact}
                >
                  {updateContactMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Contact Info"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Change Password */}
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
                Must be at least 8 characters with uppercase, lowercase, and
                numbers
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

            {newPassword !== "" &&
            confirmPassword !== "" &&
            newPassword !== confirmPassword ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Passwords do not match</AlertDescription>
              </Alert>
            ) : null}

            <Button
              disabled={
                changePasswordMutation.isPending ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword
              }
              onClick={handleChangePassword}
            >
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Choose which email notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent>
            {prefsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Matter Updates</p>
                    <p className="text-muted-foreground text-sm">
                      Get notified when your matters have updates
                    </p>
                  </div>
                  <Switch
                    checked={prefs.emailOnMatterUpdate}
                    disabled={updatePrefsMutation.isPending}
                    onCheckedChange={(checked) =>
                      updatePrefsMutation.mutate({
                        emailOnMatterUpdate: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Appointments</p>
                    <p className="text-muted-foreground text-sm">
                      Get reminders about upcoming appointments
                    </p>
                  </div>
                  <Switch
                    checked={prefs.emailOnAppointment}
                    disabled={updatePrefsMutation.isPending}
                    onCheckedChange={(checked) =>
                      updatePrefsMutation.mutate({
                        emailOnAppointment: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Document Requests</p>
                    <p className="text-muted-foreground text-sm">
                      Get notified when documents are requested from you
                    </p>
                  </div>
                  <Switch
                    checked={prefs.emailOnDocumentRequest}
                    disabled={updatePrefsMutation.isPending}
                    onCheckedChange={(checked) =>
                      updatePrefsMutation.mutate({
                        emailOnDocumentRequest: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Messages</p>
                    <p className="text-muted-foreground text-sm">
                      Get notified when you receive new messages
                    </p>
                  </div>
                  <Switch
                    checked={prefs.emailOnMatterUpdate}
                    disabled={updatePrefsMutation.isPending}
                    onCheckedChange={(checked) =>
                      updatePrefsMutation.mutate({
                        emailOnMatterUpdate: checked,
                      })
                    }
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
