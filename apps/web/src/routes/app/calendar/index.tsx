import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Plus,
  Repeat,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { client, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/app/calendar/")({
  component: CalendarPage,
});

const typeLabels: Record<string, { label: string; className: string }> = {
  FILING: {
    label: "Filing",
    className: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  RENEWAL: {
    label: "Renewal",
    className: "bg-purple-500/10 text-purple-600 border-purple-200",
  },
  PAYMENT: {
    label: "Payment",
    className: "bg-green-500/10 text-green-600 border-green-200",
  },
  SUBMISSION: {
    label: "Submission",
    className: "bg-amber-500/10 text-amber-600 border-amber-200",
  },
  MEETING: {
    label: "Meeting",
    className: "bg-cyan-500/10 text-cyan-600 border-cyan-200",
  },
  FOLLOWUP: {
    label: "Follow-up",
    className: "bg-pink-500/10 text-pink-600 border-pink-200",
  },
  OTHER: {
    label: "Other",
    className: "bg-gray-500/10 text-gray-600 border-gray-200",
  },
};

const priorityStyles: Record<string, string> = {
  LOW: "border-l-gray-400",
  NORMAL: "border-l-blue-400",
  HIGH: "border-l-orange-400",
  URGENT: "border-l-red-500",
};

function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [businessFilter, setBusinessFilter] = useState<string>("all");

  // Get first and last day of month
  const firstDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const lastDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );

  const { data: calendarData, isLoading } = useQuery({
    queryKey: [
      "calendarData",
      firstDay.toISOString(),
      lastDay.toISOString(),
      businessFilter,
    ],
    queryFn: () =>
      client.deadlines.getCalendarData({
        startDate: firstDay.toISOString(),
        endDate: lastDay.toISOString(),
        business:
          businessFilter === "all"
            ? undefined
            : (businessFilter as "GCMC" | "KAJ"),
      }),
  });

  const { data: stats } = useQuery({
    queryKey: ["deadlineStats"],
    queryFn: () => client.deadlines.getStats(),
  });

  const { data: overdue } = useQuery({
    queryKey: ["overdueDeadlines"],
    queryFn: () => client.deadlines.getOverdue(),
  });

  const { data: upcoming } = useQuery({
    queryKey: ["upcomingDeadlines"],
    queryFn: () => client.deadlines.getUpcoming({ days: 7, limit: 10 }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => client.deadlines.complete({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendarData"] });
      queryClient.invalidateQueries({ queryKey: ["deadlineStats"] });
      queryClient.invalidateQueries({ queryKey: ["overdueDeadlines"] });
      queryClient.invalidateQueries({ queryKey: ["upcomingDeadlines"] });
      toast.success("Deadline marked as complete");
    },
    onError: () => toast.error("Failed to complete deadline"),
  });

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar grid
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();
  const calendarDays: (number | null)[] = [];

  // Add empty cells for days before the first of the month
  for (let i = 0; i < startDayOfWeek; i += 1) {
    calendarDays.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day += 1) {
    calendarDays.push(day);
  }

  // Group deadlines by date
  const deadlinesByDate: Record<string, typeof calendarData> = {};
  if (calendarData) {
    for (const d of calendarData) {
      const dateKey = new Date(d.dueDate).getDate().toString();
      if (!deadlinesByDate[dateKey]) {
        deadlinesByDate[dateKey] = [];
      }
      deadlinesByDate[dateKey].push(d);
    }
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear();

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <Button asChild>
            <Link to="/app/calendar/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Deadline
            </Link>
          </Button>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Calendar" },
        ]}
        description="Track deadlines, filings, and important dates"
        title="Calendar"
      />

      <div className="p-6">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Main Calendar */}
          <div className="lg:col-span-3">
            {/* Stats Cards */}
            {stats ? (
              <div className="mb-6 grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium text-sm">Overdue</span>
                    </div>
                    <p className="mt-1 font-semibold text-2xl">
                      {stats.overdue}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-amber-600">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium text-sm">Due This Week</span>
                    </div>
                    <p className="mt-1 font-semibold text-2xl">
                      {stats.dueThisWeek}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="h-4 w-4" />
                      <span className="font-medium text-sm">
                        Completed This Month
                      </span>
                    </div>
                    <p className="mt-1 font-semibold text-2xl">
                      {stats.completedThisMonth}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-blue-600">
                      <CalendarIcon className="h-4 w-4" />
                      <span className="font-medium text-sm">Total Pending</span>
                    </div>
                    <p className="mt-1 font-semibold text-2xl">
                      {stats.totalPending}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {/* Calendar Header */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CardTitle className="text-xl">
                      {monthNames[currentDate.getMonth()]}{" "}
                      {currentDate.getFullYear()}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Button
                        onClick={goToPreviousMonth}
                        size="icon"
                        variant="ghost"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button onClick={goToToday} size="sm" variant="outline">
                        Today
                      </Button>
                      <Button
                        onClick={goToNextMonth}
                        size="icon"
                        variant="ghost"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Select
                    onValueChange={setBusinessFilter}
                    value={businessFilter}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Business" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Businesses</SelectItem>
                      <SelectItem value="GCMC">GCMC</SelectItem>
                      <SelectItem value="KAJ">KAJ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex h-96 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-px rounded-lg bg-muted">
                    {/* Day headers */}
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day) => (
                        <div
                          className="bg-background py-2 text-center font-medium text-muted-foreground text-sm"
                          key={day}
                        >
                          {day}
                        </div>
                      )
                    )}
                    {/* Calendar cells */}
                    {/* biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Auto-fix */}
                    {calendarDays.map((day, index) => {
                      const dayDeadlines = day
                        ? deadlinesByDate[day.toString()]
                        : [];
                      const shouldHighlightToday = day ? isToday(day) : false;
                      return (
                        <div
                          className={`min-h-24 bg-background p-1 ${
                            shouldHighlightToday
                              ? "ring-2 ring-primary ring-inset"
                              : ""
                          }`}
                          // biome-ignore lint/suspicious/noArrayIndexKey: Auto-fix
                          key={index}
                        >
                          {day ? (
                            <>
                              <div
                                className={`mb-1 text-right text-sm ${
                                  isToday(day)
                                    ? "font-bold text-primary"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {day}
                              </div>
                              <div className="space-y-1">
                                {dayDeadlines?.slice(0, 3).map((d) => (
                                  <div
                                    className={`cursor-pointer truncate rounded border-l-2 bg-muted/50 px-1 py-0.5 text-xs hover:bg-muted ${
                                      priorityStyles[d.priority]
                                    } ${d.isCompleted ? "line-through opacity-50" : ""}`}
                                    key={d.id}
                                    title={d.title}
                                  >
                                    <div className="flex items-center gap-1">
                                      {(d.recurrencePattern !== "NONE" ||
                                        d.parentDeadlineId) && (
                                        <Repeat className="h-3 w-3 shrink-0 text-muted-foreground" />
                                      )}
                                      <span className="truncate">
                                        {d.title}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                                {!!dayDeadlines && dayDeadlines.length > 3 ? (
                                  <div className="text-muted-foreground text-xs">
                                    +{dayDeadlines.length - 3} more
                                  </div>
                                ) : null}
                              </div>
                            </>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Overdue */}
            {!!overdue && overdue.length > 0 ? (
              <Card className="border-red-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    Overdue
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {overdue.map((d) => (
                    <DeadlineItem
                      deadline={d}
                      key={d.id}
                      onComplete={() => completeMutation.mutate(d.id)}
                    />
                  ))}
                </CardContent>
              </Card>
            ) : null}

            {/* Upcoming */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4" />
                  Upcoming (7 days)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {upcoming ? (
                  // biome-ignore lint/style/noNestedTernary: Auto-fix
                  upcoming.length > 0 ? (
                    upcoming.map((d) => (
                      <DeadlineItem
                        deadline={d}
                        key={d.id}
                        onComplete={() => completeMutation.mutate(d.id)}
                      />
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No upcoming deadlines
                    </p>
                  )
                ) : null}
              </CardContent>
            </Card>

            {/* Legend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Deadline Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(typeLabels).map(
                  ([key, { label, className }]) => (
                    <div className="flex items-center gap-2" key={key}>
                      <Badge className={className} variant="outline">
                        {label}
                      </Badge>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

type DeadlineItemProps = {
  deadline: {
    id: string;
    title: string;
    dueDate: Date;
    type: string;
    priority: string;
    isCompleted: boolean;
    recurrencePattern?: string;
    parentDeadlineId?: string | null;
    client?: { id: string; displayName: string } | null;
    matter?: { id: string; referenceNumber: string } | null;
  };
  onComplete: () => void;
};

function DeadlineItem({ deadline, onComplete }: DeadlineItemProps) {
  const type = typeLabels[deadline.type] || typeLabels.OTHER;
  const dueDate = new Date(deadline.dueDate);
  const isOverdue = dueDate < new Date() && !deadline.isCompleted;
  const isRecurring =
    deadline.recurrencePattern !== "NONE" || deadline.parentDeadlineId;

  return (
    <div
      className={`rounded-lg border p-2 ${
        isOverdue ? "border-red-200 bg-red-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            {isRecurring ? (
              <Repeat className="h-3 w-3 shrink-0 text-muted-foreground" />
            ) : null}
            <p className="truncate font-medium text-sm">{deadline.title}</p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <Badge className={type.className} variant="outline">
              {type.label}
            </Badge>
            {deadline.client ? (
              <span className="truncate text-muted-foreground text-xs">
                {deadline.client.displayName}
              </span>
            ) : null}
          </div>
          <p
            className={`mt-1 text-xs ${
              isOverdue ? "font-medium text-red-600" : "text-muted-foreground"
            }`}
          >
            {dueDate.toLocaleDateString()}
          </p>
        </div>
        {!deadline.isCompleted && (
          <Button
            className="h-6 w-6 shrink-0"
            onClick={onComplete}
            size="icon"
            variant="ghost"
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
