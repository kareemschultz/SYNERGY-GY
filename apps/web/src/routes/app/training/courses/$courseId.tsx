/**
 * Course Detail Page
 *
 * Displays detailed information about a training course including
 * all scheduled sessions and management actions.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Plus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { ScheduleTable } from "@/components/training/schedule-table";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/app/training/courses/$courseId")({
  loader: async ({ params }) => {
    const course = await orpc.training.courses.get.query({
      id: params.courseId,
    });
    return { course };
  },
  component: CourseDetailPage,
});

const CATEGORY_LABELS: Record<string, string> = {
  HUMAN_RESOURCES: "Human Resources",
  CUSTOMER_RELATIONS: "Customer Relations",
  BUSINESS_DEVELOPMENT: "Business Development",
  COMPLIANCE: "Compliance",
  OTHER: "Other",
};

function CourseDetailPage() {
  const { course } = Route.useLoaderData();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [scheduleFormData, setScheduleFormData] = useState({
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    location: "",
    instructor: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const priceInDollars = (course.price / 100).toFixed(2);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const startDateTime = new Date(
        `${scheduleFormData.startDate}T${scheduleFormData.startTime}`
      );
      const endDateTime = new Date(
        `${scheduleFormData.endDate}T${scheduleFormData.endTime}`
      );

      await orpc.training.schedules.create.mutate({
        courseId: course.id,
        startDate: startDateTime,
        endDate: endDateTime,
        location: scheduleFormData.location,
        instructor: scheduleFormData.instructor,
        status: "SCHEDULED",
      });

      toast({
        title: "Schedule created",
        description: "The training session has been scheduled successfully.",
      });

      setIsScheduleDialogOpen(false);
      setScheduleFormData({
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        location: "",
        instructor: "",
      });

      // Refresh the page
      navigate({
        to: "/app/training/courses/$courseId",
        params: { courseId: course.id },
        replace: true,
      });
    } catch (error) {
      toast({
        title: "Failed to create schedule",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while creating the schedule.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScheduleInputChange = (field: string, value: string) => {
    setScheduleFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center gap-4">
        <Button
          onClick={() => navigate({ to: "/app/training" })}
          size="icon"
          variant="ghost"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="font-bold text-3xl tracking-tight">{course.title}</h1>
          <p className="text-muted-foreground">
            {CATEGORY_LABELS[course.category] || course.category}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit Course
          </Button>
          {!course.isActive && <Badge variant="secondary">Inactive</Badge>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!!course.description && (
                <div>
                  <h3 className="font-medium text-muted-foreground text-sm">
                    Description
                  </h3>
                  <p className="mt-1">{course.description}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-sm">Duration</p>
                    <p className="font-medium">{course.duration} hours</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Max Participants
                    </p>
                    <p className="font-medium">
                      {course.maxParticipants} people
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-sm">Price</p>
                    <p className="font-medium">${priceInDollars} GYD</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Total Schedules
                    </p>
                    <p className="font-medium">{course.schedules.length}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Scheduled Sessions</CardTitle>
                  <CardDescription>
                    Upcoming and past training sessions for this course
                  </CardDescription>
                </div>
                <Button onClick={() => setIsScheduleDialogOpen(true)} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Schedule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScheduleTable
                maxParticipants={course.maxParticipants}
                schedules={course.schedules}
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
                <p className="text-muted-foreground text-sm">
                  Total Enrollments
                </p>
                <p className="font-bold text-2xl">
                  {course.schedules.reduce(
                    (sum, s) => sum + s.enrollmentCount,
                    0
                  )}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground text-sm">
                  Upcoming Sessions
                </p>
                <p className="font-bold text-2xl">
                  {
                    course.schedules.filter(
                      (s) =>
                        s.status === "SCHEDULED" || s.status === "IN_PROGRESS"
                    ).length
                  }
                </p>
              </div>

              <div>
                <p className="text-muted-foreground text-sm">
                  Completed Sessions
                </p>
                <p className="font-bold text-2xl">
                  {
                    course.schedules.filter((s) => s.status === "COMPLETED")
                      .length
                  }
                </p>
              </div>

              <div>
                <p className="text-muted-foreground text-sm">Created</p>
                <p className="font-medium">
                  {format(new Date(course.createdAt), "MMM dd, yyyy")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        onOpenChange={setIsScheduleDialogOpen}
        open={isScheduleDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Training Session</DialogTitle>
            <DialogDescription>
              Create a new scheduled session for {course.title}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleCreateSchedule}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Start Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startDate"
                  onChange={(e) =>
                    handleScheduleInputChange("startDate", e.target.value)
                  }
                  required
                  type="date"
                  value={scheduleFormData.startDate}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">
                  Start Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startTime"
                  onChange={(e) =>
                    handleScheduleInputChange("startTime", e.target.value)
                  }
                  required
                  type="time"
                  value={scheduleFormData.startTime}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="endDate">
                  End Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="endDate"
                  onChange={(e) =>
                    handleScheduleInputChange("endDate", e.target.value)
                  }
                  required
                  type="date"
                  value={scheduleFormData.endDate}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">
                  End Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="endTime"
                  onChange={(e) =>
                    handleScheduleInputChange("endTime", e.target.value)
                  }
                  required
                  type="time"
                  value={scheduleFormData.endTime}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">
                Location <span className="text-destructive">*</span>
              </Label>
              <Input
                id="location"
                onChange={(e) =>
                  handleScheduleInputChange("location", e.target.value)
                }
                placeholder="e.g., GCMC Training Room"
                required
                value={scheduleFormData.location}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructor">
                Instructor <span className="text-destructive">*</span>
              </Label>
              <Input
                id="instructor"
                onChange={(e) =>
                  handleScheduleInputChange("instructor", e.target.value)
                }
                placeholder="e.g., Jane Doe"
                required
                value={scheduleFormData.instructor}
              />
            </div>

            <DialogFooter>
              <Button
                disabled={isSubmitting}
                onClick={() => setIsScheduleDialogOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? "Creating..." : "Create Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
