/**
 * Schedule Detail Page
 *
 * Displays detailed information about a training schedule including
 * enrolled participants and enrollment management.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Loader2, MapPin, Plus, User } from "lucide-react";
import { useState } from "react";
import { EnrollmentList } from "@/components/training/enrollment-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/app/training/schedules/$schedule-id")({
  component: ScheduleDetailPage,
});

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  SCHEDULED: "default",
  IN_PROGRESS: "secondary",
  COMPLETED: "outline",
  CANCELLED: "destructive",
};

function ScheduleDetailPage() {
  const { "schedule-id": scheduleId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");

  const { data: schedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ["training-schedule", scheduleId],
    queryFn: () => client.training.getSchedule({ id: scheduleId }),
  });

  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ["clients-for-enrollment"],
    queryFn: () => client.clients.list({}),
  });

  const enrollMutation = useMutation({
    mutationFn: (data: {
      scheduleId: string;
      clientId: string;
      status: "REGISTERED" | "CONFIRMED" | "ATTENDED" | "CANCELLED" | "NO_SHOW";
      paymentStatus: "PENDING" | "PAID" | "PARTIAL" | "REFUNDED";
    }) => client.training.createEnrollment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["training-schedule", scheduleId],
      });
      toast({
        title: "Client enrolled",
        description:
          "The client has been successfully enrolled in this training session.",
      });
      setIsEnrollDialogOpen(false);
      setSelectedClientId("");
    },
    onError: (error) => {
      toast({
        title: "Failed to enroll client",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while enrolling the client.",
        variant: "destructive",
      });
    },
  });

  const updateEnrollmentMutation = useMutation({
    mutationFn: (data: {
      id: string;
      data: {
        status?:
          | "REGISTERED"
          | "CONFIRMED"
          | "ATTENDED"
          | "CANCELLED"
          | "NO_SHOW";
        paymentStatus?: "PENDING" | "PAID" | "PARTIAL" | "REFUNDED";
      };
    }) => client.training.updateEnrollment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["training-schedule", scheduleId],
      });
      toast({
        title: "Status updated",
        description: "Enrollment status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update status",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while updating the status.",
        variant: "destructive",
      });
    },
  });

  const issueCertificateMutation = useMutation({
    mutationFn: (data: { id: string }) =>
      client.training.issueCertificate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["training-schedule", scheduleId],
      });
      toast({
        title: "Certificate issued",
        description: "Training certificate has been issued successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to issue certificate",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while issuing the certificate.",
        variant: "destructive",
      });
    },
  });

  const handleEnrollClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      return;
    }

    enrollMutation.mutate({
      scheduleId,
      clientId: selectedClientId,
      status: "REGISTERED",
      paymentStatus: "PENDING",
    });
  };

  const handleUpdateEnrollmentStatus = (
    enrollmentId: string,
    status: string
  ) => {
    updateEnrollmentMutation.mutate({
      id: enrollmentId,
      data: {
        status: status as
          | "REGISTERED"
          | "CONFIRMED"
          | "ATTENDED"
          | "CANCELLED"
          | "NO_SHOW",
      },
    });
  };

  const handleIssueCertificate = (enrollmentId: string) => {
    issueCertificateMutation.mutate({ id: enrollmentId });
  };

  if (scheduleLoading || clientsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="container mx-auto py-6">
        <p className="text-muted-foreground">Schedule not found</p>
      </div>
    );
  }

  const clients = clientsData?.clients ?? [];
  const priceInDollars = (schedule.coursePrice / 100).toFixed(2);
  const availableSpots = schedule.maxParticipants - schedule.enrollments.length;
  const isFull = availableSpots <= 0;

  // Filter out already enrolled clients
  const enrolledClientIds = new Set(
    schedule.enrollments.map((e: { clientId: string }) => e.clientId)
  );
  const availableClients = clients.filter(
    (c: { id: string }) => !enrolledClientIds.has(c.id)
  );

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center gap-4">
        <Button
          onClick={() =>
            navigate({
              to: "/app/training/courses/$courseId",
              params: { courseId: schedule.courseId },
            })
          }
          size="icon"
          variant="ghost"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="font-bold text-3xl tracking-tight">
            {schedule.courseTitle}
          </h1>
          <p className="text-muted-foreground">
            {format(new Date(schedule.startDate), "MMMM dd, yyyy")}
          </p>
        </div>
        <Badge variant={STATUS_VARIANTS[schedule.status] || "default"}>
          {STATUS_LABELS[schedule.status] || schedule.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!!schedule.courseDescription && (
                <div>
                  <h3 className="font-medium text-muted-foreground text-sm">
                    Course Description
                  </h3>
                  <p className="mt-1">{schedule.courseDescription}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Session Date
                    </p>
                    <p className="font-medium">
                      {format(new Date(schedule.startDate), "MMM dd, yyyy")}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {format(new Date(schedule.startDate), "h:mm a")} -{" "}
                      {format(new Date(schedule.endDate), "h:mm a")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-sm">Location</p>
                    <p className="font-medium">{schedule.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-sm">Instructor</p>
                    <p className="font-medium">{schedule.instructor}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-sm">Duration</p>
                    <p className="font-medium">
                      {schedule.courseDuration} hours
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Enrolled Participants</CardTitle>
                  <CardDescription>
                    {schedule.enrollments.length} of {schedule.maxParticipants}{" "}
                    spots filled
                  </CardDescription>
                </div>
                <Button
                  disabled={
                    isFull ||
                    schedule.status === "CANCELLED" ||
                    schedule.status === "COMPLETED"
                  }
                  onClick={() => setIsEnrollDialogOpen(true)}
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Enroll Client
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <EnrollmentList
                enrollments={schedule.enrollments}
                onIssueCertificate={handleIssueCertificate}
                onUpdateStatus={handleUpdateEnrollmentStatus}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-muted-foreground text-sm">Available Spots</p>
                <p className="font-bold text-2xl">
                  {availableSpots} / {schedule.maxParticipants}
                </p>
                {!!isFull && (
                  <Badge className="mt-2" variant="secondary">
                    Full
                  </Badge>
                )}
              </div>

              <div>
                <p className="text-muted-foreground text-sm">Attendance Rate</p>
                <p className="font-bold text-2xl">
                  {schedule.enrollments.length > 0
                    ? Math.round(
                        (schedule.enrollments.filter(
                          (e: { status: string }) => e.status === "ATTENDED"
                        ).length /
                          schedule.enrollments.length) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>

              <div>
                <p className="text-muted-foreground text-sm">
                  Certificates Issued
                </p>
                <p className="font-bold text-2xl">
                  {
                    schedule.enrollments.filter(
                      (e: { certificateNumber: string | null }) =>
                        e.certificateNumber
                    ).length
                  }
                </p>
              </div>

              <div>
                <p className="text-muted-foreground text-sm">Course Price</p>
                <p className="font-medium">${priceInDollars} GYD</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full" variant="outline">
                <Link
                  params={{ courseId: schedule.courseId }}
                  to="/app/training/courses/$courseId"
                >
                  View Course Details
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog onOpenChange={setIsEnrollDialogOpen} open={isEnrollDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enroll Client</DialogTitle>
            <DialogDescription>
              Add a client to this training session
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleEnrollClient}>
            <div className="space-y-2">
              <Label htmlFor="client">
                Select Client <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={setSelectedClientId}
                required
                value={selectedClientId}
              >
                <SelectTrigger id="client">
                  <SelectValue placeholder="Choose a client..." />
                </SelectTrigger>
                <SelectContent>
                  {availableClients.length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground text-sm">
                      All clients are already enrolled
                    </div>
                  ) : (
                    availableClients.map(
                      (c: { id: string; displayName: string }) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.displayName}
                        </SelectItem>
                      )
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                disabled={enrollMutation.isPending}
                onClick={() => setIsEnrollDialogOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={
                  enrollMutation.isPending || availableClients.length === 0
                }
                type="submit"
              >
                {enrollMutation.isPending ? "Enrolling..." : "Enroll Client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
