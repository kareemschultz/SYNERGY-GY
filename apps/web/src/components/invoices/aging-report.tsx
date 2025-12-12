import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Clock, Loader2, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { client } from "@/utils/orpc";

type AgingReportProps = {
  clientId?: string;
  business?: "GCMC" | "KAJ";
  onBusinessChange?: (business: string) => void;
};

function formatCurrency(amount: string): string {
  return `GYD ${Number.parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

const bucketLabels = {
  current: {
    label: "Current",
    description: "Not yet due",
    color: "bg-green-500",
  },
  days30: {
    label: "1-30 Days",
    description: "1-30 days overdue",
    color: "bg-yellow-500",
  },
  days60: {
    label: "31-60 Days",
    description: "31-60 days overdue",
    color: "bg-orange-500",
  },
  days90: {
    label: "61-90 Days",
    description: "61-90 days overdue",
    color: "bg-red-400",
  },
  days90Plus: {
    label: "90+ Days",
    description: "Over 90 days overdue",
    color: "bg-red-600",
  },
};

export function AgingReport({
  clientId,
  business,
  onBusinessChange,
}: AgingReportProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["aging-report", { clientId, business }],
    queryFn: () =>
      client.invoices.getAgingReport({
        clientId,
        business,
      }),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="mr-2 h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading aging report...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12 text-red-500">
          <AlertCircle className="mr-2 h-5 w-5" />
          <span>Failed to load aging report</span>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const totalAmount = Number.parseFloat(data.total.amount);
  const buckets = [
    { key: "current", ...bucketLabels.current, ...data.current },
    { key: "days30", ...bucketLabels.days30, ...data.days30 },
    { key: "days60", ...bucketLabels.days60, ...data.days60 },
    { key: "days90", ...bucketLabels.days90, ...data.days90 },
    { key: "days90Plus", ...bucketLabels.days90Plus, ...data.days90Plus },
  ];

  // Calculate overdue total (excluding current)
  const overdueAmount =
    Number.parseFloat(data.days30.amount) +
    Number.parseFloat(data.days60.amount) +
    Number.parseFloat(data.days90.amount) +
    Number.parseFloat(data.days90Plus.amount);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Accounts Receivable Aging
            </CardTitle>
            <CardDescription>
              Outstanding invoices by age category
            </CardDescription>
          </div>
          {!!onBusinessChange && (
            <Select onValueChange={onBusinessChange} value={business || "all"}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Businesses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Businesses</SelectItem>
                <SelectItem value="GCMC">GCMC</SelectItem>
                <SelectItem value="KAJ">KAJ</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-muted-foreground text-sm">Total Outstanding</p>
            <p className="font-bold text-2xl">
              {formatCurrency(data.total.amount)}
            </p>
            <p className="text-muted-foreground text-xs">
              {data.total.count} invoice(s)
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-muted-foreground text-sm">Current (Not Due)</p>
            <p className="font-bold text-2xl text-green-600">
              {formatCurrency(data.current.amount)}
            </p>
            <p className="text-muted-foreground text-xs">
              {data.current.count} invoice(s)
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-muted-foreground text-sm">Overdue</p>
            <p className="font-bold text-2xl text-red-600">
              {formatCurrency(overdueAmount.toFixed(2))}
            </p>
            <p className="text-muted-foreground text-xs">
              {data.days30.count +
                data.days60.count +
                data.days90.count +
                data.days90Plus.count}{" "}
              invoice(s)
            </p>
          </div>
        </div>

        {/* Aging Breakdown */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Aging Breakdown</h4>
          {buckets.map((bucket) => {
            const amount = Number.parseFloat(bucket.amount);
            const percentage =
              totalAmount > 0 ? (amount / totalAmount) * 100 : 0;

            return (
              <div className="space-y-2" key={bucket.key}>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${bucket.color}`} />
                    <span className="font-medium">{bucket.label}</span>
                    <span className="text-muted-foreground">
                      ({bucket.description})
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                      {bucket.count} inv.
                    </span>
                    <span className="font-medium">
                      {formatCurrency(bucket.amount)}
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full ${bucket.color} transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Visual Bar Chart */}
        {totalAmount > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Distribution</h4>
            <div className="flex h-8 overflow-hidden rounded-lg">
              {buckets.map((bucket) => {
                const amount = Number.parseFloat(bucket.amount);
                const percentage =
                  totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
                if (percentage === 0) {
                  return null;
                }
                return (
                  <div
                    className={`${bucket.color} flex items-center justify-center font-medium text-white text-xs transition-all`}
                    key={bucket.key}
                    style={{ width: `${percentage}%` }}
                    title={`${bucket.label}: ${formatCurrency(bucket.amount)} (${percentage.toFixed(1)}%)`}
                  >
                    {percentage >= 10 && `${percentage.toFixed(0)}%`}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 text-xs">
              {buckets.map((bucket) => (
                <div className="flex items-center gap-1" key={bucket.key}>
                  <div className={`h-2 w-2 rounded-full ${bucket.color}`} />
                  <span className="text-muted-foreground">{bucket.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Outstanding */}
        {totalAmount === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <TrendingUp className="mb-4 h-12 w-12 text-green-500 opacity-50" />
            <p className="font-medium text-green-600">All caught up!</p>
            <p className="text-muted-foreground text-sm">
              No outstanding invoices
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
