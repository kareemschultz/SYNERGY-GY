/**
 * Training Enrollments List Page
 *
 * Displays all training enrollments with filtering capabilities.
 * Shows enrollment status, payment status, and certificate information.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  Award,
  Calendar,
  Loader2,
  Mail,
  MapPin,
  MoreHorizontal,
  Search,
  User,
} from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/app/training/enrollments/")({
  component: EnrollmentsPage,
});

const STATUS_LABELS: Record<string, string> = {
  REGISTERED: "Registered",
  CONFIRMED: "Confirmed",
  ATTENDED: "Attended",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  REGISTERED: "outline",
  CONFIRMED: "default",
  ATTENDED: "secondary",
  CANCELLED: "destructive",
  NO_SHOW: "destructive",
};

const PAYMENT_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PARTIAL: "Partial",
  PAID: "Paid",
  REFUNDED: "Refunded",
};

const PAYMENT_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "outline",
  PARTIAL: "secondary",
  PAID: "default",
  REFUNDED: "destructive",
};

type EnrollmentStatus =
  | "REGISTERED"
  | "CONFIRMED"
  | "ATTENDED"
  | "CANCELLED"
  | "NO_SHOW";

type PaymentStatus = "PENDING" | "PARTIAL" | "PAID" | "REFUNDED";

function EnrollmentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: enrollments, isLoading } = useQuery({
    queryKey: [
      "training-enrollments",
      { status: statusFilter, paymentStatus: paymentFilter },
    ],
    queryFn: () =>
      client.training.listEnrollments({
        status:
          statusFilter === "all"
            ? undefined
            : (statusFilter as EnrollmentStatus),
        paymentStatus:
          paymentFilter === "all"
            ? undefined
            : (paymentFilter as PaymentStatus),
      }),
  });

  const updateEnrollmentMutation = useMutation({
    mutationFn: (data: {
      id: string;
      data: {
        status?: EnrollmentStatus;
        paymentStatus?: PaymentStatus;
      };
    }) => client.training.updateEnrollment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-enrollments"] });
      toast({
        title: "Status updated",
        description: "Enrollment has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update enrollment.",
        variant: "destructive",
      });
    },
  });

  const issueCertificateMutation = useMutation({
    mutationFn: (data: { id: string }) =>
      client.training.issueCertificate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-enrollments"] });
      toast({
        title: "Certificate issued",
        description: "Training certificate has been issued successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Certificate issue failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to issue certificate.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateStatus = (id: string, status: EnrollmentStatus) => {
    updateEnrollmentMutation.mutate({ id, data: { status } });
  };

  const handleUpdatePaymentStatus = (
    id: string,
    paymentStatus: PaymentStatus
  ) => {
    updateEnrollmentMutation.mutate({ id, data: { paymentStatus } });
  };

  const handleIssueCertificate = (id: string) => {
    issueCertificateMutation.mutate({ id });
  };

  // Filter by search term (client name or course title)
  const filteredEnrollments = (enrollments ?? []).filter((enrollment) => {
    if (!searchTerm) {
      return true;
    }
    const search = searchTerm.toLowerCase();
    return (
      enrollment.clientName?.toLowerCase().includes(search) ||
      enrollment.courseTitle?.toLowerCase().includes(search)
    );
  });

  // Helper function to render certificate cell content
  const renderCertificateCell = (
    enrollment: (typeof filteredEnrollments)[0]
  ) => {
    if (enrollment.certificateNumber) {
      return (
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-green-600" />
          <div className="flex flex-col">
            <span className="font-medium text-sm">
              {enrollment.certificateNumber}
            </span>
            {enrollment.certificateIssuedAt ? (
              <span className="text-muted-foreground text-xs">
                {format(
                  new Date(enrollment.certificateIssuedAt),
                  "MMM dd, yyyy"
                )}
              </span>
            ) : null}
          </div>
        </div>
      );
    }

    if (enrollment.status === "ATTENDED") {
      return (
        <Button
          disabled={issueCertificateMutation.isPending}
          onClick={() => handleIssueCertificate(enrollment.id)}
          size="sm"
          variant="outline"
        >
          <Award className="mr-2 h-4 w-4" />
          Issue
        </Button>
      );
    }

    return <span className="text-muted-foreground text-sm">-</span>;
  };

  // Helper function to render enrollments table body content
  const renderEnrollmentsTableContent = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell className="h-32 text-center" colSpan={8}>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading enrollments...
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (filteredEnrollments.length > 0) {
      return filteredEnrollments.map((enrollment) => (
        <TableRow key={enrollment.id}>
          <TableCell>
            <div className="flex flex-col">
              <Link
                className="font-medium hover:underline"
                params={{ clientId: enrollment.clientId }}
                to="/app/clients/$clientId"
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {enrollment.clientName}
                </div>
              </Link>
              {enrollment.clientEmail ? (
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Mail className="h-3 w-3" />
                  {enrollment.clientEmail}
                </div>
              ) : null}
            </div>
          </TableCell>
          <TableCell>
            <span className="font-medium">{enrollment.courseTitle}</span>
          </TableCell>
          <TableCell>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(
                    new Date(enrollment.scheduleStartDate),
                    "MMM dd, yyyy"
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <MapPin className="h-3 w-3" />
                {enrollment.scheduleLocation}
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Badge variant={STATUS_VARIANTS[enrollment.status] || "default"}>
              {STATUS_LABELS[enrollment.status] || enrollment.status}
            </Badge>
          </TableCell>
          <TableCell>
            <Badge
              variant={PAYMENT_VARIANTS[enrollment.paymentStatus] || "default"}
            >
              {PAYMENT_LABELS[enrollment.paymentStatus] ||
                enrollment.paymentStatus}
            </Badge>
          </TableCell>
          <TableCell>{renderCertificateCell(enrollment)}</TableCell>
          <TableCell>
            <span className="text-muted-foreground text-sm">
              {format(new Date(enrollment.enrolledAt), "MMM dd, yyyy")}
            </span>
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    params={{ scheduleId: enrollment.scheduleId }}
                    to="/app/training/schedules/$scheduleId"
                  >
                    View Schedule
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    params={{ clientId: enrollment.clientId }}
                    to="/app/clients/$clientId"
                  >
                    View Client
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {enrollment.status === "REGISTERED" && (
                  <DropdownMenuItem
                    onClick={() =>
                      handleUpdateStatus(enrollment.id, "CONFIRMED")
                    }
                  >
                    Confirm Registration
                  </DropdownMenuItem>
                )}
                {enrollment.status === "CONFIRMED" && (
                  <DropdownMenuItem
                    onClick={() =>
                      handleUpdateStatus(enrollment.id, "ATTENDED")
                    }
                  >
                    Mark as Attended
                  </DropdownMenuItem>
                )}
                {(enrollment.status === "REGISTERED" ||
                  enrollment.status === "CONFIRMED") && (
                  <>
                    <DropdownMenuItem
                      onClick={() =>
                        handleUpdateStatus(enrollment.id, "NO_SHOW")
                      }
                    >
                      Mark as No Show
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() =>
                        handleUpdateStatus(enrollment.id, "CANCELLED")
                      }
                    >
                      Cancel Enrollment
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                {enrollment.paymentStatus !== "PAID" && (
                  <DropdownMenuItem
                    onClick={() =>
                      handleUpdatePaymentStatus(enrollment.id, "PAID")
                    }
                  >
                    Mark as Paid
                  </DropdownMenuItem>
                )}
                {enrollment.paymentStatus === "PENDING" && (
                  <DropdownMenuItem
                    onClick={() =>
                      handleUpdatePaymentStatus(enrollment.id, "PARTIAL")
                    }
                  >
                    Mark as Partial Payment
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      ));
    }

    return (
      <TableRow>
        <TableCell className="h-32 text-center" colSpan={8}>
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <User className="h-12 w-12" />
            <p>No enrollments found</p>
            {(statusFilter !== "all" ||
              paymentFilter !== "all" ||
              searchTerm) && (
              <p className="text-sm">
                Try adjusting your filters to see more results.
              </p>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="flex flex-col">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Training", href: "/app/training" },
          { label: "Enrollments" },
        ]}
        description="View and manage all training enrollments"
        title="Training Enrollments"
      />

      <div className="p-6">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative min-w-64 flex-1">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by client or course..."
              value={searchTerm}
            />
          </div>

          <Select onValueChange={setStatusFilter} value={statusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="REGISTERED">Registered</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="ATTENDED">Attended</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="NO_SHOW">No Show</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={setPaymentFilter} value={paymentFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="REFUNDED">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Enrollments Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participant</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Certificate</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>{renderEnrollmentsTableContent()}</TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
