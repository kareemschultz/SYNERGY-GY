import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
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

type ConfirmDialogProps = {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  isLoading = false,
  open,
  onOpenChange,
}: ConfirmDialogProps) {
  const Icon = variant === "destructive" ? Trash2 : AlertTriangle;

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                variant === "destructive"
                  ? "bg-destructive/10"
                  : "bg-amber-100 dark:bg-amber-900/30"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${
                  variant === "destructive"
                    ? "text-destructive"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              />
            </div>
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="mt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            className={
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            }
            disabled={isLoading}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type DeleteConfirmDialogProps = {
  trigger: ReactNode;
  itemName: string;
  itemType?: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function DeleteConfirmDialog({
  trigger,
  itemName,
  itemType = "item",
  onConfirm,
  isLoading = false,
  open,
  onOpenChange,
}: DeleteConfirmDialogProps) {
  return (
    <ConfirmDialog
      cancelLabel="Cancel"
      confirmLabel="Delete"
      description={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
      isLoading={isLoading}
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
      open={open}
      title={`Delete ${itemType}?`}
      trigger={trigger}
      variant="destructive"
    />
  );
}
