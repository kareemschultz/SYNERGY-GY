import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addMonths, format } from "date-fns";
import {
  AlertCircle,
  Calendar,
  Clock,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { Switch } from "@/components/ui/switch";
import { client } from "@/utils/orpc";

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

type DaySchedule = {
  dayOfWeek: number;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
};

type Override = {
  id: string;
  date: Date;
  isAvailable: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
};

export function AvailabilitySettings() {
  const queryClient = useQueryClient();
  const [showAddOverride, setShowAddOverride] = useState(false);
  const [overrideToDelete, setOverrideToDelete] = useState<string | null>(null);
  const [newOverride, setNewOverride] = useState({
    date: "",
    isAvailable: false,
    startTime: "09:00",
    endTime: "17:00",
    reason: "",
  });
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Get staff status to get staffId
  const { data: staffStatus } = useQuery({
    queryKey: ["settings", "getStaffStatus"],
    queryFn: () => client.settings.getStaffStatus(),
  });

  const staffId = staffStatus?.staff?.id;

  // Load current availability
  const { data: availability, isLoading: availabilityLoading } = useQuery({
    queryKey: ["appointments", "availability", staffId],
    queryFn: () =>
      client.appointments.availability.getForStaff({ staffId: staffId! }),
    enabled: !!staffId,
    staleTime: 0,
  });

  // Initialize schedule from availability data
  useState(() => {
    if (availability && schedule.length === 0) {
      const initialSchedule = DAYS.map((day) => {
        const existing = availability.find((a) => a.dayOfWeek === day.value);
        return {
          dayOfWeek: day.value,
          isAvailable:
            existing?.isAvailable ?? (day.value >= 1 && day.value <= 5),
          startTime: existing?.startTime ?? "09:00",
          endTime: existing?.endTime ?? "17:00",
        };
      });
      setSchedule(initialSchedule);
    }
  });

  // Load overrides for next 3 months
  const { data: overrides, isLoading: overridesLoading } = useQuery({
    queryKey: ["appointments", "overrides", staffId],
    queryFn: () =>
      client.appointments.availability.getOverrides({
        staffId: staffId!,
        fromDate: new Date().toISOString().split("T")[0],
        toDate: addMonths(new Date(), 3).toISOString().split("T")[0],
      }),
    enabled: !!staffId,
  });

  // Save schedule mutation
  const saveScheduleMutation = useMutation({
    mutationFn: (scheduleData: DaySchedule[]) =>
      client.appointments.availability.setWeeklySchedule({
        staffId: staffId!,
        schedule: scheduleData.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          isAvailable: s.isAvailable,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["appointments", "availability"],
      });
      toast.success("Weekly schedule saved");
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to save schedule"
      );
    },
  });

  // Create override mutation
  const createOverrideMutation = useMutation({
    mutationFn: (data: {
      date: string;
      isAvailable: boolean;
      startTime?: string;
      endTime?: string;
      reason?: string;
    }) =>
      client.appointments.availability.createOverride({
        staffId: staffId!,
        date: data.date,
        isAvailable: data.isAvailable,
        startTime: data.isAvailable ? data.startTime : undefined,
        endTime: data.isAvailable ? data.endTime : undefined,
        reason: data.reason || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["appointments", "overrides"],
      });
      toast.success("Override added");
      setShowAddOverride(false);
      setNewOverride({
        date: "",
        isAvailable: false,
        startTime: "09:00",
        endTime: "17:00",
        reason: "",
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to add override"
      );
    },
  });

  // Delete override mutation
  const deleteOverrideMutation = useMutation({
    mutationFn: (id: string) =>
      client.appointments.availability.deleteOverride({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["appointments", "overrides"],
      });
      toast.success("Override removed");
      setOverrideToDelete(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove override"
      );
    },
  });

  const updateDay = (dayOfWeek: number, updates: Partial<DaySchedule>) => {
    setSchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, ...updates } : day
      )
    );
    setHasChanges(true);
  };

  // Initialize schedule when availability loads
  if (availability && schedule.length === 0) {
    const initialSchedule = DAYS.map((day) => {
      const existing = availability.find((a) => a.dayOfWeek === day.value);
      return {
        dayOfWeek: day.value,
        isAvailable:
          existing?.isAvailable ?? (day.value >= 1 && day.value <= 5),
        startTime: existing?.startTime ?? "09:00",
        endTime: existing?.endTime ?? "17:00",
      };
    });
    setSchedule(initialSchedule);
  }

  if (!staffId) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlertCircle className="h-5 w-5" />
          <p>No staff profile found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-2xl">Availability</h2>
        <p className="text-muted-foreground text-sm">
          Set your weekly schedule and add time-off overrides
        </p>
      </div>

      {/* Weekly Schedule Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Weekly Schedule
          </CardTitle>
          <CardDescription>
            Set your regular working hours for each day of the week
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availabilityLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {DAYS.map((day) => {
                const daySchedule = schedule.find(
                  (s) => s.dayOfWeek === day.value
                ) ?? {
                  dayOfWeek: day.value,
                  isAvailable: day.value >= 1 && day.value <= 5,
                  startTime: "09:00",
                  endTime: "17:00",
                };

                return (
                  <div
                    className="flex items-center justify-between rounded-lg border p-4"
                    key={day.value}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-24">
                        <p className="font-medium">{day.label}</p>
                      </div>
                      <Switch
                        checked={daySchedule.isAvailable}
                        onCheckedChange={(checked) =>
                          updateDay(day.value, { isAvailable: checked })
                        }
                      />
                    </div>
                    {daySchedule.isAvailable ? (
                      <div className="flex items-center gap-2">
                        <Input
                          className="w-32"
                          onChange={(e) =>
                            updateDay(day.value, { startTime: e.target.value })
                          }
                          type="time"
                          value={daySchedule.startTime}
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          className="w-32"
                          onChange={(e) =>
                            updateDay(day.value, { endTime: e.target.value })
                          }
                          type="time"
                          value={daySchedule.endTime}
                        />
                      </div>
                    ) : (
                      <Badge variant="secondary">Unavailable</Badge>
                    )}
                  </div>
                );
              })}

              <div className="flex justify-end pt-4">
                <Button
                  disabled={!hasChanges || saveScheduleMutation.isPending}
                  onClick={() => saveScheduleMutation.mutate(schedule)}
                >
                  {saveScheduleMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Schedule"
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overrides Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                Time Off & Overrides
              </CardTitle>
              <CardDescription>
                Block specific dates or set custom hours
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddOverride(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Override
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {overridesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : overrides && overrides.length > 0 ? (
            <div className="space-y-3">
              {overrides.map((override: Override) => (
                <div
                  className="flex items-center justify-between rounded-lg border p-4"
                  key={override.id}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">
                        {format(new Date(override.date), "EEEE, MMMM d, yyyy")}
                      </p>
                      {override.reason ? (
                        <p className="text-muted-foreground text-sm">
                          {override.reason}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {override.isAvailable ? (
                      <Badge variant="outline">
                        {override.startTime} - {override.endTime}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Unavailable</Badge>
                    )}
                    <Button
                      onClick={() => setOverrideToDelete(override.id)}
                      size="icon"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-24 items-center justify-center text-muted-foreground">
              No upcoming overrides
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Override Dialog */}
      <Dialog onOpenChange={setShowAddOverride} open={showAddOverride}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Override</DialogTitle>
            <DialogDescription>
              Block a specific date or set custom hours
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="override-date">Date</Label>
              <Input
                id="override-date"
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) =>
                  setNewOverride((prev) => ({ ...prev, date: e.target.value }))
                }
                type="date"
                value={newOverride.date}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Available</p>
                <p className="text-muted-foreground text-sm">
                  {newOverride.isAvailable
                    ? "Set custom hours"
                    : "Block this day completely"}
                </p>
              </div>
              <Switch
                checked={newOverride.isAvailable}
                onCheckedChange={(checked) =>
                  setNewOverride((prev) => ({ ...prev, isAvailable: checked }))
                }
              />
            </div>

            {newOverride.isAvailable ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    onChange={(e) =>
                      setNewOverride((prev) => ({
                        ...prev,
                        startTime: e.target.value,
                      }))
                    }
                    type="time"
                    value={newOverride.startTime}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>End Time</Label>
                  <Input
                    onChange={(e) =>
                      setNewOverride((prev) => ({
                        ...prev,
                        endTime: e.target.value,
                      }))
                    }
                    type="time"
                    value={newOverride.endTime}
                  />
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="override-reason">Reason (optional)</Label>
              <Input
                id="override-reason"
                onChange={(e) =>
                  setNewOverride((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                placeholder="e.g., Vacation, Doctor appointment"
                value={newOverride.reason}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowAddOverride(false)} variant="outline">
              Cancel
            </Button>
            <Button
              disabled={!newOverride.date || createOverrideMutation.isPending}
              onClick={() => createOverrideMutation.mutate(newOverride)}
            >
              {createOverrideMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Override"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Override Confirmation */}
      <AlertDialog
        onOpenChange={(open) => !open && setOverrideToDelete(null)}
        open={overrideToDelete !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Override?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the override and restore your regular schedule
              for this date.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteOverrideMutation.isPending}
              onClick={() => {
                if (overrideToDelete) {
                  deleteOverrideMutation.mutate(overrideToDelete);
                }
              }}
            >
              {deleteOverrideMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
