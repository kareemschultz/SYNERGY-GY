import { Briefcase, Building2, Globe, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { WizardStep } from "../wizard-step";
import {
  CLIENT_TYPES,
  type ClientOnboardingData,
  type ClientType,
} from "./types";

type StepClientTypeProps = {
  data: ClientOnboardingData;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<ClientOnboardingData>) => void;
};

const TYPE_ICONS: Record<
  ClientType,
  React.ComponentType<{ className?: string }>
> = {
  INDIVIDUAL: User,
  SMALL_BUSINESS: Briefcase,
  CORPORATION: Building2,
  NGO: Users,
  COOP: Users,
  CREDIT_UNION: Building2,
  FOREIGN_NATIONAL: Globe,
  INVESTOR: Briefcase,
};

export function StepClientType({
  data,
  errors,
  onUpdate,
}: StepClientTypeProps) {
  return (
    <WizardStep
      description="Select the type of client you are onboarding. This determines what information will be collected."
      title="What type of client is this?"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {CLIENT_TYPES.map((type) => {
          const Icon = TYPE_ICONS[type.value];
          const isSelected = data.clientType === type.value;

          return (
            <button
              aria-pressed={isSelected}
              className={cn(
                "flex items-start gap-4 rounded-lg border p-4 text-left transition-all hover:border-primary/50",
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-card"
              )}
              key={type.value}
              onClick={() => onUpdate({ clientType: type.value })}
              type="button"
            >
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="size-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{type.label}</div>
                <div className="mt-0.5 text-muted-foreground text-sm">
                  {type.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {errors.clientType ? (
        <p className="mt-4 text-destructive text-sm">{errors.clientType}</p>
      ) : null}
    </WizardStep>
  );
}
