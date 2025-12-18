import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { client } from "@/utils/orpc";

// Notification type for typing
type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
};

// Type labels and colors
const typeStyles: Record<string, { label: string; className: string }> = {
  ASSIGNMENT: {
    label: "Assignment",
    className: "bg-blue-500/10 text-blue-600",
  },
  DEADLINE_APPROACHING: {
    label: "Deadline",
    className: "bg-yellow-500/10 text-yellow-600",
  },
  DEADLINE_OVERDUE: {
    label: "Overdue",
    className: "bg-red-500/10 text-red-600",
  },
  DOCUMENT_UPLOADED: {
    label: "Document",
    className: "bg-green-500/10 text-green-600",
  },
  MATTER_STATUS_CHANGE: {
    label: "Matter",
    className: "bg-purple-500/10 text-purple-600",
  },
  INVOICE_CREATED: {
    label: "Invoice",
    className: "bg-emerald-500/10 text-emerald-600",
  },
  INVOICE_PAID: {
    label: "Payment",
    className: "bg-green-500/10 text-green-600",
  },
  INVOICE_OVERDUE: {
    label: "Overdue",
    className: "bg-red-500/10 text-red-600",
  },
  CLIENT_PORTAL_ACTIVITY: {
    label: "Portal",
    className: "bg-cyan-500/10 text-cyan-600",
  },
  SYSTEM: {
    label: "System",
    className: "bg-gray-500/10 text-gray-600",
  },
};

const priorityStyles: Record<string, string> = {
  LOW: "",
  NORMAL: "",
  HIGH: "border-l-2 border-l-orange-400",
  URGENT: "border-l-2 border-l-red-500",
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) {
    return "Just now";
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return new Date(date).toLocaleDateString();
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch recent notifications
  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications", "recent"],
    queryFn: () => client.notifications.getRecent({ limit: 10 }),
    refetchInterval: 30_000, // Refetch every 30 seconds
    enabled: open, // Only fetch when dropdown is open
  });

  // Get unread count (always fetch for badge)
  const { data: unreadData } = useQuery({
    queryKey: ["notifications", "unreadCount"],
    queryFn: () => client.notifications.getUnreadCount(),
    refetchInterval: 60_000, // Refetch every minute
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => client.notifications.markAsRead({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => client.notifications.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
    onError: () => {
      toast.error("Failed to mark notifications as read");
    },
  });

  // Dismiss notification mutation
  const dismissMutation = useMutation({
    mutationFn: (id: string) => client.notifications.dismiss({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already
    if (!notification.readAt) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate if there's a link
    if (notification.link) {
      setOpen(false);
      navigate({ to: notification.link });
    }
  };

  const unreadCount = unreadData?.count ?? 0;
  const notifications = (data?.notifications ?? []) as Notification[];

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          className="relative"
          size="icon"
          variant="ghost"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="-top-1 -right-1 absolute flex h-5 w-5 items-center justify-center rounded-full bg-red-500 font-medium text-white text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 sm:w-96">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              className="h-auto p-0 text-xs"
              disabled={markAllAsReadMutation.isPending}
              onClick={() => markAllAsReadMutation.mutate()}
              variant="link"
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <CheckCheck className="mr-1 h-3 w-3" />
              )}
              Mark all read
            </Button>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
              <X className="mb-2 h-6 w-6" />
              <p className="text-sm">Failed to load notifications</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
              <BellOff className="mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => {
                const typeStyle =
                  typeStyles[notification.type] || typeStyles.SYSTEM;
                const isUnread = !notification.readAt;

                return (
                  <div
                    className={`relative cursor-pointer border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/50 ${
                      priorityStyles[notification.priority]
                    } ${isUnread ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleNotificationClick(notification);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <Badge
                            className={`${typeStyle.className} text-xs`}
                            variant="outline"
                          >
                            {typeStyle.label}
                          </Badge>
                          {isUnread && (
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                          )}
                        </div>
                        <p className="font-medium text-sm leading-tight">
                          {notification.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-muted-foreground text-xs">
                          {formatRelativeTime(notification.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {isUnread && (
                          <Button
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsReadMutation.mutate(notification.id);
                            }}
                            size="icon"
                            title="Mark as read"
                            variant="ghost"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissMutation.mutate(notification.id);
                          }}
                          size="icon"
                          title="Dismiss"
                          variant="ghost"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                className="w-full"
                onClick={() => {
                  setOpen(false);
                  navigate({ to: "/app/settings" });
                }}
                size="sm"
                variant="ghost"
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
