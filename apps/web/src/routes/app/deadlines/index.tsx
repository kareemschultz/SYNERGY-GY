import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CalendarClock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  Plus,
  RefreshCw,
  Search,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/app/deadlines/")({
  component: DeadlinesPage,
});

type DeadlineType =
  | "FILING"
  | "RENEWAL"
  | "PAYMENT"
  | "SUBMISSION"
  | "MEETING"
  | "FOLLOWUP"
  | "OTHER";

type DeadlinePriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
type RecurrencePattern =
  | "NONE"
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "ANNUALLY";

const DEADLINE_TYPES: { value: DeadlineType; label: string }[] = [
  { value: "FILING", label: "Filing" },
  { value: "RENEWAL", label: "Renewal" },
  { value: "PAYMENT", label: "Payment" },
  { value: "SUBMISSION", label: "Submission" },
  { value: "MEETING", label: "Meeting" },
  { value: "FOLLOWUP", label: "Follow-up" },
  { value: "OTHER", label: "Other" },
];

const PRIORITY_OPTIONS: { value: DeadlinePriority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const RECURRENCE_OPTIONS: { value: RecurrencePattern; label: string }[] = [
  { value: "NONE", label: "No Recurrence" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "ANNUALLY", label: "Annually" },
];

function DeadlinesPage() {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<DeadlineType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "overdue" | "completed"
  >("pending");
  const [search, setSearch] = useState("");
  const [businessFilter, setBusinessFilter] = useState<string>("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // New deadline form state
  const [newDeadline, setNewDeadline] = useState({
    title: "",
    description: "",
    type: "FILING" as DeadlineType,
    dueDate: "",
    priority: "NORMAL" as DeadlinePriority,
    recurrencePattern: "NONE" as RecurrencePattern,
    business: "__none__" as "__none__" | "GCMC" | "KAJ",
  });

  // Query for stats
  const { data: stats } = useQuery({
    queryKey: ["deadlines", "stats"],
    queryFn: () => client.deadlines.getStats(),
  });

  // Query for deadlines list
  const {
    data: deadlinesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "deadlines",
      { typeFilter, statusFilter, search, businessFilter },
    ],
    queryFn: () => {
      // Determine isCompleted filter value
      let isCompleted: boolean | undefined;
      if (statusFilter === "completed") {
        isCompleted = true;
      } else if (statusFilter === "pending" || statusFilter === "overdue") {
        isCompleted = false;
      }

      return client.deadlines.list({
        type: typeFilter === "all" ? undefined : typeFilter,
        isCompleted,
        business:
          businessFilter === "all"
            ? undefined
            : (businessFilter as "GCMC" | "KAJ"),
        limit: 50,
        sortBy: "dueDate",
        sortOrder: "asc",
      });
    },
  });

  // Query for Guyana templates
  const { data: templates } = useQuery({
    queryKey: ["deadlines", "templates"],
    queryFn: () => client.deadlines.getGuyanaTemplates(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: {
      title: string;
      description?: string;
      type: DeadlineType;
      dueDate: string;
      priority: DeadlinePriority;
      recurrencePattern: RecurrencePattern;
      business?: "GCMC" | "KAJ";
    }) => client.deadlines.create(input),
    onSuccess: () => {
      toast.success("Deadline created successfully");
      queryClient.invalidateQueries({ queryKey: ["deadlines"] });
      setIsCreateDialogOpen(false);
      setNewDeadline({
        title: "",
        description: "",
        type: "FILING",
        dueDate: "",
        priority: "NORMAL",
        recurrencePattern: "NONE",
        business: "__none__",
      });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create deadline");
    },
  });

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: (id: string) => client.deadlines.complete({ id }),
    onSuccess: () => {
      toast.success("Deadline marked as complete");
      queryClient.invalidateQueries({ queryKey: ["deadlines"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to complete deadline");
    },
  });

  // Uncomplete mutation
  const uncompleteMutation = useMutation({
    mutationFn: (id: string) => client.deadlines.uncomplete({ id }),
    onSuccess: () => {
      toast.success("Deadline marked as incomplete");
      queryClient.invalidateQueries({ queryKey: ["deadlines"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update deadline");
    },
  });

  // Filter deadlines based on status
  const deadlines = deadlinesData?.deadlines ?? [];
  const filteredDeadlines =
    statusFilter === "overdue"
      ? deadlines.filter((d) => {
          const dueDate = new Date(d.dueDate);
          return !d.isCompleted && dueDate < new Date();
        })
      : deadlines;

  const handleCreateSubmit = () => {
    if (!(newDeadline.title && newDeadline.dueDate)) {
      toast.error("Please fill in required fields");
      return;
    }
    createMutation.mutate({
      title: newDeadline.title,
      description: newDeadline.description || undefined,
      type: newDeadline.type,
      dueDate: newDeadline.dueDate,
      priority: newDeadline.priority,
      recurrencePattern: newDeadline.recurrencePattern,
      business:
        newDeadline.business && newDeadline.business !== "__none__"
          ? newDeadline.business
          : undefined,
    });
  };

  const handleUseTemplate = (template: {
    title: string;
    description: string;
    type: DeadlineType;
    priority: DeadlinePriority;
    recurrencePattern: RecurrencePattern;
    business?: "GCMC" | "KAJ";
  }) => {
    setNewDeadline({
      title: template.title,
      description: template.description,
      type: template.type,
      dueDate: "",
      priority: template.priority,
      recurrencePattern: template.recurrencePattern,
      business: template.business || "__none__",
    });
    setIsCreateDialogOpen(true);
  };

  const getStatusColor = (
    isCompleted: boolean,
    dueDate: Date
  ): "default" | "destructive" | "secondary" | "outline" => {
    if (isCompleted) {
      return "secondary";
    }
    const now = new Date();
    if (dueDate < now) {
      return "destructive";
    }
    const daysDiff = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff <= 7) {
      return "outline";
    }
    return "default";
  };

  const getPriorityColor = (priority: DeadlinePriority) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "NORMAL":
        return "bg-blue-100 text-blue-800";
      case "LOW":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDueDate = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? "s" : ""} overdue`;
    }
    if (diffDays === 0) {
      return "Due today";
    }
    if (diffDays === 1) {
      return "Due tomorrow";
    }
    if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  // Helper to render deadlines list content - avoids nested ternaries
  const renderDeadlinesContent = () => {
    if (isLoading) {
      return <TableSkeleton rows={5} />;
    }

    if (error) {
      return (
        <ErrorState
          action={{ label: "Try Again", onClick: () => refetch() }}
          message={
            error instanceof Error ? error.message : "Failed to load deadlines"
          }
          title="Could not load deadlines"
        />
      );
    }

    if (filteredDeadlines.length === 0) {
      const emptyTitle =
        statusFilter === "overdue" ? "No Overdue Deadlines" : "No Deadlines";
      const emptyDescription =
        statusFilter === "overdue"
          ? "No overdue deadlines. Great job staying on top of things!"
          : "Create your first deadline to start tracking important dates.";

      return (
        <EmptyState
          action={{
            label: "Create Deadline",
            onClick: () => setIsCreateDialogOpen(true),
          }}
          description={emptyDescription}
          icon={Calendar}
          title={emptyTitle}
        />
      );
    }

    return (
      <div className="space-y-3">
        {/* biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex deadline card with multiple conditional badges */}
        {filteredDeadlines.map((deadline) => {
          const dueDate = new Date(deadline.dueDate);
          const isOverdue = !deadline.isCompleted && dueDate < new Date();

          return (
            <Card
              className={cn(
                "transition-colors",
                deadline.isCompleted ? "bg-muted/50 opacity-75" : ""
              )}
              key={deadline.id}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 pt-1">
                    <Checkbox
                      checked={deadline.isCompleted}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          completeMutation.mutate(deadline.id);
                        } else {
                          uncompleteMutation.mutate(deadline.id);
                        }
                      }}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3
                          className={cn(
                            "font-medium",
                            deadline.isCompleted
                              ? "text-muted-foreground line-through"
                              : ""
                          )}
                        >
                          {deadline.title}
                        </h3>
                        {deadline.description ? (
                          <p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
                            {deadline.description}
                          </p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge
                            variant={getStatusColor(
                              deadline.isCompleted,
                              dueDate
                            )}
                          >
                            {isOverdue ? (
                              <AlertTriangle className="mr-1 h-3 w-3" />
                            ) : null}
                            {formatDueDate(dueDate)}
                          </Badge>
                          <Badge
                            className={getPriorityColor(
                              deadline.priority as DeadlinePriority
                            )}
                            variant="outline"
                          >
                            {deadline.priority}
                          </Badge>
                          <Badge variant="outline">{deadline.type}</Badge>
                          {deadline.business ? (
                            <Badge variant="secondary">
                              {deadline.business}
                            </Badge>
                          ) : null}
                          {deadline.recurrencePattern !== "NONE" ? (
                            <Badge variant="outline">
                              <RefreshCw className="mr-1 h-3 w-3" />
                              {deadline.recurrencePattern}
                            </Badge>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 text-muted-foreground text-sm">
                        {deadline.client ? (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <Link
                              className="hover:underline"
                              to={`/app/clients/${deadline.client.id}`}
                            >
                              {deadline.client.displayName}
                            </Link>
                          </div>
                        ) : null}
                        {deadline.matter ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <Link
                              className="hover:underline"
                              to={`/app/matters/${deadline.matter.id}`}
                            >
                              {deadline.matter.referenceNumber}
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Deadline
          </Button>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Deadlines" },
        ]}
        description="Track and manage important deadlines and filing dates"
        title="Deadlines"
      />

      <div className="space-y-6 p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-medium text-muted-foreground text-sm">
                Overdue
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl text-red-600">
                {stats?.overdue ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-medium text-muted-foreground text-sm">
                Due This Week
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {stats?.dueThisWeek ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-medium text-muted-foreground text-sm">
                Total Pending
              </CardTitle>
              <CalendarClock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {stats?.totalPending ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-medium text-muted-foreground text-sm">
                Completed This Month
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl text-green-600">
                {stats?.completedThisMonth ?? 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Guyana Tax Templates */}
        {(templates?.length ?? 0) > 0 ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Guyana Tax Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {templates?.map((template) => (
                  <Button
                    key={template.id}
                    onClick={() =>
                      handleUseTemplate({
                        title: template.title,
                        description: template.description,
                        type: template.type,
                        priority: template.priority,
                        recurrencePattern: template.recurrencePattern,
                        business: template.business,
                      })
                    }
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    {template.title}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Tabs
            onValueChange={(v) =>
              setStatusFilter(v as "all" | "pending" | "overdue" | "completed")
            }
            value={statusFilter}
          >
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="overdue">
                Overdue
                {(stats?.overdue ?? 0) > 0 ? (
                  <Badge className="ml-1" variant="destructive">
                    {stats?.overdue}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="w-[200px] pl-9"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search deadlines..."
                value={search}
              />
            </div>

            <Button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              size="sm"
              variant="outline"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {showAdvancedFilters ? (
                <ChevronUp className="ml-1 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-1 h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters ? (
          <div className="flex flex-wrap gap-4 rounded-lg border bg-muted/50 p-4">
            <div className="w-[180px]">
              <Label className="mb-1.5 block text-sm">Type</Label>
              <Select
                onValueChange={(v) => setTypeFilter(v as DeadlineType | "all")}
                value={typeFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {DEADLINE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[180px]">
              <Label className="mb-1.5 block text-sm">Business</Label>
              <Select onValueChange={setBusinessFilter} value={businessFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All businesses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Businesses</SelectItem>
                  <SelectItem value="GCMC">GCMC</SelectItem>
                  <SelectItem value="KAJ">KAJ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}

        {/* Deadlines List */}
        {renderDeadlinesContent()}
      </div>

      {/* Create Deadline Dialog */}
      <Dialog onOpenChange={setIsCreateDialogOpen} open={isCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Deadline</DialogTitle>
            <DialogDescription>
              Add a new deadline to track important dates and filing
              requirements.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                onChange={(e) =>
                  setNewDeadline({ ...newDeadline, title: e.target.value })
                }
                placeholder="e.g., Monthly PAYE Returns"
                value={newDeadline.title}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                onChange={(e) =>
                  setNewDeadline({
                    ...newDeadline,
                    description: e.target.value,
                  })
                }
                placeholder="Additional details about this deadline..."
                rows={2}
                value={newDeadline.description}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  onValueChange={(v) =>
                    setNewDeadline({
                      ...newDeadline,
                      type: v as DeadlineType,
                    })
                  }
                  value={newDeadline.type}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEADLINE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  onValueChange={(v) =>
                    setNewDeadline({
                      ...newDeadline,
                      priority: v as DeadlinePriority,
                    })
                  }
                  value={newDeadline.priority}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  onChange={(e) =>
                    setNewDeadline({ ...newDeadline, dueDate: e.target.value })
                  }
                  type="date"
                  value={newDeadline.dueDate}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business">Business</Label>
                <Select
                  onValueChange={(v) =>
                    setNewDeadline({
                      ...newDeadline,
                      business: v as "__none__" | "GCMC" | "KAJ",
                    })
                  }
                  value={newDeadline.business}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    <SelectItem value="GCMC">GCMC</SelectItem>
                    <SelectItem value="KAJ">KAJ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recurrence">Recurrence</Label>
              <Select
                onValueChange={(v) =>
                  setNewDeadline({
                    ...newDeadline,
                    recurrencePattern: v as RecurrencePattern,
                  })
                }
                value={newDeadline.recurrencePattern}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsCreateDialogOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={createMutation.isPending}
              onClick={handleCreateSubmit}
            >
              {createMutation.isPending ? "Creating..." : "Create Deadline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
