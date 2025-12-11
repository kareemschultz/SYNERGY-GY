import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { client } from "@/utils/orpc";

export function ProfileSettings() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => client.settings.getProfile(),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: { name: string }) => client.settings.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully");
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    updateProfileMutation.mutate({ name: name.trim() });
  };

  const handleCancel = () => {
    setName(profile?.name || "");
    setIsEditing(false);
  };

  // Initialize name when profile loads
  if (profile && !isEditing && name !== profile.name) {
    setName(profile.name);
  }

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
        <h2 className="font-semibold text-2xl">Profile Settings</h2>
        <p className="text-muted-foreground text-sm">
          Manage your personal information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your name and profile details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Profile Picture Placeholder */}
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              {profile?.image ? (
                <img
                  alt={profile.name}
                  className="h-full w-full rounded-full object-cover"
                  src={profile.image}
                />
              ) : (
                <UserIcon className="h-10 w-10 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Profile Picture</p>
              <p className="text-muted-foreground text-xs">
                Avatar images are managed through your authentication provider
              </p>
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              disabled={!isEditing}
              id="name"
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              value={name}
            />
          </div>

          {/* Email Field (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              disabled
              id="email"
              placeholder="your@email.com"
              type="email"
              value={profile?.email || ""}
            />
            <p className="text-muted-foreground text-xs">
              Email cannot be changed. Contact support if you need to update
              your email address.
            </p>
          </div>

          {/* Member Since */}
          <div className="space-y-2">
            <Label>Member Since</Label>
            <p className="text-sm">
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Unknown"}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {isEditing ? (
              <>
                <Button
                  disabled={updateProfileMutation.isPending}
                  onClick={handleSave}
                  type="button"
                >
                  {updateProfileMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
                <Button
                  disabled={updateProfileMutation.isPending}
                  onClick={handleCancel}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} type="button">
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
