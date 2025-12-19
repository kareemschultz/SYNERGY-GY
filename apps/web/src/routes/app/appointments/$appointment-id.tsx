import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  CalendarX2,
  CheckCircle,
  Clock,
  Edit,
  Loader2,
  MapPin,
  Phone,
  User,
  UserX,
  Video,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge";
import { PageHeader } from "@/components/shared/page-header";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { client, queryClient as qc } from "@/utils/orpc";

export const Route = createFileRoute("/app/appointments/$appointment-id")({
  component: AppointmentDetailPage,
});

type AppointmentStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "RESCHEDULED";

const locationIcons = {
  IN_PERSON: MapPin,
  PHONE: Phone,
  VIDEO: Video,
};

const locationLabels: Record<string, string> = {
  IN_PERSON: "In Person",
  PHONE: "Phone Call",
  VIDEO: "Video Call",
};

const locationDetailLabels: Record<string, string> = {
  IN_PERSON: "Address",
  PHONE: "Phone Number",
  VIDEO: "Meeting Link",
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Component handles multiple appointment states and actions
function AppointmentDetailPage() {
  const { "appointment-id": appointmentId } = Route.useParams();
  const queryClient = useQueryClient();

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [postNotes, setPostNotes] = useState("");
  const [newScheduledAt, setNewScheduledAt] = useState("");
  const [newScheduledTime, setNewScheduledTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");

  const {
    data: appointment,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["appointment", appointmentId],
    queryFn: () => client.appointments.getById({ id: appointmentId }),
  });

  const confirmMutation = useMutation({
    mutationFn: () => client.appointments.confirm({ id: appointmentId }),
    onSuccess: () => {
      toast.success("Appointment confirmed");
      queryClient.invalidateQueries({
        queryKey: ["appointment", appointmentId],
      });
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to confirm appointment");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () =>
      client.appointments.cancel({
        id: appointmentId,
        cancellationReason: cancelReason || undefined,
      }),
    onSuccess: () => {
      toast.success("Appointment cancelled");
      setShowCancelDialog(false);
      queryClient.invalidateQueries({
        queryKey: ["appointment", appointmentId],
      });
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to cancel appointment");
    },
  });

  const completeMutation = useMutation({
    mutationFn: () =>
      client.appointments.complete({
        id: appointmentId,
        postAppointmentNotes: postNotes || undefined,
      }),
    onSuccess: () => {
      toast.success("Appointment marked as complete");
      setShowCompleteDialog(false);
      queryClient.invalidateQueries({
        queryKey: ["appointment", appointmentId],
      });
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to complete appointment");
    },
  });

  const noShowMutation = useMutation({
    mutationFn: () => client.appointments.markNoShow({ id: appointmentId }),
    onSuccess: () => {
      toast.success("Appointment marked as no-show");
      queryClient.invalidateQueries({
        queryKey: ["appointment", appointmentId],
      });
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to mark as no-show");
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: () => {
      const newDateTime = new Date(
        `${newScheduledAt}T${newScheduledTime}`
      ).toISOString();
      return client.appointments.reschedule({
        id: appointmentId,
        newScheduledAt: newDateTime,
        reason: rescheduleReason || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Appointment rescheduled");
      setShowRescheduleDialog(false);
      queryClient.invalidateQueries({
        queryKey: ["appointment", appointmentId],
      });
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to reschedule appointment");
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Appointment not found</p>
        <Button asChild variant="outline">
          <Link to="/app/appointments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Appointments
          </Link>
        </Button>
      </div>
    );
  }

  const scheduledDate = new Date(appointment.scheduledAt);
  const endDate = new Date(appointment.endAt);
  const LocationIcon = locationIcons[appointment.locationType];
  const isPast = scheduledDate < new Date();
  const canConfirm = appointment.status === "REQUESTED";
  const canComplete = appointment.status === "CONFIRMED" && isPast;
  const canCancel = ["REQUESTED", "CONFIRMED"].includes(appointment.status);
  const canReschedule = ["REQUESTED", "CONFIRMED"].includes(appointment.status);

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/app/appointments">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            {canConfirm ? (
              <Button
                disabled={confirmMutation.isPending}
                onClick={() => confirmMutation.mutate()}
              >
                {confirmMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Confirm
              </Button>
            ) : null}
          </div>
        }
        description={`${appointment.appointmentType.name} with ${appointment.client.displayName}`}
        title={appointment.title}
      />

      <div className="p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Status & Actions Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AppointmentStatusBadge
                    status={appointment.status as AppointmentStatus}
                  />
                  <Badge
                    className="bg-primary/10 text-primary"
                    variant="outline"
                  >
                    {appointment.business}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {canReschedule ? (
                    <Button
                      onClick={() => {
                        setNewScheduledAt(format(scheduledDate, "yyyy-MM-dd"));
                        setNewScheduledTime(format(scheduledDate, "HH:mm"));
                        setShowRescheduleDialog(true);
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Reschedule
                    </Button>
                  ) : null}
                  {canComplete ? (
                    <>
                      <Button
                        onClick={() => setShowCompleteDialog(true)}
                        size="sm"
                        variant="outline"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Complete
                      </Button>
                      <Button
                        disabled={noShowMutation.isPending}
                        onClick={() => noShowMutation.mutate()}
                        size="sm"
                        variant="outline"
                      >
                        {noShowMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <UserX className="mr-2 h-4 w-4" />
                        )}
                        No Show
                      </Button>
                    </>
                  ) : null}
                  {canCancel ? (
                    <Button
                      onClick={() => setShowCancelDialog(true)}
                      size="sm"
                      variant="destructive"
                    >
                      <CalendarX2 className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Schedule Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Date
                  </p>
                  <p className="text-lg">
                    {format(scheduledDate, "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
                <div className="flex gap-6">
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">
                      Start Time
                    </p>
                    <p className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {format(scheduledDate, "h:mm a")}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">
                      End Time
                    </p>
                    <p className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {format(endDate, "h:mm a")}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Duration
                  </p>
                  <p>{appointment.durationMinutes} minutes</p>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LocationIcon className="h-5 w-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Type
                  </p>
                  <p>{locationLabels[appointment.locationType]}</p>
                </div>
                {appointment.location ? (
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">
                      {locationDetailLabels[appointment.locationType]}
                    </p>
                    <p className="break-all">{appointment.location}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Name
                  </p>
                  <Link
                    className="text-primary hover:underline"
                    params={{ clientId: appointment.client.id }}
                    to="/app/clients/$clientId"
                  >
                    {appointment.client.displayName}
                  </Link>
                </div>
                {appointment.client.email ? (
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">
                      Email
                    </p>
                    <a
                      className="text-primary hover:underline"
                      href={`mailto:${appointment.client.email}`}
                    >
                      {appointment.client.email}
                    </a>
                  </div>
                ) : null}
                {appointment.client.phone ? (
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">
                      Phone
                    </p>
                    <a
                      className="text-primary hover:underline"
                      href={`tel:${appointment.client.phone}`}
                    >
                      {appointment.client.phone}
                    </a>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Assigned Staff */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Assigned Staff
                </CardTitle>
              </CardHeader>
              <CardContent>
                {appointment.assignedStaff ? (
                  <p>
                    {appointment.assignedStaff.user?.name ||
                      appointment.assignedStaff.user?.email ||
                      "Staff member"}
                  </p>
                ) : (
                  <p className="text-muted-foreground">No staff assigned</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Matter Link */}
          {appointment.matter ? (
            <Card>
              <CardHeader>
                <CardTitle>Linked Matter</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  className="text-primary hover:underline"
                  params={{ "matter-id": appointment.matter.id }}
                  to="/app/matters/$matter-id"
                >
                  {appointment.matter.title} (
                  {appointment.matter.referenceNumber})
                </Link>
              </CardContent>
            </Card>
          ) : null}

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {appointment.preAppointmentNotes ? (
                <div>
                  <p className="mb-1 font-medium text-muted-foreground text-sm">
                    Pre-Appointment Notes (Internal)
                  </p>
                  <p className="whitespace-pre-wrap rounded bg-muted/50 p-3 text-sm">
                    {appointment.preAppointmentNotes}
                  </p>
                </div>
              ) : null}
              {appointment.postAppointmentNotes ? (
                <div>
                  <p className="mb-1 font-medium text-muted-foreground text-sm">
                    Post-Appointment Notes (Internal)
                  </p>
                  <p className="whitespace-pre-wrap rounded bg-muted/50 p-3 text-sm">
                    {appointment.postAppointmentNotes}
                  </p>
                </div>
              ) : null}
              {appointment.clientNotes ? (
                <div>
                  <p className="mb-1 font-medium text-muted-foreground text-sm">
                    Client Notes (Visible in Portal)
                  </p>
                  <p className="whitespace-pre-wrap rounded bg-blue-50 p-3 text-sm dark:bg-blue-900/20">
                    {appointment.clientNotes}
                  </p>
                </div>
              ) : null}
              {!(
                appointment.preAppointmentNotes ||
                appointment.postAppointmentNotes ||
                appointment.clientNotes
              ) && <p className="text-muted-foreground">No notes added</p>}
            </CardContent>
          </Card>

          {/* Cancellation Info */}
          {appointment.status === "CANCELLED" && appointment.cancelledAt ? (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">
                  Cancellation Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Cancelled At
                  </p>
                  <p>
                    {format(
                      new Date(appointment.cancelledAt),
                      "MMMM d, yyyy 'at' h:mm a"
                    )}
                  </p>
                </div>
                {appointment.cancellationReason ? (
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">
                      Reason
                    </p>
                    <p>{appointment.cancellationReason}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {/* Reminders */}
          {appointment.reminders?.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Reminders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {appointment.reminders.map((reminder) => (
                    <div
                      className="flex items-center justify-between rounded border p-3"
                      key={reminder.id}
                    >
                      <div>
                        <p className="font-medium">{reminder.reminderType}</p>
                        <p className="text-muted-foreground text-sm">
                          {reminder.reminderMinutesBefore} minutes before
                        </p>
                      </div>
                      <Badge
                        variant={reminder.isSent ? "default" : "secondary"}
                      >
                        {reminder.isSent ? "Sent" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Audit Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Audit Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 text-sm md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p>
                    {format(
                      new Date(appointment.createdAt),
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </p>
                </div>
                {appointment.confirmedAt ? (
                  <div>
                    <p className="text-muted-foreground">Confirmed</p>
                    <p>
                      {format(
                        new Date(appointment.confirmedAt),
                        "MMM d, yyyy 'at' h:mm a"
                      )}
                    </p>
                  </div>
                ) : null}
                {appointment.completedAt ? (
                  <div>
                    <p className="text-muted-foreground">Completed</p>
                    <p>
                      {format(
                        new Date(appointment.completedAt),
                        "MMM d, yyyy 'at' h:mm a"
                      )}
                    </p>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Dialog */}
      <AlertDialog onOpenChange={setShowCancelDialog} open={showCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the appointment with{" "}
              {appointment.client.displayName}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="cancel-reason">Reason (optional)</Label>
            <Textarea
              className="mt-2"
              id="cancel-reason"
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter cancellation reason..."
              value={cancelReason}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                cancelMutation.mutate();
              }}
            >
              {cancelMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Cancel Appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Dialog */}
      <Dialog onOpenChange={setShowCompleteDialog} open={showCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="post-notes">
                Post-Appointment Notes (optional)
              </Label>
              <Textarea
                id="post-notes"
                onChange={(e) => setPostNotes(e.target.value)}
                placeholder="Enter any notes about how the appointment went..."
                rows={4}
                value={postNotes}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowCompleteDialog(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={completeMutation.isPending}
              onClick={() => completeMutation.mutate()}
            >
              {completeMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog
        onOpenChange={setShowRescheduleDialog}
        open={showRescheduleDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-date">New Date</Label>
                <Input
                  id="new-date"
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setNewScheduledAt(e.target.value)}
                  type="date"
                  value={newScheduledAt}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-time">New Time</Label>
                <Input
                  id="new-time"
                  onChange={(e) => setNewScheduledTime(e.target.value)}
                  type="time"
                  value={newScheduledTime}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reschedule-reason">Reason (optional)</Label>
              <Textarea
                id="reschedule-reason"
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="Enter reason for rescheduling..."
                rows={2}
                value={rescheduleReason}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowRescheduleDialog(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={
                newScheduledAt === undefined ||
                newScheduledTime === "" ||
                rescheduleMutation.isPending
              }
              onClick={() => rescheduleMutation.mutate()}
            >
              {rescheduleMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="mr-2 h-4 w-4" />
              )}
              Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
