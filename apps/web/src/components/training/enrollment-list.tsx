/**
 * EnrollmentList Component
 *
 * Displays a list of enrolled participants for a training schedule
 * with status tracking and certificate management.
 */

import { format } from "date-fns";
import { Award, Mail, User } from "lucide-react";
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

type EnrollmentListProps = {
  enrollments: Array<{
    id: string;
    clientId: string;
    clientName: string;
    clientEmail: string | null;
    status: string;
    paymentStatus: string;
    certificateNumber: string | null;
    certificateIssuedAt: Date | null;
    enrolledAt: Date;
  }>;
  onUpdateStatus?: (enrollmentId: string, status: string) => void;
  onIssueCertificate?: (enrollmentId: string) => void;
};

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

export function EnrollmentList({
  enrollments,
  onUpdateStatus,
  onIssueCertificate,
}: EnrollmentListProps) {
  if (enrollments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <User className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-2 text-muted-foreground text-sm">
          No enrollments yet. Add participants to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Participant</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Certificate</TableHead>
            <TableHead>Enrolled</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrollments.map((enrollment) => (
            <TableRow key={enrollment.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{enrollment.clientName}</span>
                  {!!enrollment.clientEmail && (
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <Mail className="h-3 w-3" />
                      <span>{enrollment.clientEmail}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={STATUS_VARIANTS[enrollment.status] || "default"}
                >
                  {STATUS_LABELS[enrollment.status] || enrollment.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    PAYMENT_VARIANTS[enrollment.paymentStatus] || "default"
                  }
                >
                  {PAYMENT_LABELS[enrollment.paymentStatus] ||
                    enrollment.paymentStatus}
                </Badge>
              </TableCell>
              <TableCell>
                {enrollment.certificateNumber ? (
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-green-600" />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {enrollment.certificateNumber}
                      </span>
                      {!!enrollment.certificateIssuedAt && (
                        <span className="text-muted-foreground text-xs">
                          Issued{" "}
                          {format(
                            new Date(enrollment.certificateIssuedAt),
                            "MMM dd, yyyy"
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  // biome-ignore lint/style/noNestedTernary: Auto-fix
                ) : enrollment.status === "ATTENDED" ? (
                  <Button
                    onClick={() => onIssueCertificate?.(enrollment.id)}
                    size="sm"
                    variant="outline"
                  >
                    <Award className="mr-2 h-4 w-4" />
                    Issue Certificate
                  </Button>
                ) : (
                  <span className="text-muted-foreground text-sm">
                    Not available
                  </span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground text-sm">
                  {format(new Date(enrollment.enrolledAt), "MMM dd, yyyy")}
                </span>
              </TableCell>
              <TableCell className="text-right">
                {enrollment.status === "CONFIRMED" && (
                  <Button
                    onClick={() => onUpdateStatus?.(enrollment.id, "ATTENDED")}
                    size="sm"
                    variant="outline"
                  >
                    Mark Attended
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
