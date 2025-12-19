import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  DollarSign,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { client } from "@/utils/orpc";
import { StartTimerButton } from "./time-timer";

type TimeEntry = {
  id: string;
  description: string;
  date: string;
  durationMinutes: number;
  isBillable: boolean;
  hourlyRate: string | null;
  totalAmount: string | null;
  invoiceId: string | null;
  createdAt: Date;
  staff: {
    user: {
      id: string;
      name: string;
    };
  };
};

type TimeEntriesListProps = {
  matterId: string;
  matterReference: string;
};

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return `${mins}m`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

function formatCurrency(amount: string | null): string {
  if (!amount) {
    return "-";
  }
  return `GYD ${Number.parseFloat(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
  })}`;
}

export function TimeEntriesList({
  matterId,
  matterReference,
}: TimeEntriesListProps) {
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);

  // Form state
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [isBillable, setIsBillable] = useState(true);

  // Fetch time entries for this matter
  const { data, isLoading, error } = useQuery({
    queryKey: ["timeTracking", "matter", matterId],
    queryFn: () => client.timeTracking.getByMatter({ matterId }),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: {
      matterId: string;
      description: string;
      date: string;
      durationMinutes: number;
      isBillable: boolean;
    }) => client.timeTracking.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["timeTracking", "matter", matterId],
      });
      toast.success("Time entry added");
      resetForm();
      setAddDialogOpen(false);
    },
    onError: (createError) => {
      toast.error(createError.message || "Failed to add time entry");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (input: {
      id: string;
      description?: string;
      date?: string;
      durationMinutes?: number;
      isBillable?: boolean;
    }) => client.timeTracking.update(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["timeTracking", "matter", matterId],
      });
      toast.success("Time entry updated");
      resetForm();
      setEditEntry(null);
    },
    onError: (updateError) => {
      toast.error(updateError.message || "Failed to update time entry");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => client.timeTracking.delete({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["timeTracking", "matter", matterId],
      });
      toast.success("Time entry deleted");
    },
    onError: (deleteError) => {
      toast.error(deleteError.message || "Failed to delete time entry");
    },
  });

  const resetForm = () => {
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
    setHours("");
    setMinutes("");
    setIsBillable(true);
  };

  const openEditDialog = (entry: TimeEntry) => {
    setEditEntry(entry);
    setDescription(entry.description);
    setDate(entry.date);
    setHours(Math.floor(entry.durationMinutes / 60).toString());
    setMinutes((entry.durationMinutes % 60).toString());
    setIsBillable(entry.isBillable);
  };

  const handleSubmit = () => {
    const durationMinutes =
      Number.parseInt(hours || "0", 10) * 60 +
      Number.parseInt(minutes || "0", 10);

    if (durationMinutes < 1) {
      toast.error("Duration must be at least 1 minute");
      return;
    }

    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }

    if (editEntry) {
      updateMutation.mutate({
        id: editEntry.id,
        description,
        date,
        durationMinutes,
        isBillable,
      });
    } else {
      createMutation.mutate({
        matterId,
        description,
        date,
        durationMinutes,
        isBillable,
      });
    }
  };

  const entries = (data?.entries ?? []) as TimeEntry[];
  const summary = data?.summary;

  // Render entries content based on loading/error/data state
  const renderEntriesContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex h-32 items-center justify-center text-muted-foreground">
          Failed to load time entries
        </div>
      );
    }

    if (entries.length === 0) {
      return (
        <div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
          <Clock className="mb-2 h-8 w-8 opacity-50" />
          <p className="text-sm">No time entries yet</p>
          <p className="text-xs">Start a timer or add time manually</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            className="flex items-center justify-between rounded-lg border p-3"
            key={entry.id}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{entry.description}</p>
                {entry.isBillable ? (
                  <Badge
                    className="bg-green-500/10 text-green-600"
                    variant="outline"
                  >
                    Billable
                  </Badge>
                ) : (
                  <Badge variant="secondary">Non-billable</Badge>
                )}
                {entry.invoiceId ? (
                  <Badge
                    className="bg-blue-500/10 text-blue-600"
                    variant="outline"
                  >
                    Invoiced
                  </Badge>
                ) : null}
              </div>
              <div className="mt-1 flex items-center gap-4 text-muted-foreground text-xs">
                <span>{new Date(entry.date).toLocaleDateString()}</span>
                <span>{entry.staff.user.name}</span>
                {entry.totalAmount ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <DollarSign className="h-3 w-3" />
                    {formatCurrency(entry.totalAmount)}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm">
                {formatDuration(entry.durationMinutes)}
              </span>
              {!entry.invoiceId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(entry)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => deleteMutation.mutate(entry.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Get button text for submit
  const getSubmitButtonText = () => {
    if (createMutation.isPending || updateMutation.isPending) {
      return "Saving...";
    }
    if (editEntry) {
      return "Update";
    }
    return "Add Entry";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Tracking
          </CardTitle>
          {summary ? (
            <p className="mt-1 text-muted-foreground text-sm">
              {summary.totalHours} hours ({summary.billableHours}h billable)
              {summary.totalAmount !== "0.00" && (
                <span className="ml-2 font-medium text-green-600">
                  {formatCurrency(summary.totalAmount)}
                </span>
              )}
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <StartTimerButton
            matterId={matterId}
            matterReference={matterReference}
          />
          <Button onClick={() => setAddDialogOpen(true)} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add Entry
          </Button>
        </div>
      </CardHeader>
      <CardContent>{renderEntriesContent()}</CardContent>

      {/* Add/Edit Dialog */}
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setAddDialogOpen(false);
            setEditEntry(null);
            resetForm();
          }
        }}
        open={addDialogOpen || !!editEntry}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editEntry ? "Edit Time Entry" : "Add Time Entry"}
            </DialogTitle>
            <DialogDescription>
              {editEntry
                ? "Update the time entry details"
                : "Record time spent on this matter"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="entry-description">Description</Label>
              <Textarea
                id="entry-description"
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What did you work on?"
                value={description}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-date">Date</Label>
              <Input
                id="entry-date"
                onChange={(e) => setDate(e.target.value)}
                type="date"
                value={date}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <div className="flex items-center gap-2">
                <Input
                  className="w-20"
                  min="0"
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="0"
                  type="number"
                  value={hours}
                />
                <span className="text-muted-foreground text-sm">hours</span>
                <Input
                  className="w-20"
                  max="59"
                  min="0"
                  onChange={(e) => setMinutes(e.target.value)}
                  placeholder="0"
                  type="number"
                  value={minutes}
                />
                <span className="text-muted-foreground text-sm">minutes</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="entry-billable">Billable</Label>
              <Switch
                checked={isBillable}
                id="entry-billable"
                onCheckedChange={setIsBillable}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setAddDialogOpen(false);
                setEditEntry(null);
                resetForm();
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={createMutation.isPending || updateMutation.isPending}
              onClick={handleSubmit}
            >
              {getSubmitButtonText()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
