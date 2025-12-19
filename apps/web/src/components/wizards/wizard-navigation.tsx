import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type WizardNavigationProps = {
  onPrev?: () => void;
  onNext?: () => void;
  onSkip?: () => void;
  onSubmit?: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  canSkip: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting?: boolean;
  prevLabel?: string;
  nextLabel?: string;
  skipLabel?: string;
  submitLabel?: string;
  className?: string;
  /** Validation errors to display when button is disabled */
  errors?: Record<string, string>;
  /** Field labels for friendly error display */
  fieldLabels?: Record<string, string>;
};

export function WizardNavigation({
  onPrev,
  onNext,
  onSkip,
  onSubmit,
  canGoPrev,
  canGoNext,
  canSkip,
  isFirstStep,
  isLastStep,
  isSubmitting = false,
  prevLabel = "Back",
  nextLabel = "Continue",
  skipLabel = "Skip",
  submitLabel = "Submit",
  className,
  errors = {},
  fieldLabels = {},
}: WizardNavigationProps) {
  // Filter out submit errors for field validation display
  const fieldErrors = Object.entries(errors).filter(
    ([key]) => key !== "submit"
  );
  const hasFieldErrors = fieldErrors.length > 0;
  const isDisabled = !canGoNext || isSubmitting;

  // Generate human-readable error summary for tooltip
  const getErrorSummary = (): string => {
    if (isSubmitting) {
      return "Processing...";
    }
    if (!hasFieldErrors) {
      return "Please complete all required fields";
    }

    const errorMessages = fieldErrors.map(([key, message]) => {
      const label = fieldLabels[key] || key.replace(/([A-Z])/g, " $1").trim();
      return `${label}: ${message}`;
    });

    if (errorMessages.length === 1) {
      return errorMessages[0];
    }

    return `${errorMessages.length} fields need attention:\n${errorMessages.join("\n")}`;
  };

  // Compute aria-describedby to avoid lint warning
  const showValidationHint = isDisabled && hasFieldErrors;
  const ariaDescribedBy = showValidationHint ? "validation-hint" : undefined;

  const NextButton = (
    <Button
      aria-describedby={ariaDescribedBy}
      disabled={isDisabled}
      onClick={onNext}
      type="button"
    >
      {nextLabel}
      <ArrowRight className="ml-2 size-4" />
    </Button>
  );

  const SubmitButton = (
    <Button
      aria-describedby={ariaDescribedBy}
      disabled={isDisabled}
      onClick={onSubmit}
      type="button"
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          Processing...
        </>
      ) : (
        submitLabel
      )}
    </Button>
  );

  // Render the action button with tooltip or plain based on state
  const renderActionButton = () => {
    const buttonToShow = isLastStep ? SubmitButton : NextButton;

    if (isDisabled && !isSubmitting) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>{buttonToShow}</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs" side="top">
              <p className="whitespace-pre-line">{getErrorSummary()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return buttonToShow;
  };

  return (
    <div className={cn("border-t bg-background px-6 py-4", className)}>
      {/* Validation message when button is disabled */}
      {Boolean(isDisabled) &&
      Boolean(hasFieldErrors) &&
      fieldErrors.length > 0 ? (
        <div
          aria-live="polite"
          className="mb-3 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 text-sm dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
          id="validation-hint"
          role="alert"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>
            {fieldErrors.length === 1
              ? fieldErrors[0][1]
              : `Please complete ${fieldErrors.length} required field${fieldErrors.length > 1 ? "s" : ""} above to continue`}
          </span>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        {/* Left side - Back button */}
        <div>
          {isFirstStep ? null : (
            <Button
              disabled={!canGoPrev || isSubmitting}
              onClick={onPrev}
              type="button"
              variant="ghost"
            >
              <ArrowLeft className="mr-2 size-4" />
              {prevLabel}
            </Button>
          )}
        </div>

        {/* Right side - Skip and Next/Submit */}
        <div className="flex items-center gap-2">
          {Boolean(canSkip) && !isLastStep && onSkip !== undefined ? (
            <Button
              disabled={isSubmitting}
              onClick={onSkip}
              type="button"
              variant="ghost"
            >
              {skipLabel}
              <SkipForward className="ml-2 size-4" />
            </Button>
          ) : null}

          {/* Show tooltip on disabled button explaining why */}
          {renderActionButton()}
        </div>
      </div>
    </div>
  );
}

type WizardNavigationCompactProps = {
  onPrev?: () => void;
  onNext?: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting?: boolean;
  className?: string;
};

export function WizardNavigationCompact({
  onPrev,
  onNext,
  canGoPrev,
  canGoNext,
  isFirstStep,
  isLastStep,
  isSubmitting = false,
  className,
}: WizardNavigationCompactProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        disabled={isFirstStep || !canGoPrev || isSubmitting}
        onClick={onPrev}
        size="icon"
        type="button"
        variant="outline"
      >
        <ArrowLeft className="size-4" />
        <span className="sr-only">Previous step</span>
      </Button>
      <Button
        disabled={!canGoNext || isSubmitting}
        onClick={onNext}
        size="icon"
        type="button"
        variant={isLastStep ? "default" : "outline"}
      >
        {isSubmitting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ArrowRight className="size-4" />
        )}
        <span className="sr-only">{isLastStep ? "Submit" : "Next step"}</span>
      </Button>
    </div>
  );
}
