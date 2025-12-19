import { useQuery } from "@tanstack/react-query";
import { format, isSameDay } from "date-fns";
import { Clock, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { client } from "@/utils/orpc";

type TimeSlot = {
  time: string;
  available: boolean;
};

type StaffAvailability = {
  id: string;
  staffId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

type StaffOverride = {
  id: string;
  staffId: string;
  date: Date;
  startTime: string | null;
  endTime: string | null;
  isAvailable: boolean;
  reason: string | null;
};

type TimeSlotPickerProps = {
  staffId?: string;
  selectedDate: Date;
  selectedTime?: string;
  onTimeSelect: (time: string) => void;
  duration?: number;
  className?: string;
};

// Generate time slots from 8 AM to 6 PM in 30-minute intervals
function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let hour = 8; hour < 18; hour += 1) {
    for (const minute of [0, 30]) {
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      slots.push({ time, available: true });
    }
  }
  return slots;
}

export function TimeSlotPicker({
  staffId,
  selectedDate,
  selectedTime,
  onTimeSelect,
  duration = 30,
  className,
}: TimeSlotPickerProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(generateTimeSlots());

  // Get staff availability for the selected day
  const { data: availability, isLoading: availabilityLoading } = useQuery<
    StaffAvailability[]
  >({
    queryKey: ["staffAvailability", staffId],
    queryFn: async () => {
      if (!staffId) {
        return [];
      }
      const result = await client.appointments.availability.getForStaff({
        staffId,
      });
      return result as StaffAvailability[];
    },
    enabled: !!staffId,
  });

  // Get staff overrides for the selected date
  const { data: overrides, isLoading: overridesLoading } = useQuery<
    StaffOverride[]
  >({
    queryKey: ["staffOverrides", staffId, format(selectedDate, "yyyy-MM-dd")],
    queryFn: async () => {
      if (!staffId) {
        return [];
      }
      const result = await client.appointments.availability.getOverrides({
        staffId,
        fromDate: format(selectedDate, "yyyy-MM-dd"),
        toDate: format(selectedDate, "yyyy-MM-dd"),
      });
      return result as StaffOverride[];
    },
    enabled: !!staffId,
  });

  // Get existing appointments for conflict checking
  const { data: existingAppointments, isLoading: appointmentsLoading } =
    useQuery({
      queryKey: [
        "appointments",
        "conflicts",
        staffId,
        format(selectedDate, "yyyy-MM-dd"),
      ],
      queryFn: () =>
        client.appointments.list({
          staffId: staffId || undefined,
          fromDate: new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            0,
            0,
            0
          ).toISOString(),
          toDate: new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            23,
            59,
            59
          ).toISOString(),
          status: "CONFIRMED",
          limit: 100,
        }),
      enabled: true,
    });

  // Calculate available slots based on availability, overrides, and existing appointments
  useEffect(() => {
    const dayOfWeek = selectedDate.getDay();
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    // Check if there's an override for this date
    const dateOverride = overrides?.find((o) =>
      isSameDay(new Date(o.date), selectedDate)
    );

    // Get base availability for this day
    const dayAvailability = availability?.find(
      (a) => a.dayOfWeek === dayOfWeek
    );

    // Determine working hours
    let startTime = "09:00";
    let endTime = "17:00";
    let isAvailable = true;

    if (dateOverride) {
      // Override takes precedence
      isAvailable = dateOverride.isAvailable;
      if (isAvailable && dateOverride.startTime && dateOverride.endTime) {
        startTime = dateOverride.startTime;
        endTime = dateOverride.endTime;
      }
    } else if (dayAvailability) {
      isAvailable = dayAvailability.isAvailable;
      startTime = dayAvailability.startTime;
      endTime = dayAvailability.endTime;
    }

    // Get confirmed appointments for the day
    const appointments = existingAppointments?.appointments ?? [];

    // Update time slots availability
    const updatedSlots = generateTimeSlots().map((slot) => {
      if (!isAvailable) {
        return { ...slot, available: false };
      }

      // Check if slot is within working hours
      if (slot.time < startTime || slot.time >= endTime) {
        return { ...slot, available: false };
      }

      // Check for conflicts with existing appointments
      const slotStart = new Date(`${dateStr}T${slot.time}:00`);
      const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

      const hasConflict = appointments.some((apt) => {
        const aptStart = new Date(apt.scheduledAt);
        const aptEnd = new Date(apt.endAt);
        // Check if slots overlap
        return slotStart < aptEnd && slotEnd > aptStart;
      });

      return { ...slot, available: !hasConflict };
    });

    setTimeSlots(updatedSlots);
  }, [selectedDate, availability, overrides, existingAppointments, duration]);

  const isLoading =
    availabilityLoading || overridesLoading || appointmentsLoading;

  // Group slots by morning/afternoon
  const morningSlots = timeSlots.filter(
    (slot) => Number.parseInt(slot.time.split(":")[0], 10) < 12
  );
  const afternoonSlots = timeSlots.filter(
    (slot) => Number.parseInt(slot.time.split(":")[0], 10) >= 12
  );

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = Number.parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <Label>Select Time</Label>
        {staffId ? (
          <span className="text-muted-foreground text-xs">
            (Based on staff availability)
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ScrollArea className="h-64">
          <div className="space-y-4">
            {/* Morning */}
            <div>
              <p className="mb-2 font-medium text-muted-foreground text-xs uppercase">
                Morning
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {morningSlots.map((slot) => (
                  <Button
                    className={cn(
                      "h-9",
                      selectedTime === slot.time &&
                        "bg-primary text-primary-foreground"
                    )}
                    disabled={!slot.available}
                    key={slot.time}
                    onClick={() => onTimeSelect(slot.time)}
                    size="sm"
                    variant={selectedTime === slot.time ? "default" : "outline"}
                  >
                    {formatTime(slot.time)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Afternoon */}
            <div>
              <p className="mb-2 font-medium text-muted-foreground text-xs uppercase">
                Afternoon
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {afternoonSlots.map((slot) => (
                  <Button
                    className={cn(
                      "h-9",
                      selectedTime === slot.time &&
                        "bg-primary text-primary-foreground"
                    )}
                    disabled={!slot.available}
                    key={slot.time}
                    onClick={() => onTimeSelect(slot.time)}
                    size="sm"
                    variant={selectedTime === slot.time ? "default" : "outline"}
                  >
                    {formatTime(slot.time)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded border bg-background" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-muted" />
          <span>Unavailable</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-primary" />
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
}
