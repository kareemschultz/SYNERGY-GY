import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  LogOut,
  MapPin,
  Phone,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { client as api } from "@/utils/orpc";

export const Route = createFileRoute("/portal/appointments")({
  component: PortalAppointments,
});

type Appointment = {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: Date;
  endAt: Date;
  durationMinutes: number;
  status: string;
  locationType: "IN_PERSON" | "PHONE" | "VIDEO";
  location: string | null;
  clientNotes: string | null;
  appointmentType: {
    id: string;
    name: string;
    color: string | null;
  };
  staff?: {
    name: string;
  } | null;
};

const statusConfig: Record<string, { label: string; className: string }> = {
  REQUESTED: {
    label: "Pending",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  CONFIRMED: {
    label: "Confirmed",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  COMPLETED: {
    label: "Completed",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  },
  NO_SHOW: {
    label: "No Show",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  RESCHEDULED: {
    label: "Rescheduled",
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  },
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

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function PortalAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("upcoming");

  useEffect(() => {
    async function loadAppointments() {
      const sessionToken = localStorage.getItem("portal-session");

      if (!sessionToken) {
        await navigate({ to: "/portal/login" });
        return;
      }

      try {
        const data = await api.portal.appointments.list({ limit: 50 });
        setAppointments(data.appointments as Appointment[]);
      } catch (_err) {
        setError("Failed to load appointments. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadAppointments();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.portal.auth.logout();
    } catch (_err) {
      // Ignore error
    } finally {
      localStorage.removeItem("portal-session");
      localStorage.removeItem("portal-user");
      await navigate({ to: "/portal/login" });
    }
  };

  // Filter appointments
  const now = new Date();
  const filteredAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.scheduledAt);
    if (filter === "upcoming") {
      return aptDate >= now && ["REQUESTED", "CONFIRMED"].includes(apt.status);
    }
    if (filter === "past") {
      return (
        aptDate < now ||
        ["COMPLETED", "NO_SHOW", "CANCELLED"].includes(apt.status)
      );
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Alert className="max-w-md" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-slate-200 border-b bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild size="sm" variant="ghost">
                <Link to="/portal">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="font-bold text-slate-900 text-xl dark:text-white">
                  My Appointments
                </h1>
              </div>
            </div>
            <Button onClick={handleLogout} size="sm" variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Filter Tabs */}
          <Tabs onValueChange={setFilter} value={filter}>
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Appointments List */}
          {filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p className="font-medium">No appointments</p>
                  <p className="mt-1 text-sm">
                    {filter === "upcoming"
                      ? "You don't have any upcoming appointments scheduled."
                      : "No appointment history found."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredAppointments.map((apt) => {
                const LocationIcon = locationIcons[apt.locationType];
                const status = statusConfig[apt.status] || {
                  label: apt.status,
                  className: "",
                };

                return (
                  <Card
                    className="transition-shadow hover:shadow-md"
                    key={apt.id}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{
                              backgroundColor:
                                apt.appointmentType.color || "#6b7280",
                            }}
                          />
                          <CardTitle className="text-base">
                            {apt.appointmentType.name}
                          </CardTitle>
                        </div>
                        <Badge className={status.className}>
                          {status.label}
                        </Badge>
                      </div>
                      {apt.title !== apt.appointmentType.name ? (
                        <CardDescription>{apt.title}</CardDescription>
                      ) : null}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(apt.scheduledAt)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {formatTime(apt.scheduledAt)} ({apt.durationMinutes}{" "}
                          min)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <LocationIcon className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {locationLabels[apt.locationType]}
                          {apt.location ? ` - ${apt.location}` : ""}
                        </span>
                      </div>

                      {apt.staff ? (
                        <div className="text-muted-foreground text-sm">
                          With: {apt.staff.name}
                        </div>
                      ) : null}

                      {apt.clientNotes ? (
                        <div className="mt-2 rounded-md bg-muted p-3 text-sm">
                          <p className="font-medium text-muted-foreground text-xs uppercase">
                            Notes
                          </p>
                          <p className="mt-1">{apt.clientNotes}</p>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
