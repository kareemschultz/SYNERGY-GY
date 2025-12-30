import {
  Calendar,
  Clock,
  MapPin,
  MoreHorizontal,
  Phone,
  User,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppointmentStatusBadge } from "./appointment-status-badge";

type Appointment = {
  id: string;
  scheduledAt: Date | string;
  durationMinutes: number;
  status:
    | "REQUESTED"
    | "CONFIRMED"
    | "COMPLETED"
    | "CANCELLED"
    | "NO_SHOW"
    | "RESCHEDULED";
  locationType: "IN_PERSON" | "PHONE" | "VIDEO";
  location?: string | null;
  preAppointmentNotes?: string | null;
  isPublicBooking?: boolean;
  publicBookerName?: string | null;
  publicBookerEmail?: string | null;
  publicBookerPhone?: string | null;
  client: {
    id: string;
    displayName: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  appointmentType: {
    id: string;
    name: string;
    color?: string | null;
  };
  assignedStaff?: {
    id: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
    };
  } | null;
};

type AppointmentCardProps = {
  appointment: Appointment;
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
  onReschedule?: (id: string) => void;
  onComplete?: (id: string) => void;
  onNoShow?: (id: string) => void;
  onViewDetails?: (id: string) => void;
};

const locationIcons = {
  IN_PERSON: MapPin,
  PHONE: Phone,
  VIDEO: Video,
};

const locationLabels = {
  IN_PERSON: "In Person",
  PHONE: "Phone Call",
  VIDEO: "Video Call",
};

// Extracted dropdown to reduce cognitive complexity
function AppointmentActionsMenu({
  appointmentId,
  canConfirm,
  canComplete,
  canCancel,
  onViewDetails,
  onConfirm,
  onComplete,
  onNoShow,
  onReschedule,
  onCancel,
}: {
  appointmentId: string;
  canConfirm: boolean;
  canComplete: boolean;
  canCancel: boolean;
  onViewDetails?: (id: string) => void;
  onConfirm?: (id: string) => void;
  onComplete?: (id: string) => void;
  onNoShow?: (id: string) => void;
  onReschedule?: (id: string) => void;
  onCancel?: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label="Actions" size="icon" variant="ghost">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onViewDetails !== undefined ? (
          <DropdownMenuItem onClick={() => onViewDetails(appointmentId)}>
            View Details
          </DropdownMenuItem>
        ) : null}
        {canConfirm === true && onConfirm !== undefined ? (
          <DropdownMenuItem onClick={() => onConfirm(appointmentId)}>
            Confirm
          </DropdownMenuItem>
        ) : null}
        {canComplete === true && onComplete !== undefined ? (
          <DropdownMenuItem onClick={() => onComplete(appointmentId)}>
            Mark Complete
          </DropdownMenuItem>
        ) : null}
        {canComplete === true && onNoShow !== undefined ? (
          <DropdownMenuItem onClick={() => onNoShow(appointmentId)}>
            Mark No Show
          </DropdownMenuItem>
        ) : null}
        {onReschedule !== undefined ? (
          <DropdownMenuItem onClick={() => onReschedule(appointmentId)}>
            Reschedule
          </DropdownMenuItem>
        ) : null}
        {canCancel === true && onCancel !== undefined ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onCancel(appointmentId)}
            >
              Cancel
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppointmentCard({
  appointment,
  onConfirm,
  onCancel,
  onReschedule,
  onComplete,
  onNoShow,
  onViewDetails,
}: AppointmentCardProps) {
  const LocationIcon = locationIcons[appointment.locationType];
  const scheduledDate = new Date(appointment.scheduledAt);
  const canConfirm = appointment.status === "REQUESTED";
  const canComplete =
    appointment.status === "CONFIRMED" && scheduledDate <= new Date();
  const canCancel = ["REQUESTED", "CONFIRMED"].includes(appointment.status);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <div
            className="size-3 rounded-full"
            style={{
              backgroundColor: appointment.appointmentType.color ?? "#6b7280",
            }}
          />
          <span className="font-medium">
            {appointment.appointmentType.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AppointmentStatusBadge status={appointment.status} />
          <AppointmentActionsMenu
            appointmentId={appointment.id}
            canCancel={canCancel}
            canComplete={canComplete}
            canConfirm={canConfirm}
            onCancel={onCancel}
            onComplete={onComplete}
            onConfirm={onConfirm}
            onNoShow={onNoShow}
            onReschedule={onReschedule}
            onViewDetails={onViewDetails}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <User className="size-4 text-muted-foreground" />
          <span className="font-medium">
            {appointment.client?.displayName ??
              appointment.publicBookerName ??
              "Unknown"}
          </span>
          {appointment.isPublicBooking ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground text-xs">
              Public
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-4 text-muted-foreground text-sm">
          <div className="flex items-center gap-1.5">
            <Calendar className="size-4" />
            <span>
              {scheduledDate.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="size-4" />
            <span>
              {scheduledDate.toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })}
              {" - "}
              {appointment.durationMinutes} min
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
          <LocationIcon className="size-4" />
          <span>
            {locationLabels[appointment.locationType]}
            {appointment.location ? ` - ${appointment.location}` : ""}
          </span>
        </div>

        {appointment.assignedStaff ? (
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <User className="size-4" />
            <span>with {appointment.assignedStaff.user.name ?? "Staff"}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
