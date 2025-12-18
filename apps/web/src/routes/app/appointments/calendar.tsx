import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, List, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/app/appointments/calendar")({
  component: AppointmentsCalendarPage,
});

type AppointmentStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "RESCHEDULED";

type CalendarAppointment = {
  id: string;
  title: string;
  scheduledAt: Date | string;
  endAt: Date | string;
  durationMinutes: number;
  status: AppointmentStatus;
  locationType: "IN_PERSON" | "PHONE" | "VIDEO";
  location?: string | null;
  client: {
    id: string;
    displayName: string;
    phone?: string | null;
  };
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
    };
  } | null;
};

function AppointmentsCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] =
    useState<CalendarAppointment | null>(null);
  const [businessFilter, setBusinessFilter] = useState<"all" | "GCMC" | "KAJ">(
    "all"
  );

  // Calculate the date range for the visible calendar (including overflow days)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const { data, isLoading } = useQuery({
    queryKey: [
      "appointments",
      "calendar",
      format(calendarStart, "yyyy-MM-dd"),
      format(calendarEnd, "yyyy-MM-dd"),
      businessFilter,
    ],
    queryFn: () =>
      client.appointments.list({
        fromDate: calendarStart.toISOString(),
        toDate: calendarEnd.toISOString(),
        business: businessFilter === "all" ? undefined : businessFilter,
        limit: 500,
      }),
  });

  const appointments = data?.appointments ?? [];

  // Generate calendar days
  const calendarDays: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    calendarDays.push(day);
    day = addDays(day, 1);
  }

  // Group appointments by date
  const appointmentsByDate = appointments.reduce<
    Record<string, CalendarAppointment[]>
  >((acc, apt) => {
    const dateKey = format(new Date(apt.scheduledAt), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(apt);
    return acc;
  }, {});

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/app/appointments">
                <List className="mr-2 h-4 w-4" />
                List View
              </Link>
            </Button>
            <Button asChild>
              <Link to="/app/appointments/new">
                <Plus className="mr-2 h-4 w-4" />
                New Appointment
              </Link>
            </Button>
          </div>
        }
        description="View appointments in calendar format"
        title="Appointments Calendar"
      />

      {/* Calendar Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={handlePrevMonth} size="icon" variant="outline">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button onClick={handleToday} variant="outline">
            Today
          </Button>
          <Button onClick={handleNextMonth} size="icon" variant="outline">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="ml-2 font-semibold text-lg">
            {format(currentDate, "MMMM yyyy")}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Select
            onValueChange={(v) =>
              setBusinessFilter(v as "all" | "GCMC" | "KAJ")
            }
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
      </div>

      {/* Calendar Grid */}
      <div className="rounded-lg border bg-card">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
            <div
              className="border-r p-2 text-center font-medium text-muted-foreground text-sm last:border-r-0"
              key={dayName}
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        {isLoading ? (
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {calendarDays.map((calendarDay, idx) => {
              const dateKey = format(calendarDay, "yyyy-MM-dd");
              const dayAppointments = appointmentsByDate[dateKey] ?? [];
              const isCurrentMonth = isSameMonth(calendarDay, currentDate);
              const isToday = isSameDay(calendarDay, new Date());

              return (
                <div
                  className={cn(
                    "min-h-28 border-r border-b p-1 last:border-r-0",
                    "[&:nth-child(7n)]:border-r-0",
                    !isCurrentMonth && "bg-muted/30"
                  )}
                  key={idx}
                >
                  <div
                    className={cn(
                      "mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm",
                      isToday &&
                        "bg-primary font-semibold text-primary-foreground",
                      !isCurrentMonth && "text-muted-foreground"
                    )}
                  >
                    {format(calendarDay, "d")}
                  </div>
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map((apt) => (
                      <button
                        className={cn(
                          "block w-full truncate rounded px-1 py-0.5 text-left text-xs transition-colors hover:opacity-80",
                          apt.status === "CANCELLED" &&
                            "line-through opacity-60"
                        )}
                        key={apt.id}
                        onClick={() => setSelectedAppointment(apt)}
                        style={{
                          backgroundColor: `${apt.appointmentType.color ?? "#6b7280"}20`,
                          borderLeft: `3px solid ${apt.appointmentType.color ?? "#6b7280"}`,
                        }}
                        type="button"
                      >
                        <span className="font-medium">
                          {format(new Date(apt.scheduledAt), "HH:mm")}
                        </span>{" "}
                        {apt.client.displayName}
                      </button>
                    ))}
                    {dayAppointments.length > 3 && (
                      <p className="px-1 text-muted-foreground text-xs">
                        +{dayAppointments.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-amber-500" />
          <span>Requested</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span>Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-gray-400" />
          <span>Cancelled</span>
        </div>
      </div>

      {/* Appointment Detail Dialog */}
      <Dialog
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
        open={selectedAppointment !== null}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{
                  backgroundColor:
                    selectedAppointment?.appointmentType.color ?? "#6b7280",
                }}
              />
              {selectedAppointment?.appointmentType.name}
            </DialogTitle>
          </DialogHeader>
          {selectedAppointment ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <AppointmentStatusBadge status={selectedAppointment.status} />
                <Badge variant="outline">
                  {selectedAppointment.locationType.replace("_", " ")}
                </Badge>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Client</p>
                  <p>{selectedAppointment.client.displayName}</p>
                  {selectedAppointment.client.phone ? (
                    <p className="text-muted-foreground">
                      {selectedAppointment.client.phone}
                    </p>
                  ) : null}
                </div>

                <div>
                  <p className="font-medium text-muted-foreground">
                    Date & Time
                  </p>
                  <p>
                    {format(
                      new Date(selectedAppointment.scheduledAt),
                      "EEEE, MMMM d, yyyy"
                    )}
                  </p>
                  <p>
                    {format(
                      new Date(selectedAppointment.scheduledAt),
                      "h:mm a"
                    )}{" "}
                    - {selectedAppointment.durationMinutes} minutes
                  </p>
                </div>

                {selectedAppointment.location ? (
                  <div>
                    <p className="font-medium text-muted-foreground">
                      Location
                    </p>
                    <p>{selectedAppointment.location}</p>
                  </div>
                ) : null}

                {selectedAppointment.assignedStaff ? (
                  <div>
                    <p className="font-medium text-muted-foreground">
                      Assigned Staff
                    </p>
                    <p>
                      {selectedAppointment.assignedStaff.user.name ?? "Staff"}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button asChild variant="outline">
                  <Link
                    params={{ "appointment-id": selectedAppointment.id }}
                    to="/app/appointments/$appointment-id"
                  >
                    View Details
                  </Link>
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
