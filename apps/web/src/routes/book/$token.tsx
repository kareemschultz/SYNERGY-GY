/**
 * Public Booking Page
 *
 * Allows visitors to book appointments via a public link.
 * No authentication required.
 */

import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { client as api } from "@/utils/orpc";

export const Route = createFileRoute("/book/$token")({
  component: PublicBookingPage,
});

// Location type configuration
const locationConfig = {
  IN_PERSON: { icon: MapPin, label: "In Person" },
  PHONE: { icon: Phone, label: "Phone Call" },
  VIDEO: { icon: Video, label: "Video Call" },
} as const;

type LocationType = keyof typeof locationConfig;

// Booking steps
type BookingStep = "date" | "time" | "form" | "confirmation";

// Booking page data from API
type BookingPageData = {
  id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  durationMinutes: number;
  business: string | null;
  color: string | null;
  minDate: string;
  maxDate: string;
  requiresApproval: boolean;
};

// Time slot from API
type TimeSlot = {
  time: string;
  available: boolean;
};

// Booking result from API
type BookingResult = {
  success: boolean;
  appointmentId: string;
  bookingToken: string;
  status: string;
  message: string;
  scheduledAt: string;
  durationMinutes: number;
};

// Form data type
type FormData = {
  name: string;
  email: string;
  phone: string;
  locationType: LocationType;
  notes: string;
};

// Format 24h time to 12h display
function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = (hours ?? 0) >= 12 ? "PM" : "AM";
  const displayHours = (hours ?? 0) % 12 || 12;
  return `${displayHours}:${String(minutes ?? 0).padStart(2, "0")} ${period}`;
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-800">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// Error state component
function ErrorState({ error }: { error: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-800">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Booking Not Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <p className="mt-4 text-muted-foreground text-sm">
            This booking link may have expired or been disabled. Please contact
            us for assistance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Confirmation view component
function ConfirmationView({
  bookingResult,
  formData,
}: {
  bookingResult: BookingResult;
  formData: FormData;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-800">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
          <CardDescription>{bookingResult.message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 rounded-lg bg-muted p-4">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {format(
                    parseISO(bookingResult.scheduledAt),
                    "EEEE, MMMM d, yyyy"
                  )}
                </p>
                <p className="text-muted-foreground text-sm">
                  {format(parseISO(bookingResult.scheduledAt), "h:mm a")} (
                  {bookingResult.durationMinutes} minutes)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <p>{formData.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <p>{formData.email}</p>
            </div>
          </div>

          <Alert>
            <AlertTitle>Save your booking reference</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                Your booking reference is:{" "}
                <code className="rounded bg-muted px-2 py-1 font-bold font-mono">
                  {bookingResult.bookingToken}
                </code>
              </p>
              <p className="text-sm">
                You can use this to check or cancel your booking at:{" "}
                <a
                  className="text-primary underline"
                  href={`/book/manage?token=${bookingResult.bookingToken}`}
                >
                  Manage Booking
                </a>
              </p>
            </AlertDescription>
          </Alert>

          <p className="text-center text-muted-foreground text-sm">
            A confirmation email has been sent to {formData.email}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Step indicator component
function StepIndicator({
  active,
  completed,
  children,
}: {
  active: boolean;
  completed: boolean;
  children: React.ReactNode;
}) {
  function getStepClass(): string {
    if (active) {
      return "bg-primary text-primary-foreground";
    }
    if (completed) {
      return "bg-primary/20 text-primary";
    }
    return "bg-muted text-muted-foreground";
  }

  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 font-medium text-sm transition-colors",
        getStepClass()
      )}
    >
      {children}
    </span>
  );
}

// Date selection step component
function DateSelectionStep({
  bookingData,
  selectedDate,
  onDateSelect,
}: {
  bookingData: BookingPageData | null;
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
}) {
  const minDate = bookingData?.minDate
    ? parseISO(bookingData.minDate)
    : new Date();
  const maxDate = bookingData?.maxDate
    ? parseISO(bookingData.maxDate)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  function isDateDisabled(date: Date): boolean {
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isBeforeMin = date < minDate;
    const isAfterMax = date > maxDate;
    return isWeekend || isBeforeMin || isAfterMax;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-5 w-5 text-primary" />
        <h2 className="font-semibold text-lg">Select a Date</h2>
      </div>
      <div className="flex justify-center">
        <Calendar
          disabled={isDateDisabled}
          mode="single"
          onSelect={onDateSelect}
          selected={selectedDate}
        />
      </div>
      {bookingData?.durationMinutes ? (
        <p className="text-center text-muted-foreground text-sm">
          <Clock className="mr-1 inline-block h-4 w-4" />
          {bookingData.durationMinutes} minute appointment
        </p>
      ) : null}
    </div>
  );
}

// Time selection step component
function TimeSelectionStep({
  selectedDate,
  availableSlots,
  selectedTime,
  isFetchingSlots,
  onTimeSelect,
  onBack,
}: {
  selectedDate: Date | undefined;
  availableSlots: TimeSlot[];
  selectedTime: string | null;
  isFetchingSlots: boolean;
  onTimeSelect: (time: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Select a Time</h2>
        </div>
        <Button onClick={onBack} size="sm" variant="ghost">
          Change Date
        </Button>
      </div>

      {selectedDate ? (
        <p className="text-muted-foreground text-sm">
          {format(selectedDate, "EEEE, MMMM d, yyyy")}
        </p>
      ) : null}

      {isFetchingSlots ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : null}

      {!isFetchingSlots && availableSlots.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Available Times</AlertTitle>
          <AlertDescription>
            There are no available time slots for this date. Please select
            another date.
          </AlertDescription>
        </Alert>
      ) : null}

      {!isFetchingSlots && availableSlots.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {availableSlots.map((slot) => (
            <Button
              className={cn(
                "w-full",
                selectedTime === slot.time && "ring-2 ring-primary"
              )}
              disabled={!slot.available}
              key={slot.time}
              onClick={() => onTimeSelect(slot.time)}
              variant={selectedTime === slot.time ? "default" : "outline"}
            >
              {formatTime(slot.time)}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// Contact form step component
function ContactFormStep({
  selectedDate,
  selectedTime,
  bookingData,
  formData,
  isSubmitting,
  onFormChange,
  onSubmit,
  onBack,
}: {
  selectedDate: Date | undefined;
  selectedTime: string | null;
  bookingData: BookingPageData | null;
  formData: FormData;
  isSubmitting: boolean;
  onFormChange: (data: Partial<FormData>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Your Details</h2>
        <Button onClick={onBack} size="sm" type="button" variant="ghost">
          Change Time
        </Button>
      </div>

      {selectedDate !== undefined && selectedTime !== null ? (
        <div className="rounded-lg bg-muted p-3">
          <p className="font-medium">
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </p>
          <p className="text-muted-foreground text-sm">
            {formatTime(selectedTime)} ({bookingData?.durationMinutes} minutes)
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="name">Full Name *</Label>
        <Input
          disabled={isSubmitting}
          id="name"
          onChange={(e) => onFormChange({ name: e.target.value })}
          placeholder="Your full name"
          required
          value={formData.name}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          disabled={isSubmitting}
          id="email"
          onChange={(e) => onFormChange({ email: e.target.value })}
          placeholder="your@email.com"
          required
          type="email"
          value={formData.email}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          disabled={isSubmitting}
          id="phone"
          onChange={(e) => onFormChange({ phone: e.target.value })}
          placeholder="+1 (555) 000-0000"
          type="tel"
          value={formData.phone}
        />
      </div>

      <div className="space-y-2">
        <Label>How would you like to meet?</Label>
        <RadioGroup
          className="grid grid-cols-3 gap-2"
          disabled={isSubmitting}
          onValueChange={(value) =>
            onFormChange({ locationType: value as LocationType })
          }
          value={formData.locationType}
        >
          {(Object.keys(locationConfig) as LocationType[]).map((type) => {
            const config = locationConfig[type];
            const Icon = config.icon;
            return (
              <Label
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-3 hover:bg-muted",
                  formData.locationType === type &&
                    "border-primary bg-primary/5"
                )}
                htmlFor={type}
                key={type}
              >
                <RadioGroupItem className="sr-only" id={type} value={type} />
                <Icon className="h-5 w-5" />
                <span className="text-xs">{config.label}</span>
              </Label>
            );
          })}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          className="resize-none"
          disabled={isSubmitting}
          id="notes"
          onChange={(e) => onFormChange({ notes: e.target.value })}
          placeholder="Any additional information..."
          rows={3}
          value={formData.notes}
        />
      </div>

      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Booking...
          </>
        ) : (
          "Confirm Booking"
        )}
      </Button>

      {bookingData?.requiresApproval ? (
        <p className="text-center text-muted-foreground text-xs">
          This booking requires approval. You will receive a confirmation email
          once approved.
        </p>
      ) : null}
    </form>
  );
}

// Main component
function PublicBookingPage() {
  const { token } = Route.useParams();

  // State
  const [step, setStep] = useState<BookingStep>("date");
  const [bookingData, setBookingData] = useState<BookingPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date & time selection
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);

  // Form data
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    locationType: "IN_PERSON",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(
    null
  );

  // Fetch booking page data on mount
  useEffect(() => {
    async function fetchBookingPage() {
      try {
        const result = await api.publicBooking.getBookingPage({ token });
        setBookingData(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "This booking page is not available"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchBookingPage();
  }, [token]);

  // Fetch available slots when date changes
  useEffect(() => {
    if (!(selectedDate && bookingData)) {
      return;
    }

    async function fetchSlots() {
      if (!selectedDate) {
        return;
      }

      setIsFetchingSlots(true);
      setSelectedTime(null);

      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const result = await api.publicBooking.getAvailableSlots({
          token,
          date: dateStr,
        });
        setAvailableSlots(result.slots || []);
      } catch (err) {
        console.error("[Booking] Failed to fetch slots:", err);
        setAvailableSlots([]);
      } finally {
        setIsFetchingSlots(false);
      }
    }

    fetchSlots();
  }, [selectedDate, token, bookingData]);

  // Handle date selection and auto-advance
  function handleDateSelect(date: Date | undefined) {
    setSelectedDate(date);
    if (date) {
      setStep("time");
    }
  }

  // Handle time selection and advance
  function handleTimeSelect(time: string) {
    setSelectedTime(time);
    setStep("form");
  }

  // Handle form field change
  function handleFormChange(data: Partial<FormData>) {
    setFormData((prev) => ({ ...prev, ...data }));
  }

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!(selectedDate && selectedTime)) {
      setError("Please select a date and time");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const scheduledAt = new Date(
        `${format(selectedDate, "yyyy-MM-dd")}T${selectedTime}:00`
      );

      const result = await api.publicBooking.createBooking({
        token,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        scheduledAt: scheduledAt.toISOString(),
        locationType: formData.locationType,
        notes: formData.notes || undefined,
      });

      setBookingResult(result);
      setStep("confirmation");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create booking");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Error state (when no booking data could be loaded)
  if (error && !bookingData) {
    return <ErrorState error={error} />;
  }

  // Confirmation step
  if (step === "confirmation" && bookingResult) {
    return (
      <ConfirmationView bookingResult={bookingResult} formData={formData} />
    );
  }

  // Main booking flow
  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="mt-8 mb-6 text-center">
        <h1 className="font-bold text-3xl text-foreground">
          {bookingData?.name || "Book an Appointment"}
        </h1>
        {bookingData?.description ? (
          <p className="mt-2 text-muted-foreground">
            {bookingData.description}
          </p>
        ) : null}
        {bookingData?.instructions ? (
          <p className="mx-auto mt-2 max-w-md text-muted-foreground text-sm">
            {bookingData.instructions}
          </p>
        ) : null}
      </div>

      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        <StepIndicator active={step === "date"} completed={step !== "date"}>
          1. Date
        </StepIndicator>
        <div className="h-px w-4 bg-muted-foreground/30" />
        <StepIndicator
          active={step === "time"}
          completed={step === "form" || step === "confirmation"}
        >
          2. Time
        </StepIndicator>
        <div className="h-px w-4 bg-muted-foreground/30" />
        <StepIndicator
          active={step === "form"}
          completed={step === "confirmation"}
        >
          3. Details
        </StepIndicator>
      </div>

      {/* Error message */}
      {error ? (
        <Alert className="mb-4 max-w-lg" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {/* Main content */}
      <Card className="w-full max-w-lg">
        <CardContent className="pt-6">
          {step === "date" ? (
            <DateSelectionStep
              bookingData={bookingData}
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
            />
          ) : null}

          {step === "time" ? (
            <TimeSelectionStep
              availableSlots={availableSlots}
              isFetchingSlots={isFetchingSlots}
              onBack={() => setStep("date")}
              onTimeSelect={handleTimeSelect}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
            />
          ) : null}

          {step === "form" ? (
            <ContactFormStep
              bookingData={bookingData}
              formData={formData}
              isSubmitting={isSubmitting}
              onBack={() => setStep("time")}
              onFormChange={handleFormChange}
              onSubmit={handleSubmit}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
            />
          ) : null}
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="mt-8 text-muted-foreground text-sm">Powered by GK-Nexus</p>
    </div>
  );
}
