import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type LoadingStateProps = {
  message?: string;
  className?: string;
  variant?: "spinner" | "skeleton" | "card";
};

export function LoadingState({
  message = "Loading...",
  className,
  variant = "spinner",
}: LoadingStateProps) {
  if (variant === "skeleton") {
    return (
      <div className={`space-y-4 ${className ?? ""}`}>
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (variant === "card") {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="mb-4 size-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 ${className ?? ""}`}
    >
      <Loader2 className="mb-4 size-8 animate-spin text-primary" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

// Inline loading spinner for buttons/actions
export function LoadingSpinner({ className }: { className?: string }) {
  return <Loader2 className={`size-4 animate-spin ${className ?? ""}`} />;
}

// Table loading state
export function TableLoadingState({
  columns,
  rows = 5,
}: {
  columns: number;
  rows?: number;
}) {
  // Generate stable unique IDs for skeleton rows/cells
  // These are placeholder skeletons with no data identity, so we generate UUIDs
  const skeletonData = useMemo(
    () =>
      Array.from({ length: rows }, () => ({
        rowId: crypto.randomUUID(),
        cellIds: Array.from({ length: columns }, () => crypto.randomUUID()),
      })),
    [rows, columns]
  );

  return (
    <>
      {skeletonData.map((row) => (
        <tr key={row.rowId}>
          {row.cellIds.map((cellId) => (
            <td className="p-4" key={cellId}>
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
