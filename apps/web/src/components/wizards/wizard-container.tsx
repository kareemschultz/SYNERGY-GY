import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { WizardNavigation } from "./wizard-navigation";
import {
  WizardProgress,
  WizardProgressBar,
  type WizardProgressStep,
} from "./wizard-progress";

type WizardContainerProps = {
  children: ReactNode;
  steps: WizardProgressStep[];
  currentStep: number;
  visitedSteps: Set<number>;
  progress: number;
  totalSteps: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  canSkip: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting?: boolean;
  onStepClick?: (step: number) => void;
  onPrev?: () => void;
  onNext?: () => void;
  onSkip?: () => void;
  onSubmit?: () => void;
  title?: string;
  description?: string;
  progressVariant?: "steps" | "bar" | "both" | "none";
  layout?: "default" | "sidebar" | "compact";
  className?: string;
  submitLabel?: string;
};

export function WizardContainer({
  children,
  steps,
  currentStep,
  visitedSteps,
  progress,
  totalSteps,
  canGoPrev,
  canGoNext,
  canSkip,
  isFirstStep,
  isLastStep,
  isSubmitting = false,
  onStepClick,
  onPrev,
  onNext,
  onSkip,
  onSubmit,
  title,
  description,
  progressVariant = "both",
  layout = "default",
  className,
  submitLabel,
}: WizardContainerProps) {
  const showSteps = progressVariant === "steps" || progressVariant === "both";
  const showBar = progressVariant === "bar" || progressVariant === "both";

  if (layout === "sidebar") {
    return (
      <div className={cn("flex min-h-[600px] gap-6", className)}>
        {/* Sidebar with vertical progress */}
        <aside className="hidden border-r pr-6 md:block">
          <div className="sticky top-4">
            {title ? (
              <div className="mb-6">
                <h1 className="font-semibold text-lg">{title}</h1>
                {description ? (
                  <p className="text-muted-foreground text-sm">{description}</p>
                ) : null}
              </div>
            ) : null}
            <WizardProgress
              currentStep={currentStep}
              onStepClick={onStepClick}
              steps={steps}
              variant="vertical"
              visitedSteps={visitedSteps}
            />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col">
          {/* Mobile progress bar */}
          {showBar ? (
            <div className="mb-6 md:hidden">
              <WizardProgressBar
                currentStep={currentStep}
                progress={progress}
                totalSteps={totalSteps}
              />
            </div>
          ) : null}

          {/* Step content */}
          <div className="flex-1">{children}</div>

          {/* Navigation */}
          <WizardNavigation
            canGoNext={canGoNext}
            canGoPrev={canGoPrev}
            canSkip={canSkip}
            className="mt-6 border-t-0 px-0"
            isFirstStep={isFirstStep}
            isLastStep={isLastStep}
            isSubmitting={isSubmitting}
            onNext={onNext}
            onPrev={onPrev}
            onSkip={onSkip}
            onSubmit={onSubmit}
            submitLabel={submitLabel}
          />
        </div>
      </div>
    );
  }

  if (layout === "compact") {
    return (
      <div className={cn("space-y-4", className)}>
        {showBar ? (
          <WizardProgressBar
            currentStep={currentStep}
            progress={progress}
            totalSteps={totalSteps}
          />
        ) : null}

        <Card>
          <CardContent className="p-6">
            {children}

            <WizardNavigation
              canGoNext={canGoNext}
              canGoPrev={canGoPrev}
              canSkip={canSkip}
              className="mt-6 border-t px-0 pt-6"
              isFirstStep={isFirstStep}
              isLastStep={isLastStep}
              isSubmitting={isSubmitting}
              onNext={onNext}
              onPrev={onPrev}
              onSkip={onSkip}
              onSubmit={onSubmit}
              submitLabel={submitLabel}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default layout
  return (
    <div className={cn("flex flex-col space-y-6", className)}>
      {/* Header */}
      {title || description ? (
        <div>
          {title ? <h1 className="font-semibold text-2xl">{title}</h1> : null}
          {description ? (
            <p className="mt-1 text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}

      {/* Progress indicator */}
      {showBar ? (
        <WizardProgressBar
          currentStep={currentStep}
          progress={progress}
          totalSteps={totalSteps}
        />
      ) : null}

      {showSteps ? (
        <WizardProgress
          currentStep={currentStep}
          onStepClick={onStepClick}
          steps={steps}
          variant="horizontal"
          visitedSteps={visitedSteps}
        />
      ) : null}

      {/* Main content card */}
      <Card className="flex-1">
        <CardContent className="p-6">{children}</CardContent>
      </Card>

      {/* Navigation */}
      <WizardNavigation
        canGoNext={canGoNext}
        canGoPrev={canGoPrev}
        canSkip={canSkip}
        className="rounded-lg border"
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        isSubmitting={isSubmitting}
        onNext={onNext}
        onPrev={onPrev}
        onSkip={onSkip}
        onSubmit={onSubmit}
        submitLabel={submitLabel}
      />
    </div>
  );
}

type WizardSuccessProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

export function WizardSuccess({
  title,
  description,
  children,
  className,
}: WizardSuccessProps) {
  return (
    <Card className={cn("text-center", className)}>
      <CardContent className="py-12">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <svg
            aria-hidden="true"
            className="size-8 text-green-600 dark:text-green-400"
            fill="none"
            role="img"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <title>Success checkmark</title>
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h2 className="font-semibold text-xl">{title}</h2>
        {description ? (
          <p className="mt-2 text-muted-foreground">{description}</p>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </CardContent>
    </Card>
  );
}
