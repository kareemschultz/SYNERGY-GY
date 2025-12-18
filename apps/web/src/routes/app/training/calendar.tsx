/**
 * Training Calendar Page
 *
 * Displays a calendar view of all training sessions with scheduling
 * capabilities and quick access to session details.
 */

import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  Users,
} from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/app/training/calendar")({
  component: TrainingCalendarPage,
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

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-500",
  IN_PROGRESS: "bg-yellow-500",
  COMPLETED: "bg-green-500",
  CANCELLED: "bg-red-500",
};

type Schedule = {
  id: string;
  courseId: string;
  courseTitle: string;
  startDate: Date;
  endDate: Date;
  location: string;
  instructor: string;
  status: string;
  maxParticipants: number;
  enrollmentCount: number;
};

function TrainingCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Get first and last day of the visible calendar
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const { data: schedules, isLoading } = useQuery({
    queryKey: [
      "training-schedules",
      {
        startDateFrom: calendarStart,
        startDateTo: calendarEnd,
        status: statusFilter,
      },
    ],
    queryFn: () =>
      client.training.listSchedules({
        startDateFrom: calendarStart,
        startDateTo: calendarEnd,
        status:
          statusFilter === "all"
            ? undefined
            : (statusFilter as
                | "SCHEDULED"
                | "IN_PROGRESS"
                | "COMPLETED"
                | "CANCELLED"),
      }),
  });

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleScheduleClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsSheetOpen(true);
  };

  // Get calendar days
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group schedules by date
  const schedulesByDate = (schedules ?? []).reduce(
    (acc, schedule) => {
      const dateKey = format(new Date(schedule.startDate), "yyyy-MM-dd");
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(schedule);
      return acc;
    },
    {} as Record<string, Schedule[]>
  );

  return (
    <div className="flex flex-col">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Training", href: "/app/training" },
          { label: "Calendar" },
        ]}
        description="View training schedules in calendar format"
        title="Training Calendar"
      />

      <div className="p-6">
        {/* Calendar Controls */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button onClick={handlePreviousMonth} size="icon" variant="outline">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button onClick={handleNextMonth} size="icon" variant="outline">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button onClick={handleToday} variant="outline">
              Today
            </Button>
            <h2 className="ml-4 font-semibold text-xl">
              {format(currentDate, "MMMM yyyy")}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Select onValueChange={setStatusFilter} value={statusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button asChild variant="outline">
              <Link to="/app/training">
                <CalendarIcon className="mr-2 h-4 w-4" />
                List View
              </Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          /* Calendar Grid */
          <Card>
            <CardContent className="p-0">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 border-b">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      className="p-2 text-center font-medium text-muted-foreground text-sm"
                      key={day}
                    >
                      {day}
                    </div>
                  )
                )}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7">
                {days.map((day, dayIdx) => {
                  const dateKey = format(day, "yyyy-MM-dd");
                  const daySchedules = schedulesByDate[dateKey] || [];
                  const isCurrentMonth = isSameMonth(day, currentDate);

                  return (
                    <div
                      className={cn(
                        "min-h-32 border-r border-b p-1",
                        !isCurrentMonth && "bg-muted/30",
                        dayIdx % 7 === 6 && "border-r-0"
                      )}
                      key={day.toISOString()}
                    >
                      <div
                        className={cn(
                          "mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm",
                          isToday(day) && "bg-primary text-primary-foreground",
                          !(isToday(day) || isCurrentMonth) &&
                            "text-muted-foreground"
                        )}
                      >
                        {format(day, "d")}
                      </div>
                      <div className="space-y-1">
                        {daySchedules.slice(0, 3).map((schedule) => (
                          <button
                            className={cn(
                              "w-full truncate rounded px-1 py-0.5 text-left text-white text-xs",
                              STATUS_COLORS[schedule.status] || "bg-gray-500"
                            )}
                            key={schedule.id}
                            onClick={() => handleScheduleClick(schedule)}
                            type="button"
                          >
                            {format(new Date(schedule.startDate), "HH:mm")}{" "}
                            {schedule.courseTitle}
                          </button>
                        ))}
                        {daySchedules.length > 3 && (
                          <div className="px-1 text-muted-foreground text-xs">
                            +{daySchedules.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <span className="text-muted-foreground text-sm">Legend:</span>
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div className="flex items-center gap-1" key={status}>
              <div className={cn("h-3 w-3 rounded", color)} />
              <span className="text-sm">{STATUS_LABELS[status]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Detail Sheet */}
      <Sheet onOpenChange={setIsSheetOpen} open={isSheetOpen}>
        <SheetContent>
          {selectedSchedule ? (
            <>
              <SheetHeader>
                <SheetTitle>{selectedSchedule.courseTitle}</SheetTitle>
                <SheetDescription>Training session details</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      STATUS_VARIANTS[selectedSchedule.status] || "default"
                    }
                  >
                    {STATUS_LABELS[selectedSchedule.status] ||
                      selectedSchedule.status}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {format(
                          new Date(selectedSchedule.startDate),
                          "EEEE, MMMM d, yyyy"
                        )}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {format(new Date(selectedSchedule.startDate), "h:mm a")}{" "}
                        - {format(new Date(selectedSchedule.endDate), "h:mm a")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{selectedSchedule.location}</p>
                      <p className="text-muted-foreground text-sm">Location</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {selectedSchedule.instructor}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Instructor
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {selectedSchedule.enrollmentCount} /{" "}
                        {selectedSchedule.maxParticipants} participants
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {selectedSchedule.maxParticipants -
                          selectedSchedule.enrollmentCount}{" "}
                        spots available
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Link
                      params={{ scheduleId: selectedSchedule.id }}
                      to="/app/training/schedules/$scheduleId"
                    >
                      View Full Details
                    </Link>
                  </Button>
                  <Button asChild className="w-full" variant="outline">
                    <Link
                      params={{ courseId: selectedSchedule.courseId }}
                      to="/app/training/courses/$courseId"
                    >
                      View Course
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
