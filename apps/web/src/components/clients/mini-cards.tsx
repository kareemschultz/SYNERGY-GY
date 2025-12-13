import { Link } from "@tanstack/react-router";
import {
  Calendar,
  Clock,
  FileText,
  Mail,
  MessageSquare,
  Phone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Matter Mini Card
type MatterMiniCardProps = {
  id: string;
  referenceNumber: string;
  title: string;
  status: string;
  business: string;
  updatedAt: Date;
};

const matterStatusColors: Record<string, string> = {
  NEW: "bg-blue-500/10 text-blue-600",
  IN_PROGRESS: "bg-yellow-500/10 text-yellow-600",
  PENDING_CLIENT: "bg-purple-500/10 text-purple-600",
  SUBMITTED: "bg-cyan-500/10 text-cyan-600",
  COMPLETE: "bg-green-500/10 text-green-600",
  CANCELLED: "bg-gray-500/10 text-gray-600",
};

export function MatterMiniCard({
  id,
  referenceNumber,
  title,
  status,
  business,
  updatedAt,
}: MatterMiniCardProps) {
  const statusColor = matterStatusColors[status] || matterStatusColors.NEW;
  const relativeTime = getRelativeTime(updatedAt);

  return (
    <Link
      className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
      params={{ matterId: id }}
      to="/app/matters/$matterId"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-sm">{title}</p>
          <p className="text-muted-foreground text-xs">{referenceNumber}</p>
        </div>
        <Badge className={cn("text-xs", statusColor)} variant="outline">
          {formatStatus(status)}
        </Badge>
      </div>
      <div className="mt-2 flex items-center gap-2 text-muted-foreground text-xs">
        <Badge
          className={cn(
            "text-xs",
            business === "GCMC"
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-blue-500/10 text-blue-600"
          )}
          variant="outline"
        >
          {business}
        </Badge>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {relativeTime}
        </span>
      </div>
    </Link>
  );
}

// Appointment Mini Card
type AppointmentMiniCardProps = {
  id: string;
  title: string;
  scheduledAt: Date;
  endAt: Date | null;
  status: string;
  locationType: string;
  appointmentType?: {
    name: string;
    color: string | null;
  } | null;
  assignedStaff?: {
    user?: {
      name: string | null;
    } | null;
  } | null;
};

export function AppointmentMiniCard({
  title,
  scheduledAt,
  status,
  locationType,
  appointmentType,
  assignedStaff,
}: AppointmentMiniCardProps) {
  const date = new Date(scheduledAt);
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-sm">{title}</p>
          {appointmentType ? (
            <p className="text-muted-foreground text-xs">
              {appointmentType.name}
            </p>
          ) : null}
        </div>
        <Badge
          className={cn(
            "text-xs",
            status === "CONFIRMED"
              ? "bg-green-500/10 text-green-600"
              : "bg-yellow-500/10 text-yellow-600"
          )}
          variant="outline"
        >
          {status}
        </Badge>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {dateStr} at {time}
        </span>
        <Badge className="text-xs" variant="outline">
          {locationType === "IN_OFFICE" ? "In Office" : locationType || "TBD"}
        </Badge>
        {assignedStaff?.user?.name ? (
          <span className="truncate">with {assignedStaff.user.name}</span>
        ) : null}
      </div>
    </div>
  );
}

// Communication Mini Card
type CommunicationMiniCardProps = {
  id: string;
  type: string;
  direction: string;
  subject?: string | null;
  summary: string;
  communicatedAt: Date;
  staff?: {
    user?: {
      name: string | null;
    } | null;
  } | null;
};

const communicationTypeIcons: Record<string, typeof Phone> = {
  PHONE: Phone,
  EMAIL: Mail,
  IN_PERSON: MessageSquare,
  LETTER: FileText,
  WHATSAPP: MessageSquare,
  OTHER: MessageSquare,
};

export function CommunicationMiniCard({
  type,
  direction,
  subject,
  summary,
  communicatedAt,
  staff,
}: CommunicationMiniCardProps) {
  const Icon = communicationTypeIcons[type] || MessageSquare;
  const relativeTime = getRelativeTime(communicatedAt);

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start gap-2">
        <div
          className={cn(
            "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full",
            direction === "INBOUND" ? "bg-blue-500/10" : "bg-green-500/10"
          )}
        >
          <Icon
            className={cn(
              "h-3 w-3",
              direction === "INBOUND" ? "text-blue-600" : "text-green-600"
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{type}</span>
            <Badge
              className="text-xs"
              variant={direction === "INBOUND" ? "secondary" : "outline"}
            >
              {direction === "INBOUND" ? "In" : "Out"}
            </Badge>
          </div>
          {subject ? (
            <p className="truncate text-muted-foreground text-xs">{subject}</p>
          ) : null}
          <p className="mt-1 line-clamp-2 text-sm">{summary}</p>
          <div className="mt-1.5 flex items-center gap-2 text-muted-foreground text-xs">
            <span>{relativeTime}</span>
            {staff?.user?.name ? <span>by {staff.user.name}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// Document Mini Card
type DocumentMiniCardProps = {
  id: string;
  originalName: string;
  category: string | null;
  createdAt: Date;
};

export function DocumentMiniCard({
  originalName,
  category,
  createdAt,
}: DocumentMiniCardProps) {
  const relativeTime = getRelativeTime(createdAt);

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-muted">
          <FileText className="h-3 w-3 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-sm">{originalName}</p>
          <div className="mt-1 flex items-center gap-2 text-muted-foreground text-xs">
            {category ? (
              <Badge className="text-xs" variant="outline">
                {category}
              </Badge>
            ) : null}
            <span>{relativeTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  }
  if (diffDays === 1) {
    return "1d ago";
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)}w ago`;
  }
  if (diffDays < 365) {
    return `${Math.floor(diffDays / 30)}mo ago`;
  }
  return `${Math.floor(diffDays / 365)}y ago`;
}

function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
