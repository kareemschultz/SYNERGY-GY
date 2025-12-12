import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type ValidationSummaryProps = {
  errors: Record<string, string>;
  className?: string;
  /** Show as a compact inline message instead of full alert */
  variant?: "default" | "compact" | "inline";
  /** Custom title for the error summary */
  title?: string;
  /** Field labels to show friendly names instead of field keys */
  fieldLabels?: Record<string, string>;
};

/**
 * Displays a summary of validation errors.
 * Use this to help users understand why they can't proceed.
 */
export function ValidationSummary({
  errors,
  className,
  variant = "default",
  title = "Please fix the following issues:",
  fieldLabels = {},
}: ValidationSummaryProps) {
  const errorEntries = Object.entries(errors).filter(
    ([key]) => key !== "submit"
  );

  if (errorEntries.length === 0) {
    return null;
  }

  const getFieldLabel = (key: string): string =>
    fieldLabels[key] || key.replace(/([A-Z])/g, " $1").trim();

  if (variant === "inline") {
    return (
      <p
        aria-live="polite"
        className={cn(
          "flex items-center gap-1.5 text-destructive text-sm",
          className
        )}
        role="alert"
      >
        <AlertCircle className="size-4 shrink-0" />
        <span>
          {errorEntries.length === 1
            ? errorEntries[0][1]
            : `${errorEntries.length} fields need attention`}
        </span>
      </p>
    );
  }

  if (variant === "compact") {
    return (
      <div
        aria-live="polite"
        className={cn(
          "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-destructive text-sm",
          className
        )}
        role="alert"
      >
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div>
            <span className="font-medium">
              {errorEntries.length === 1
                ? "1 field needs attention"
                : `${errorEntries.length} fields need attention`}
            </span>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs">
              {errorEntries.map(([key, message]) => (
                <li key={key}>
                  <span className="font-medium">{getFieldLabel(key)}:</span>{" "}
                  {message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Alert
      aria-live="polite"
      className={cn("border-destructive/50 bg-destructive/10", className)}
      role="alert"
      variant="destructive"
    >
      <AlertCircle className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 list-inside list-disc space-y-1">
          {errorEntries.map(([key, message]) => (
            <li key={key}>
              <span className="font-medium">{getFieldLabel(key)}:</span>{" "}
              {message}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

type ValidationStatusProps = {
  isValid: boolean;
  validMessage?: string;
  invalidMessage?: string;
  className?: string;
};

/**
 * Shows a simple valid/invalid status indicator.
 */
export function ValidationStatus({
  isValid,
  validMessage = "Ready to continue",
  invalidMessage = "Please complete required fields",
  className,
}: ValidationStatusProps) {
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-sm",
        isValid
          ? "text-green-600 dark:text-green-500"
          : "text-muted-foreground",
        className
      )}
    >
      {isValid ? (
        <>
          <CheckCircle2 className="size-4" />
          <span>{validMessage}</span>
        </>
      ) : (
        <>
          <Info className="size-4" />
          <span>{invalidMessage}</span>
        </>
      )}
    </p>
  );
}

type FieldErrorProps = {
  error?: string;
  className?: string;
  id?: string;
};

/**
 * Displays a field-level error message.
 * Use below form inputs to show validation errors.
 */
export function FieldError({ error, className, id }: FieldErrorProps) {
  if (!error) {
    return null;
  }

  return (
    <p
      aria-live="polite"
      className={cn("mt-1.5 text-destructive text-sm", className)}
      id={id}
      role="alert"
    >
      {error}
    </p>
  );
}
