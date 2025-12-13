import { Link } from "@tanstack/react-router";
import {
  Briefcase,
  Calendar,
  Mail,
  MoreHorizontal,
  Phone,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  EngagementBadge,
  FinancialBadge,
  WorkloadBadge,
} from "./client-stats-badge";
import { ComplianceIndicator } from "./compliance-indicator";

type ClientWithStats = {
  id: string;
  displayName: string;
  type: string;
  email: string | null;
  phone: string | null;
  businesses: string[];
  status: string;
  graCompliant: boolean;
  nisCompliant: boolean;
  amlRiskRating: "LOW" | "MEDIUM" | "HIGH";
  activeMatterCount: number;
  pendingMatterCount: number;
  totalMatterCount: number;
  financials: {
    totalOutstanding: string;
    overdueAmount: string;
    overdueCount: number;
  } | null;
  lastContactDate: string | null;
  upcomingAppointmentCount: number;
  nextAppointmentDate: string | null;
};

const clientTypeLabels: Record<string, string> = {
  INDIVIDUAL: "Individual",
  SMALL_BUSINESS: "Small Business",
  CORPORATION: "Corporation",
  NGO: "NGO",
  COOP: "Cooperative",
  CREDIT_UNION: "Credit Union",
  FOREIGN_NATIONAL: "Foreign National",
  INVESTOR: "Investor",
};

const statusVariants: Record<string, { className: string; label: string }> = {
  ACTIVE: {
    className: "bg-green-500/10 text-green-600 border-green-200",
    label: "Active",
  },
  INACTIVE: {
    className: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    label: "Inactive",
  },
  ARCHIVED: {
    className: "bg-gray-500/10 text-gray-600 border-gray-200",
    label: "Archived",
  },
};

type ClientCardProps = {
  client: ClientWithStats;
  canViewFinancials: boolean;
};

export function ClientCard({ client, canViewFinancials }: ClientCardProps) {
  const statusVariant = statusVariants[client.status] || statusVariants.ACTIVE;
  const financials = canViewFinancials ? client.financials : null;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Header: Name + Status + Actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link
              className="font-semibold text-base hover:underline"
              params={{ clientId: client.id }}
              to="/app/clients/$clientId"
            >
              {client.displayName}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-sm">
                {clientTypeLabels[client.type] || client.type}
              </span>
              <div className="flex gap-1">
                {client.businesses.includes("GCMC") && (
                  <Badge
                    className="bg-emerald-500/10 text-emerald-600 text-xs"
                    variant="outline"
                  >
                    GCMC
                  </Badge>
                )}
                {client.businesses.includes("KAJ") && (
                  <Badge
                    className="bg-blue-500/10 text-blue-600 text-xs"
                    variant="outline"
                  >
                    KAJ
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusVariant.className} variant="outline">
              {statusVariant.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    params={{ clientId: client.id }}
                    to="/app/clients/$clientId"
                  >
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    params={{ clientId: client.id }}
                    search={{ edit: true }}
                    to="/app/clients/$clientId"
                  >
                    Edit
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-4 grid grid-cols-4 gap-3 border-t pt-4">
          {/* Workload */}
          <div className="flex flex-col items-center">
            <Briefcase className="mb-1 h-4 w-4 text-muted-foreground" />
            <WorkloadBadge
              activeMatterCount={client.activeMatterCount}
              pendingMatterCount={client.pendingMatterCount}
              totalMatterCount={client.totalMatterCount}
            />
            <span className="mt-0.5 text-muted-foreground text-xs">
              Matters
            </span>
          </div>

          {/* Engagement */}
          <div className="flex flex-col items-center">
            <Calendar className="mb-1 h-4 w-4 text-muted-foreground" />
            <EngagementBadge
              lastContactDate={client.lastContactDate}
              nextAppointmentDate={client.nextAppointmentDate}
              upcomingAppointmentCount={client.upcomingAppointmentCount}
            />
            <span className="mt-0.5 text-muted-foreground text-xs">
              Contact
            </span>
          </div>

          {/* Compliance */}
          <div className="flex flex-col items-center">
            <User className="mb-1 h-4 w-4 text-muted-foreground" />
            <ComplianceIndicator
              amlRiskRating={client.amlRiskRating}
              compact
              graCompliant={client.graCompliant}
              nisCompliant={client.nisCompliant}
            />
            <span className="mt-0.5 text-muted-foreground text-xs">
              Compliance
            </span>
          </div>

          {/* Financial */}
          <div className="flex flex-col items-center">
            {financials !== null ? (
              <>
                <FinancialBadge
                  overdueAmount={financials.overdueAmount}
                  overdueCount={financials.overdueCount}
                  totalOutstanding={financials.totalOutstanding}
                />
                <span className="mt-0.5 text-muted-foreground text-xs">
                  Balance
                </span>
              </>
            ) : (
              <span className="text-muted-foreground text-xs">-</span>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-4 space-y-1 border-t pt-3 text-sm">
          {Boolean(client.email) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{client.email}</span>
            </div>
          )}
          {Boolean(client.phone) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span>{client.phone}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
