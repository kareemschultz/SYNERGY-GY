import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  MailX,
  MoreHorizontal,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/app/admin/portal-invites")({
  component: PortalInvitesPage,
});

type InviteStatus = "PENDING" | "USED" | "EXPIRED" | "REVOKED";

const statusConfig: Record<
  InviteStatus,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  PENDING: {
    label: "Pending",
    color: "border-yellow-200 bg-yellow-500/10 text-yellow-600",
    icon: Clock,
  },
  USED: {
    label: "Used",
    color: "border-green-200 bg-green-500/10 text-green-600",
    icon: CheckCircle2,
  },
  EXPIRED: {
    label: "Expired",
    color: "border-gray-200 bg-gray-500/10 text-gray-600",
    icon: AlertCircle,
  },
  REVOKED: {
    label: "Revoked",
    color: "border-red-200 bg-red-500/10 text-red-600",
    icon: XCircle,
  },
};

function PortalInvitesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["portal", "invites", { search, status: statusFilter, page }],
    queryFn: () =>
      client.portal.invite.list({
        page,
        limit: 20,
        search: search || undefined,
        status:
          statusFilter === "all" ? undefined : (statusFilter as InviteStatus),
      }),
  });

  return (
    <div className="flex flex-col">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Admin", href: "/app/admin" },
          { label: "Portal Invites" },
        ]}
        description="View and manage client portal invitations"
        title="Portal Invites"
      />

      <div className="p-6">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative min-w-64 flex-1">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by email or client name..."
              value={search}
            />
          </div>

          <Select
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            value={statusFilter}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="USED">Used</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
              <SelectItem value="REVOKED">Revoked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Error state */}
        {error ? (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Failed to load invites</p>
              <p className="text-sm">
                {error instanceof Error
                  ? error.message
                  : "An error occurred. Please try again."}
              </p>
            </div>
          </div>
        ) : null}

        {/* Invites Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent By</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell className="h-32 text-center" colSpan={7}>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading invites...
                    </div>
                  </TableCell>
                </TableRow>
              ) : data?.invites && data.invites.length > 0 ? (
                data.invites.map((invite) => (
                  <InviteTableRow invite={invite} key={invite.id} />
                ))
              ) : (
                <TableRow>
                  <TableCell className="h-32 text-center" colSpan={7}>
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <MailX className="h-8 w-8" />
                      <p>No portal invites found</p>
                      <p className="text-sm">
                        Send invites from the client detail page
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Showing {(page - 1) * 20 + 1} to{" "}
              {Math.min(page * 20, data.pagination.total)} of{" "}
              {data.pagination.total} invites
            </p>
            <div className="flex gap-2">
              <Button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                size="sm"
                variant="outline"
              >
                Previous
              </Button>
              <Button
                disabled={page === data.pagination.totalPages}
                onClick={() => setPage(page + 1)}
                size="sm"
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type Invite = {
  id: string;
  clientId: string;
  email: string;
  status: string;
  computedStatus: string;
  expiresAt: Date;
  createdAt: Date;
  usedAt: Date | null;
  revokedAt: Date | null;
  revocationReason: string | null;
  clientName: string | null;
  createdByName: string | null;
  revokedByName: string | null;
};

function InviteTableRow({ invite }: { invite: Invite }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");

  const displayStatus = invite.computedStatus as InviteStatus;
  const config = statusConfig[displayStatus];
  const StatusIcon = config.icon;

  const revokeMutation = useMutation({
    mutationFn: (reason: string) =>
      client.portal.invite.revoke({
        inviteId: invite.id,
        reason: reason || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal", "invites"] });
      toast({
        title: "Invite revoked",
        description: `Portal invite for ${invite.email} has been revoked.`,
      });
      setShowRevokeDialog(false);
      setRevokeReason("");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to revoke invite. Please try again.",
      });
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => client.portal.invite.resend({ inviteId: invite.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal", "invites"] });
      toast({
        title: "Invite resent",
        description: `A new portal invite has been sent to ${invite.email}.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to resend invite. Please try again.",
      });
    },
  });

  const canRevoke = displayStatus === "PENDING";
  const canResend = displayStatus === "EXPIRED" || displayStatus === "REVOKED";

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">
          {invite.clientName ? (
            <Link
              className="hover:underline"
              params={{ clientId: invite.clientId }}
              to="/app/clients/$clientId"
            >
              {invite.clientName}
            </Link>
          ) : (
            <span className="text-muted-foreground">Unknown</span>
          )}
        </TableCell>
        <TableCell className="text-sm">{invite.email}</TableCell>
        <TableCell>
          <Badge className={config.color} variant="outline">
            <StatusIcon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
        </TableCell>
        <TableCell className="text-sm">
          {invite.createdByName || "Unknown"}
        </TableCell>
        <TableCell className="text-sm">
          <span title={format(new Date(invite.createdAt), "PPpp")}>
            {formatDistanceToNow(new Date(invite.createdAt), {
              addSuffix: true,
            })}
          </span>
        </TableCell>
        <TableCell className="text-sm">
          {displayStatus === "USED" ? (
            <span className="text-muted-foreground">-</span>
          ) : (
            <span
              className={
                displayStatus === "EXPIRED" ? "text-red-600" : undefined
              }
              title={format(new Date(invite.expiresAt), "PPpp")}
            >
              {formatDistanceToNow(new Date(invite.expiresAt), {
                addSuffix: true,
              })}
            </span>
          )}
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
                  params={{ clientId: invite.clientId }}
                  to="/app/clients/$clientId"
                >
                  View Client
                </Link>
              </DropdownMenuItem>
              {(canRevoke || canResend) && <DropdownMenuSeparator />}
              {canRevoke && (
                <DropdownMenuItem
                  className="text-red-600"
                  disabled={revokeMutation.isPending}
                  onClick={() => setShowRevokeDialog(true)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Revoke Invite
                </DropdownMenuItem>
              )}
              {canResend && (
                <DropdownMenuItem
                  disabled={resendMutation.isPending}
                  onClick={() => resendMutation.mutate()}
                >
                  {resendMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Resend Invite
                    </>
                  )}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* Revoke Dialog */}
      <AlertDialog onOpenChange={setShowRevokeDialog} open={showRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Portal Invite</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the portal invite for{" "}
              <strong>{invite.email}</strong>? They will no longer be able to
              use this link to create their account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Textarea
              className="min-h-20"
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="Reason for revoking (optional)"
              value={revokeReason}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={revokeMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                revokeMutation.mutate(revokeReason);
              }}
            >
              {revokeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                "Revoke Invite"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
