import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type BulkActionsToolbarProps = {
  selectedCount: number;
  onClearSelection: () => void;
  children: ReactNode;
  entityName?: string;
};

/**
 * Toolbar that appears when items are selected in a table
 * Shows selection count and bulk action buttons
 */
export function BulkActionsToolbar({
  selectedCount,
  onClearSelection,
  children,
  entityName = "items",
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="sticky bottom-0 z-10 flex items-center justify-between gap-4 rounded-lg border bg-muted/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-muted/80">
      <div className="flex items-center gap-4">
        <span className="font-medium text-sm">
          {selectedCount}{" "}
          {selectedCount === 1 ? entityName.replace(/s$/, "") : entityName}{" "}
          selected
        </span>
        <Button
          className="h-8 px-2"
          onClick={onClearSelection}
          size="sm"
          variant="ghost"
        >
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
