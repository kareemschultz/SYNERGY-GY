import { ArrowLeft, ArrowRight, Loader2, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
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
}: WizardNavigationProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-t bg-background px-6 py-4",
        className
      )}
    >
      {/* Left side - Back button */}
      <div>
        {!isFirstStep && (
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
        {canSkip && !isLastStep && (
          <Button
            disabled={isSubmitting}
            onClick={onSkip}
            type="button"
            variant="ghost"
          >
            {skipLabel}
            <SkipForward className="ml-2 size-4" />
          </Button>
        )}

        {isLastStep ? (
          <Button
            disabled={!canGoNext || isSubmitting}
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
        ) : (
          <Button
            disabled={!canGoNext || isSubmitting}
            onClick={onNext}
            type="button"
          >
            {nextLabel}
            <ArrowRight className="ml-2 size-4" />
          </Button>
        )}
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
