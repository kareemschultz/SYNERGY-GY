import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type WizardProgressStep = {
  id: string;
  title: string;
  description?: string;
};

type WizardProgressProps = {
  steps: WizardProgressStep[];
  currentStep: number;
  visitedSteps: Set<number>;
  onStepClick?: (step: number) => void;
  variant?: "horizontal" | "vertical";
  className?: string;
};

export function WizardProgress({
  steps,
  currentStep,
  visitedSteps,
  onStepClick,
  variant = "horizontal",
  className,
}: WizardProgressProps) {
  const isHorizontal = variant === "horizontal";

  return (
    <nav
      aria-label="Wizard progress"
      className={cn(isHorizontal ? "w-full" : "w-64 shrink-0", className)}
    >
      <ol
        className={cn(
          "flex",
          isHorizontal ? "items-center justify-between" : "flex-col space-y-4"
        )}
      >
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isVisited = visitedSteps.has(index);
          const isClickable = isVisited || index === currentStep + 1;

          return (
            <li
              className={cn(
                "relative",
                isHorizontal && index !== steps.length - 1 && "flex-1"
              )}
              key={step.id}
            >
              <div
                className={cn(
                  "flex items-center",
                  isHorizontal ? "flex-col" : "gap-4"
                )}
              >
                {/* Step indicator */}
                <button
                  aria-current={isActive ? "step" : undefined}
                  aria-label={`Step ${index + 1}: ${step.title}${isCompleted ? " (completed)" : ""}`}
                  className={cn(
                    "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 font-medium text-sm transition-all",
                    isActive &&
                      "border-primary bg-primary text-primary-foreground",
                    isCompleted &&
                      "border-primary bg-primary text-primary-foreground",
                    !(isActive || isCompleted) &&
                      "border-muted-foreground/30 bg-background text-muted-foreground",
                    isClickable &&
                      !isActive &&
                      "cursor-pointer hover:border-primary/50"
                  )}
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick?.(index)}
                  type="button"
                >
                  {isCompleted ? (
                    <Check className="size-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>

                {/* Step label */}
                <div
                  className={cn(
                    isHorizontal
                      ? "mt-2 text-center"
                      : "flex flex-col justify-center"
                  )}
                >
                  <span
                    className={cn(
                      "font-medium text-sm",
                      isActive && "text-foreground",
                      isCompleted && "text-foreground",
                      !(isActive || isCompleted) && "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                  {step.description && !isHorizontal && (
                    <span className="text-muted-foreground text-xs">
                      {step.description}
                    </span>
                  )}
                </div>

                {/* Connector line (horizontal) */}
                {isHorizontal && index !== steps.length - 1 && (
                  <div
                    aria-hidden="true"
                    className={cn(
                      "-translate-y-1/2 absolute top-5 left-[calc(50%+20px)] h-0.5 w-[calc(100%-40px)]",
                      isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                  />
                )}
              </div>

              {/* Connector line (vertical) */}
              {!isHorizontal && index !== steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className={cn(
                    "-translate-x-1/2 absolute top-12 left-5 h-8 w-0.5",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

type WizardProgressBarProps = {
  progress: number;
  currentStep: number;
  totalSteps: number;
  className?: string;
};

export function WizardProgressBar({
  progress,
  currentStep,
  totalSteps,
  className,
}: WizardProgressBarProps) {
  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex justify-between text-muted-foreground text-sm">
        <span>
          Step {currentStep + 1} of {totalSteps}
        </span>
        <span>{Math.round(progress)}% complete</span>
      </div>
      <div
        aria-label={`Progress: ${Math.round(progress)}%`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={Math.round(progress)}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
      >
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
