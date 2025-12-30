/**
 * ScheduleTable Component
 *
 * Displays a table of training course schedules with status
 * indicators and enrollment counts.
 */

import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Calendar, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ScheduleTableProps = {
  schedules: Array<{
    id: string;
    startDate: string | Date;
    endDate: string | Date;
    location: string;
    instructor: string;
    status: string;
    enrollmentCount: number;
  }>;
  maxParticipants: number;
};

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

export function ScheduleTable({
  schedules,
  maxParticipants,
}: ScheduleTableProps) {
  if (schedules.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-2 text-muted-foreground text-sm">
          No schedules yet. Create one to start enrolling participants.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Instructor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Participants</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules.map((schedule) => {
            const isFull = schedule.enrollmentCount >= maxParticipants;
            const capacityPercentage =
              (schedule.enrollmentCount / maxParticipants) * 100;

            return (
              <TableRow key={schedule.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {format(new Date(schedule.startDate), "MMM dd, yyyy")}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {format(new Date(schedule.startDate), "h:mm a")} -{" "}
                      {format(new Date(schedule.endDate), "h:mm a")}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{schedule.location}</span>
                  </div>
                </TableCell>
                <TableCell>{schedule.instructor}</TableCell>
                <TableCell>
                  <Badge
                    variant={STATUS_VARIANTS[schedule.status] || "default"}
                  >
                    {STATUS_LABELS[schedule.status] || schedule.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {schedule.enrollmentCount} / {maxParticipants}
                    </span>
                    {!!isFull && <Badge variant="secondary">Full</Badge>}
                    {capacityPercentage >= 80 && !isFull && (
                      <Badge variant="outline">Almost Full</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link
                      params={{ scheduleId: schedule.id }}
                      to="/app/training/schedules/$scheduleId"
                    >
                      View
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
