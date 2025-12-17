import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, Upload, User as UserIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to upload avatar");
      }

      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Avatar updated successfully");
    } catch {
      setAvatarPreview(null);
      toast.error(
        "Failed to upload avatar. This feature may require additional server configuration."
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

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
          {/* Profile Picture with Upload */}
          <div className="flex items-center gap-4">
            <div className="group relative">
              <Avatar
                className="h-20 w-20 cursor-pointer"
                onClick={handleAvatarClick}
              >
                <AvatarImage
                  alt={profile?.name || "Profile"}
                  src={avatarPreview || profile?.image || undefined}
                />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {profile?.name ? (
                    getInitials(profile.name)
                  ) : (
                    <UserIcon className="h-10 w-10" />
                  )}
                </AvatarFallback>
              </Avatar>
              <button
                className="absolute right-0 bottom-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110 disabled:opacity-50"
                disabled={isUploadingAvatar}
                onClick={handleAvatarClick}
                type="button"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                ref={fileInputRef}
                type="file"
              />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Profile Picture</p>
              <p className="text-muted-foreground text-xs">
                Click the camera icon to upload a new avatar. Max file size:
                5MB.
              </p>
              <Button
                className="mt-2 h-7 text-xs"
                onClick={handleAvatarClick}
                size="sm"
                variant="outline"
              >
                <Upload className="mr-1 h-3 w-3" />
                Upload Photo
              </Button>
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
                  {!!updateProfileMutation.isPending && (
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
