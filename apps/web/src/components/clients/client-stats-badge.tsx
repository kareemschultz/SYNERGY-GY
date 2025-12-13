import type { LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ClientStatBadgeProps = {
  icon: LucideIcon;
  value: number | string;
  label: string;
  variant?: "default" | "warning" | "danger" | "success" | "muted";
  tooltip?: string;
  className?: string;
};

const variantStyles = {
  default: "bg-primary/10 text-primary",
  warning: "bg-yellow-500/10 text-yellow-600",
  danger: "bg-red-500/10 text-red-600",
  success: "bg-green-500/10 text-green-600",
  muted: "bg-muted text-muted-foreground",
};

export function ClientStatBadge({
  icon: Icon,
  value,
  label: _label,
  variant = "default",
  tooltip,
  className,
}: ClientStatBadgeProps) {
  const content = (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-1",
        variantStyles[variant],
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="font-medium text-xs">{value}</span>
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

type WorkloadBadgeProps = {
  activeMatterCount: number;
  pendingMatterCount: number;
  totalMatterCount: number;
};

export function WorkloadBadge({
  activeMatterCount,
  pendingMatterCount,
  totalMatterCount,
}: WorkloadBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex items-center gap-1">
            <span
              className={cn(
                "font-semibold text-sm",
                activeMatterCount > 0 ? "text-primary" : "text-muted-foreground"
              )}
            >
              {activeMatterCount}
            </span>
            <span className="text-muted-foreground text-xs">
              / {totalMatterCount}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p>{activeMatterCount} active matters</p>
            {pendingMatterCount > 0 && (
              <p className="text-yellow-400">
                {pendingMatterCount} pending client action
              </p>
            )}
            <p className="text-muted-foreground">{totalMatterCount} total</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

type FinancialBadgeProps = {
  totalOutstanding: string;
  overdueAmount: string;
  overdueCount: number;
};

export function FinancialBadge({
  totalOutstanding,
  overdueAmount,
  overdueCount,
}: FinancialBadgeProps) {
  const outstanding = Number.parseFloat(totalOutstanding) || 0;
  const overdue = Number.parseFloat(overdueAmount) || 0;

  const formatCurrency = (amount: number) => {
    if (amount >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  if (outstanding === 0) {
    return <span className="font-medium text-green-600 text-xs">Paid up</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex flex-col items-end">
            <span
              className={cn(
                "font-semibold text-sm",
                overdue > 0 ? "text-red-600" : "text-foreground"
              )}
            >
              {formatCurrency(outstanding)}
            </span>
            {overdueCount > 0 && (
              <span className="text-red-500 text-xs">
                {overdueCount} overdue
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p>Outstanding: ${outstanding.toLocaleString()}</p>
            {overdue > 0 && (
              <p className="text-red-400">
                Overdue: ${overdue.toLocaleString()} ({overdueCount} invoices)
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

type EngagementBadgeProps = {
  lastContactDate: string | null;
  upcomingAppointmentCount: number;
  nextAppointmentDate: string | null;
};

export function EngagementBadge({
  lastContactDate,
  upcomingAppointmentCount,
}: EngagementBadgeProps) {
  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    }
    if (diffDays === 1) {
      return "1d ago";
    }
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }
    if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)}w ago`;
    }
    if (diffDays < 365) {
      return `${Math.floor(diffDays / 30)}mo ago`;
    }
    return `${Math.floor(diffDays / 365)}y ago`;
  };

  return (
    <div className="flex flex-col items-end text-xs">
      <span className="text-muted-foreground">
        {lastContactDate ? getRelativeTime(lastContactDate) : "No contact"}
      </span>
      {upcomingAppointmentCount > 0 && (
        <span className="text-primary">
          {upcomingAppointmentCount} appt
          {upcomingAppointmentCount > 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
