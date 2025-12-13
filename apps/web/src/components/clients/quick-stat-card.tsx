import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type QuickStatCardProps = {
  icon: LucideIcon;
  label: string;
  value: number | string;
  subtext?: string;
  variant?: "default" | "warning" | "danger" | "success" | "muted";
  className?: string;
};

const variantStyles = {
  default: {
    icon: "text-primary",
    value: "text-foreground",
  },
  warning: {
    icon: "text-yellow-600",
    value: "text-yellow-600",
  },
  danger: {
    icon: "text-red-600",
    value: "text-red-600",
  },
  success: {
    icon: "text-green-600",
    value: "text-green-600",
  },
  muted: {
    icon: "text-muted-foreground",
    value: "text-muted-foreground",
  },
};

export function QuickStatCard({
  icon: Icon,
  label,
  value,
  subtext,
  variant = "default",
  className,
}: QuickStatCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg bg-muted",
              styles.icon
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className={cn("font-semibold text-xl", styles.value)}>{value}</p>
            {subtext ? (
              <p className="truncate text-muted-foreground text-xs">
                {subtext}
              </p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
