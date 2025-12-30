/**
 * Public Booking Management Page
 *
 * Allows users to view and cancel their booking using their booking token.
 * No authentication required.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User,
  Video,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { client as api } from "@/utils/orpc";

export const Route = createFileRoute("/book/manage")({
  component: ManageBookingPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || "",
  }),
});

// Location type configuration
const locationConfig = {
  IN_PERSON: { icon: MapPin, label: "In Person" },
  PHONE: { icon: Phone, label: "Phone Call" },
  VIDEO: { icon: Video, label: "Video Call" },
} as const;

type LocationType = keyof typeof locationConfig;

// Status configuration
const statusConfig = {
  REQUESTED: {
    label: "Pending Approval",
    variant: "secondary" as const,
    icon: Clock,
  },
  CONFIRMED: {
    label: "Confirmed",
    variant: "default" as const,
    icon: CheckCircle,
  },
  COMPLETED: {
    label: "Completed",
    variant: "outline" as const,
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "destructive" as const,
    icon: XCircle,
  },
  NO_SHOW: {
    label: "No Show",
    variant: "destructive" as const,
    icon: XCircle,
  },
  RESCHEDULED: {
    label: "Rescheduled",
    variant: "outline" as const,
    icon: Calendar,
  },
} as const;

type BookingStatus = keyof typeof statusConfig;

// Booking data type from API
type BookingData = {
  id: string;
  status: string;
  appointmentType: string | null;
  scheduledAt: string;
  durationMinutes: number;
  locationType: string;
  location: string | null;
  name: string | null;
  email: string | null;
  canCancel: boolean;
};

// Get status configuration safely
function getStatusConfig(status: string) {
  if (status in statusConfig) {
    return statusConfig[status as BookingStatus];
  }
  return { label: status, variant: "secondary" as const, icon: Clock };
}

// Get location configuration safely
function getLocationConfig(locationType: string) {
  if (locationType in locationConfig) {
    return locationConfig[locationType as LocationType];
  }
  return { icon: MapPin, label: locationType };
}

// Cancellation success view
function CancellationSuccessView() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-800">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
            <XCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-2xl">Booking Cancelled</CardTitle>
          <CardDescription>
            Your appointment has been successfully cancelled.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>What happens next?</AlertTitle>
            <AlertDescription>
              You will receive a confirmation email shortly. If you need to book
              a new appointment, please visit the original booking link.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

// Lookup form component
function LookupForm({
  token,
  error,
  onTokenChange,
  onSubmit,
}: {
  token: string;
  error: string | null;
  onTokenChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Find Your Booking</CardTitle>
        <CardDescription>
          Enter your booking reference to view your appointment details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="token">Booking Reference</Label>
            <Input
              id="token"
              onChange={(e) => onTokenChange(e.target.value)}
              placeholder="e.g., abc123xyz789"
              value={token}
            />
          </div>

          <Button className="w-full" disabled={!token} type="submit">
            Find Booking
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

// Status alert component
function StatusAlert({ status }: { status: string }) {
  if (status === "REQUESTED") {
    return (
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertTitle>Pending Approval</AlertTitle>
        <AlertDescription>
          Your booking is awaiting approval. You will receive an email once it
          has been confirmed.
        </AlertDescription>
      </Alert>
    );
  }

  if (status === "CONFIRMED") {
    return (
      <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800 dark:text-green-200">
          Confirmed
        </AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-300">
          Your appointment is confirmed. Please arrive on time.
        </AlertDescription>
      </Alert>
    );
  }

  if (status === "CANCELLED") {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Cancelled</AlertTitle>
        <AlertDescription>
          This appointment has been cancelled and is no longer active.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

// Booking details card component
function BookingDetailsCard({
  bookingData,
  token,
  error,
  isCancelling,
  cancellationReason,
  onCancellationReasonChange,
  onCancel,
  onLookupAnother,
}: {
  bookingData: BookingData;
  token: string;
  error: string | null;
  isCancelling: boolean;
  cancellationReason: string;
  onCancellationReasonChange: (value: string) => void;
  onCancel: () => void;
  onLookupAnother: () => void;
}) {
  const locationConfigData = getLocationConfig(bookingData.locationType);
  const LocationIcon = locationConfigData.icon;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{bookingData.appointmentType}</CardTitle>
            <CardDescription>
              Booking reference: <code className="font-mono">{token}</code>
            </CardDescription>
          </div>
          <Badge variant={getStatusConfig(bookingData.status).variant}>
            {getStatusConfig(bookingData.status).label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {/* Appointment details */}
        <div className="space-y-3 rounded-lg bg-muted p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {format(
                  parseISO(bookingData.scheduledAt),
                  "EEEE, MMMM d, yyyy"
                )}
              </p>
              <p className="text-muted-foreground text-sm">
                {format(parseISO(bookingData.scheduledAt), "h:mm a")} (
                {bookingData.durationMinutes} minutes)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LocationIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{locationConfigData.label}</p>
              {bookingData.location ? (
                <p className="text-muted-foreground text-sm">
                  {bookingData.location}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <p>{bookingData.name}</p>
          </div>

          {bookingData.email ? (
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <p>{bookingData.email}</p>
            </div>
          ) : null}
        </div>

        <StatusAlert status={bookingData.status} />

        {/* Cancel button */}
        {bookingData.canCancel ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full" variant="destructive">
                Cancel Booking
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. Your appointment on{" "}
                  {format(
                    parseISO(bookingData.scheduledAt),
                    "MMMM d 'at' h:mm a"
                  )}{" "}
                  will be cancelled.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="py-4">
                <Label htmlFor="reason">
                  Reason for cancellation (optional)
                </Label>
                <Textarea
                  className="mt-2"
                  id="reason"
                  onChange={(e) => onCancellationReasonChange(e.target.value)}
                  placeholder="Let us know why you're cancelling..."
                  value={cancellationReason}
                />
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isCancelling}
                  onClick={onCancel}
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    "Yes, Cancel Booking"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}

        {/* Look up another booking */}
        <Button className="w-full" onClick={onLookupAnother} variant="outline">
          Look Up Another Booking
        </Button>
      </CardContent>
    </Card>
  );
}

// Main component
function ManageBookingPage() {
  const navigate = useNavigate();
  const { token: initialToken } = Route.useSearch();

  // State
  const [token, setToken] = useState(initialToken);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isCancelled, setIsCancelled] = useState(false);

  // Fetch booking when token is available
  useEffect(() => {
    if (!initialToken) {
      return;
    }

    async function fetchBooking() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await api.publicBooking.getBookingStatus({
          bookingToken: initialToken,
        });
        setBookingData(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Booking not found. Please check your booking reference."
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchBooking();
  }, [initialToken]);

  async function handleCancel() {
    if (!token) {
      return;
    }

    setIsCancelling(true);

    try {
      await api.publicBooking.cancelBooking({
        bookingToken: token,
        reason: cancellationReason || undefined,
      });
      setIsCancelled(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking");
    } finally {
      setIsCancelling(false);
    }
  }

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (token) {
      navigate({
        to: "/book/manage",
        search: { token },
      });
    }
  }

  function handleLookupAnother() {
    setBookingData(null);
    setToken("");
    setError(null);
    navigate({ to: "/book/manage", search: {} });
  }

  // Cancellation success state
  if (isCancelled) {
    return <CancellationSuccessView />;
  }

  // Determine which content to show
  const showLookupForm = bookingData === null && !isLoading;
  const showLoading = isLoading;
  const showBookingDetails = bookingData !== null && !isLoading;

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="mt-8 mb-6 text-center">
        <h1 className="font-bold text-3xl text-foreground">
          Manage Your Booking
        </h1>
        <p className="mt-2 text-muted-foreground">
          View or cancel your appointment
        </p>
      </div>

      {showLookupForm ? (
        <LookupForm
          error={error}
          onSubmit={handleLookup}
          onTokenChange={setToken}
          token={token}
        />
      ) : null}

      {showLoading ? <LoadingSkeleton /> : null}

      {showBookingDetails ? (
        <BookingDetailsCard
          bookingData={bookingData as BookingData}
          cancellationReason={cancellationReason}
          error={error}
          isCancelling={isCancelling}
          onCancel={handleCancel}
          onCancellationReasonChange={setCancellationReason}
          onLookupAnother={handleLookupAnother}
          token={token}
        />
      ) : null}

      {/* Footer */}
      <p className="mt-8 text-muted-foreground text-sm">Powered by GK-Nexus</p>
    </div>
  );
}
