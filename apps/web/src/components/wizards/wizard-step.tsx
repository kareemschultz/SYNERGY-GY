import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type WizardStepProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function WizardStep({
  title,
  description,
  children,
  className,
  contentClassName,
}: WizardStepProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {/* Step header */}
      <div className="mb-6">
        <h2 className="font-semibold text-xl">{title}</h2>
        {description && (
          <p className="mt-1 text-muted-foreground text-sm">{description}</p>
        )}
      </div>

      {/* Step content */}
      <div className={cn("flex-1", contentClassName)}>{children}</div>
    </div>
  );
}

type WizardStepSectionProps = {
  title?: ReactNode;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function WizardStepSection({
  title,
  description,
  children,
  className,
}: WizardStepSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div>
          {title && <h3 className="font-medium text-base">{title}</h3>}
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

type WizardStepFieldsProps = {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
};

export function WizardStepFields({
  children,
  columns = 1,
  className,
}: WizardStepFieldsProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  );
}

type WizardStepActionsProps = {
  children: ReactNode;
  className?: string;
};

export function WizardStepActions({
  children,
  className,
}: WizardStepActionsProps) {
  return (
    <div className={cn("mt-6 flex items-center gap-3", className)}>
      {children}
    </div>
  );
}
