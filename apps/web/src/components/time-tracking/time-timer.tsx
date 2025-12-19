import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Play, Square, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { client } from "@/utils/orpc";

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

type ActiveTimer = {
  id: string;
  matterId: string;
  description: string | null;
  startedAt: Date;
  isBillable: boolean;
  elapsedMinutes: number;
  matter: {
    id: string;
    referenceNumber: string;
    title: string;
    client: {
      id: string;
      displayName: string;
    } | null;
  };
};

/**
 * Timer display shown in header when a timer is running
 */
export function ActiveTimerDisplay() {
  const queryClient = useQueryClient();
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [description, setDescription] = useState("");

  // Fetch active timer
  const { data: timer } = useQuery({
    queryKey: ["timeTracking", "activeTimer"],
    queryFn: () => client.timeTracking.getActiveTimer(),
    refetchInterval: 30_000, // Refresh every 30 seconds
  });

  // Update elapsed time every minute
  useEffect(() => {
    if (timer) {
      setElapsedMinutes(timer.elapsedMinutes);
      setDescription(timer.description || "");

      const interval = setInterval(() => {
        setElapsedMinutes((prev) => prev + 1);
      }, 60_000);

      return () => clearInterval(interval);
    }
  }, [timer]);

  // Stop timer mutation
  const stopMutation = useMutation({
    mutationFn: (desc: string) =>
      client.timeTracking.stopTimer({ description: desc }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeTracking"] });
      toast.success("Time entry saved");
      setStopDialogOpen(false);
      setDescription("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to stop timer");
    },
  });

  // Cancel timer mutation
  const cancelMutation = useMutation({
    mutationFn: () => client.timeTracking.cancelTimer(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeTracking"] });
      toast.info("Timer cancelled");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel timer");
    },
  });

  if (!timer) {
    return null;
  }

  const activeTimer = timer as ActiveTimer;

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            className="gap-2 bg-green-500 text-white hover:bg-green-600"
            size="sm"
            variant="default"
          >
            <Clock className="h-4 w-4 animate-pulse" />
            <span className="font-mono">{formatDuration(elapsedMinutes)}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72">
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-sm">
                {activeTimer.matter.referenceNumber}
              </p>
              <p className="truncate text-muted-foreground text-xs">
                {activeTimer.matter.title}
              </p>
              {activeTimer.matter.client ? (
                <p className="text-muted-foreground text-xs">
                  {activeTimer.matter.client.displayName}
                </p>
              ) : null}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                {activeTimer.isBillable ? "Billable" : "Non-billable"}
              </span>
              <span className="font-mono text-lg">
                {formatDuration(elapsedMinutes)}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => setStopDialogOpen(true)}
                size="sm"
              >
                <Square className="mr-1 h-3 w-3" />
                Stop
              </Button>
              <Button
                onClick={() => cancelMutation.mutate()}
                size="sm"
                variant="outline"
              >
                <X className="mr-1 h-3 w-3" />
                Cancel
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Stop Timer Dialog */}
      <Dialog onOpenChange={setStopDialogOpen} open={stopDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stop Timer</DialogTitle>
            <DialogDescription>
              Save the time entry for {activeTimer.matter.referenceNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <p className="font-mono font-semibold text-3xl">
                {formatDuration(elapsedMinutes)}
              </p>
              <p className="text-muted-foreground text-sm">
                {(elapsedMinutes / 60).toFixed(2)} hours
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What did you work on?"
                value={description}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setStopDialogOpen(false)} variant="outline">
              Continue Timing
            </Button>
            <Button
              disabled={!description.trim() || stopMutation.isPending}
              onClick={() => stopMutation.mutate(description)}
            >
              {stopMutation.isPending ? "Saving..." : "Save Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Start timer button for a specific matter
 */
type StartTimerButtonProps = {
  matterId: string;
  matterReference: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost";
};

export function StartTimerButton({
  matterId,
  matterReference,
  size = "sm",
  variant = "outline",
}: StartTimerButtonProps) {
  const queryClient = useQueryClient();
  const [isBillable, setIsBillable] = useState(true);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Check if there's already an active timer
  const { data: activeTimer } = useQuery({
    queryKey: ["timeTracking", "activeTimer"],
    queryFn: () => client.timeTracking.getActiveTimer(),
  });

  // Start timer mutation
  const startMutation = useMutation({
    mutationFn: () =>
      client.timeTracking.startTimer({
        matterId,
        isBillable,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeTracking"] });
      toast.success(`Timer started for ${matterReference}`);
      setPopoverOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to start timer");
    },
  });

  // If there's already an active timer, show different state
  if (activeTimer) {
    return (
      <Button disabled size={size} variant={variant}>
        <Clock className="mr-2 h-4 w-4" />
        Timer Active
      </Button>
    );
  }

  return (
    <Popover onOpenChange={setPopoverOpen} open={popoverOpen}>
      <PopoverTrigger asChild>
        <Button size={size} variant={variant}>
          <Play className="mr-2 h-4 w-4" />
          Start Timer
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <div className="space-y-4">
          <div>
            <h4 className="mb-1 font-medium text-sm">Start Timer</h4>
            <p className="text-muted-foreground text-xs">{matterReference}</p>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="billable">Billable time</Label>
            <Switch
              checked={isBillable}
              id="billable"
              onCheckedChange={setIsBillable}
            />
          </div>
          <Button
            className="w-full"
            disabled={startMutation.isPending}
            onClick={() => startMutation.mutate()}
          >
            {startMutation.isPending ? (
              "Starting..."
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start
              </>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
