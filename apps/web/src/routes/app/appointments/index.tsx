import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  Plus,
  Search,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/app/appointments/")({
  component: AppointmentsPage,
});

type AppointmentStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "RESCHEDULED";

function AppointmentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">(
    "all"
  );
  const [dateRange, setDateRange] = useState<
    "today" | "week" | "month" | "all"
  >("week");
  const [search, setSearch] = useState("");
  const [businessFilter, setBusinessFilter] = useState<string>("all");
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (dateRange) {
      case "today":
        return {
          startDate: startOfDay.toISOString(),
          endDate: new Date(
            startOfDay.getTime() + 24 * 60 * 60 * 1000
          ).toISOString(),
        };
      case "week":
        return {
          startDate: startOfWeek.toISOString(),
          endDate: new Date(
            startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
        };
      case "month":
        return {
          startDate: startOfMonth.toISOString(),
          endDate: new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0
          ).toISOString(),
        };
      default:
        return {};
    }
  };

  const { startDate, endDate } = getDateRange();

  // Query for staff list (for filter dropdown)
  const { data: staffData } = useQuery({
    queryKey: ["admin", "staff", "forFilter"],
    queryFn: () =>
      client.admin.staff.list({ limit: 100, isActive: true, sortBy: "name" }),
    staleTime: 60_000,
  });

  // Query for appointment types (for filter dropdown)
  const { data: typesData } = useQuery({
    queryKey: ["appointments", "types", "forFilter"],
    queryFn: () => client.appointments.types.list({ includeInactive: false }),
    staleTime: 60_000,
  });

  const {
    data: appointmentsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "appointments",
      {
        statusFilter,
        startDate,
        endDate,
        search,
        businessFilter,
        staffFilter,
        typeFilter,
      },
    ],
    queryFn: () =>
      client.appointments.list({
        status: statusFilter === "all" ? undefined : statusFilter,
        fromDate: startDate,
        toDate: endDate,
        search: search || undefined,
        business:
          businessFilter === "all"
            ? undefined
            : (businessFilter as "GCMC" | "KAJ"),
        staffId: staffFilter === "all" ? undefined : staffFilter,
        appointmentTypeId: typeFilter === "all" ? undefined : typeFilter,
        limit: 100,
      }),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => client.appointments.confirm({ id }),
    onSuccess: () => {
      toast.success("Appointment confirmed");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: () => toast.error("Failed to confirm appointment"),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) =>
      client.appointments.cancel({
        id,
        cancellationReason: "Cancelled by staff",
      }),
    onSuccess: () => {
      toast.success("Appointment cancelled");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: () => toast.error("Failed to cancel appointment"),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => client.appointments.complete({ id }),
    onSuccess: () => {
      toast.success("Appointment marked as complete");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: () => toast.error("Failed to complete appointment"),
  });

  const noShowMutation = useMutation({
    mutationFn: (id: string) => client.appointments.markNoShow({ id }),
    onSuccess: () => {
      toast.success("Appointment marked as no show");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: () => toast.error("Failed to mark no show"),
  });

  // Calculate stats
  const appointments = appointmentsData?.appointments ?? [];
  const stats = {
    requested: appointments.filter((a) => a.status === "REQUESTED").length,
    confirmed: appointments.filter((a) => a.status === "CONFIRMED").length,
    completed: appointments.filter((a) => a.status === "COMPLETED").length,
    total: appointments.length,
  };

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          description="Manage client appointments"
          title="Appointments"
        />
        <ErrorState
          action={{ label: "Try again", onClick: () => refetch() }}
          message={error.message}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/app/appointments/calendar">
                <CalendarRange className="mr-2 size-4" />
                Calendar
              </Link>
            </Button>
            <Button asChild>
              <Link to="/app/appointments/new">
                <Plus className="mr-2 size-4" />
                New Appointment
              </Link>
            </Button>
          </div>
        }
        description="Manage client appointments and scheduling"
        title="Appointments"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Pending Approval
            </CardTitle>
            <Clock className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.requested}</div>
            <p className="text-muted-foreground text-xs">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Confirmed</CardTitle>
            <CalendarDays className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.confirmed}</div>
            <p className="text-muted-foreground text-xs">
              Upcoming appointments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Completed</CardTitle>
            <CheckCircle className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.completed}</div>
            <p className="text-muted-foreground text-xs">This period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total</CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.total}</div>
            <p className="text-muted-foreground text-xs">All appointments</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        {/* Primary Filters Row */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Search Input */}
          <div className="relative min-w-64 flex-1">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search appointments..."
              value={search}
            />
          </div>

          {/* Date Range Tabs */}
          <Tabs
            onValueChange={(v) =>
              setDateRange(v as "today" | "week" | "month" | "all")
            }
            value={dateRange}
          >
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
              <TabsTrigger value="all">All Time</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <Select
              onValueChange={(v) =>
                setStatusFilter(v as AppointmentStatus | "all")
              }
              value={statusFilter}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="REQUESTED">Requested</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="NO_SHOW">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Toggle Advanced Filters */}
          <Button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            size="sm"
            variant="outline"
          >
            More Filters
            {showAdvancedFilters ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Advanced Filters Row */}
        {showAdvancedFilters ? (
          <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/30 p-4">
            {/* Business Filter */}
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">Business</span>
              <Select
                onValueChange={(value) => setBusinessFilter(value)}
                value={businessFilter}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Business" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="GCMC">GCMC</SelectItem>
                  <SelectItem value="KAJ">KAJ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Staff Filter */}
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">Staff</span>
              <Select
                onValueChange={(value) => setStaffFilter(value)}
                value={staffFilter}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staffData?.staff?.map(
                    (s: { id: string; userName: string }) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.userName}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Appointment Type Filter */}
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">Type</span>
              <Select
                onValueChange={(value) => setTypeFilter(value)}
                value={typeFilter}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {typesData?.map((t: { id: string; name: string }) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {(businessFilter !== "all" ||
              staffFilter !== "all" ||
              typeFilter !== "all") && (
              <Button
                onClick={() => {
                  setBusinessFilter("all");
                  setStaffFilter("all");
                  setTypeFilter("all");
                }}
                variant="ghost"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : null}
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : // biome-ignore lint/style/noNestedTernary: Cleaner pattern for loading/empty/content states
      appointments.length === 0 ? (
        <EmptyState
          action={{
            label: "New Appointment",
            onClick: () => {
              /* navigate to new */
            },
          }}
          description={
            statusFilter === "all"
              ? "No appointments scheduled for this period."
              : `No ${statusFilter.toLowerCase()} appointments found.`
          }
          icon={Calendar}
          title="No appointments found"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {appointments.map((apt) => (
            <AppointmentCard
              appointment={apt}
              key={apt.id}
              onCancel={(id: string) => cancelMutation.mutate(id)}
              onComplete={(id: string) => completeMutation.mutate(id)}
              onConfirm={(id: string) => confirmMutation.mutate(id)}
              onNoShow={(id: string) => noShowMutation.mutate(id)}
              onViewDetails={(id: string) =>
                navigate({
                  to: "/app/appointments/$appointment-id",
                  params: { "appointment-id": id },
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
