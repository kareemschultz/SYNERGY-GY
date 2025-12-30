import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Repeat, XCircle } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { client } from "@/utils/orpc";
import { unwrapOrpc } from "@/utils/orpc-response";

const recurrencePatternLabels: Record<string, string> = {
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly (every 3 months)",
  SEMI_ANNUALLY: "Semi-Annually (every 6 months)",
  ANNUALLY: "Annually",
};

type RecurrencePattern = "MONTHLY" | "QUARTERLY" | "SEMI_ANNUALLY" | "ANNUALLY";

type RecurringMatterCardProps = {
  matterId: string;
  isRecurring: boolean;
  recurrencePattern: string | null;
  nextRecurrenceDate: string | null;
  recurrenceCount: number | null;
  parentMatterId: string | null;
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Component handles multiple dialog states and conditional rendering for recurring vs non-recurring matters
export function RecurringMatterCard({
  matterId,
  isRecurring,
  recurrencePattern,
  nextRecurrenceDate,
  recurrenceCount,
  parentMatterId,
}: RecurringMatterCardProps) {
  const queryClient = useQueryClient();
  const [setupOpen, setSetupOpen] = useState(false);
  const [selectedPattern, setSelectedPattern] =
    useState<RecurrencePattern>("ANNUALLY");
  const [createNextOpen, setCreateNextOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  // Setup recurrence mutation
  const setupMutation = useMutation({
    mutationFn: async (pattern: RecurrencePattern) => {
      const response = await client.matters.recurring.setup({
        matterId,
        recurrencePattern: pattern,
      });
      return unwrapOrpc<{
        id: string;
        isRecurring: boolean;
        recurrencePattern: string;
        nextRecurrenceDate: string;
      }>(response);
    },
    onSuccess: () => {
      toast.success("Recurrence set up successfully");
      queryClient.invalidateQueries({ queryKey: ["matter", matterId] });
      setSetupOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to set up recurrence");
    },
  });

  // Create next occurrence mutation
  const createNextMutation = useMutation({
    mutationFn: async () => {
      const response = await client.matters.recurring.createNext({
        matterId,
      });
      return unwrapOrpc<{
        newMatter: { id: string; referenceNumber: string };
        nextRecurrenceDate: string;
      }>(response);
    },
    onSuccess: (data) => {
      toast.success(
        `Created new matter: ${data?.newMatter?.referenceNumber || "Success"}`
      );
      queryClient.invalidateQueries({ queryKey: ["matter", matterId] });
      queryClient.invalidateQueries({ queryKey: ["matters"] });
      setCreateNextOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create next occurrence");
    },
  });

  // Cancel recurrence mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await client.matters.recurring.cancel({
        matterId,
      });
      return unwrapOrpc<{ id: string; isRecurring: boolean }>(response);
    },
    onSuccess: () => {
      toast.success("Recurrence cancelled");
      queryClient.invalidateQueries({ queryKey: ["matter", matterId] });
      setCancelOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to cancel recurrence");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat className="h-5 w-5" />
          Recurrence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isRecurring ? (
          <>
            <div>
              <p className="mb-1 font-medium text-muted-foreground text-sm">
                Pattern
              </p>
              <Badge
                className="bg-purple-500/10 text-purple-600"
                variant="outline"
              >
                {recurrencePatternLabels[recurrencePattern || ""] ||
                  recurrencePattern}
              </Badge>
            </div>

            {nextRecurrenceDate ? (
              <div>
                <p className="mb-1 font-medium text-muted-foreground text-sm">
                  Next Recurrence
                </p>
                <p className="text-sm">
                  {new Date(nextRecurrenceDate).toLocaleDateString()}
                </p>
              </div>
            ) : null}

            {recurrenceCount ? (
              <div>
                <p className="mb-1 font-medium text-muted-foreground text-sm">
                  Occurrence #
                </p>
                <p className="text-sm">{recurrenceCount}</p>
              </div>
            ) : null}

            {parentMatterId ? (
              <div>
                <p className="mb-1 font-medium text-muted-foreground text-sm">
                  Type
                </p>
                <Badge variant="secondary">Child of recurring series</Badge>
              </div>
            ) : (
              <div>
                <p className="mb-1 font-medium text-muted-foreground text-sm">
                  Type
                </p>
                <Badge variant="secondary">Original (parent) matter</Badge>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {/* Create Next Occurrence Dialog */}
              <Dialog onOpenChange={setCreateNextOpen} open={createNextOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    Create Next
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Next Occurrence</DialogTitle>
                    <DialogDescription>
                      This will create a new matter based on the current one,
                      with dates adjusted according to the recurrence pattern (
                      {recurrencePatternLabels[recurrencePattern || ""]}).
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      onClick={() => setCreateNextOpen(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={createNextMutation.isPending}
                      onClick={() => createNextMutation.mutate()}
                    >
                      {createNextMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Cancel Recurrence Dialog */}
              <Dialog onOpenChange={setCancelOpen} open={cancelOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    <XCircle className="mr-1 h-4 w-4" />
                    Cancel Recurrence
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel Recurrence</DialogTitle>
                    <DialogDescription>
                      This will stop future automatic recurrences for this
                      matter. Existing matters in the series will not be
                      affected.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      onClick={() => setCancelOpen(false)}
                      variant="outline"
                    >
                      Keep Recurrence
                    </Button>
                    <Button
                      disabled={cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate()}
                      variant="destructive"
                    >
                      {cancelMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        "Yes, Cancel Recurrence"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </>
        ) : (
          <>
            <p className="text-muted-foreground text-sm">
              This matter is not set up for recurrence. Set up recurrence to
              automatically create new matters on a schedule.
            </p>

            {/* Setup Recurrence Dialog */}
            <Dialog onOpenChange={setSetupOpen} open={setupOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Repeat className="mr-1 h-4 w-4" />
                  Set Up Recurrence
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set Up Recurrence</DialogTitle>
                  <DialogDescription>
                    Configure how often this matter should recur. The next
                    occurrence will be created based on the due date of this
                    matter.
                  </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                  <label
                    className="mb-2 block font-medium text-sm"
                    htmlFor="recurrence-pattern"
                  >
                    Recurrence Pattern
                  </label>
                  <Select
                    onValueChange={(value) =>
                      setSelectedPattern(value as RecurrencePattern)
                    }
                    value={selectedPattern}
                  >
                    <SelectTrigger id="recurrence-pattern">
                      <SelectValue placeholder="Select pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="QUARTERLY">
                        Quarterly (every 3 months)
                      </SelectItem>
                      <SelectItem value="SEMI_ANNUALLY">
                        Semi-Annually (every 6 months)
                      </SelectItem>
                      <SelectItem value="ANNUALLY">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button onClick={() => setSetupOpen(false)} variant="outline">
                    Cancel
                  </Button>
                  <Button
                    disabled={setupMutation.isPending}
                    onClick={() => setupMutation.mutate(selectedPattern)}
                  >
                    {setupMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      "Set Up Recurrence"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </CardContent>
    </Card>
  );
}
