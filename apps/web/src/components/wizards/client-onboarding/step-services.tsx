import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { WizardStep, WizardStepSection } from "../wizard-step";
import {
  BUSINESSES,
  type Business,
  type ClientOnboardingData,
  GCMC_SERVICES,
  type GCMCService,
  KAJ_SERVICES,
  type KAJService,
} from "./types";

type StepServicesProps = {
  data: ClientOnboardingData;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<ClientOnboardingData>) => void;
};

/**
 * Helper function to get button className based on selection state and business type.
 * Extracted to avoid nested ternary.
 */
function getBusinessButtonClassName(
  isSelected: boolean,
  businessValue: "GCMC" | "KAJ"
): string {
  if (!isSelected) {
    return "border-border hover:border-primary/50";
  }
  if (businessValue === "GCMC") {
    return "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30";
  }
  return "border-blue-500 bg-blue-50 dark:bg-blue-950/30";
}

/**
 * Helper function to get checkbox indicator className based on selection state and business type.
 * Extracted to avoid nested ternary.
 */
function getBusinessCheckboxClassName(
  isSelected: boolean,
  businessValue: "GCMC" | "KAJ"
): string {
  if (!isSelected) {
    return "border-muted-foreground/30";
  }
  if (businessValue === "GCMC") {
    return "border-emerald-500 bg-emerald-500 text-white";
  }
  return "border-blue-500 bg-blue-500 text-white";
}

export function StepServices({ data, errors, onUpdate }: StepServicesProps) {
  const toggleBusiness = (business: Business) => {
    const current = data.businesses;
    const updated = current.includes(business)
      ? current.filter((b) => b !== business)
      : [...current, business];

    // Clear services for deselected businesses
    const updates: Partial<ClientOnboardingData> = { businesses: updated };
    if (!updated.includes("GCMC")) {
      updates.gcmcServices = [];
    }
    if (!updated.includes("KAJ")) {
      updates.kajServices = [];
    }

    onUpdate(updates);
  };

  const toggleGCMCService = (service: GCMCService) => {
    const current = data.gcmcServices;
    const updated = current.includes(service)
      ? current.filter((s) => s !== service)
      : [...current, service];
    onUpdate({ gcmcServices: updated });
  };

  const toggleKAJService = (service: KAJService) => {
    const current = data.kajServices;
    const updated = current.includes(service)
      ? current.filter((s) => s !== service)
      : [...current, service];
    onUpdate({ kajServices: updated });
  };

  return (
    <WizardStep
      description="Select which businesses will serve this client and what services they need"
      title="Business Assignment & Services"
    >
      <WizardStepSection
        description="Select at least one business"
        title="Assign to Business"
      >
        <div className="flex flex-wrap gap-3">
          {BUSINESSES.map((business) => {
            const isSelected = data.businesses.includes(business.value);

            return (
              <button
                aria-pressed={isSelected}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-4 py-3 transition-all",
                  getBusinessButtonClassName(isSelected, business.value)
                )}
                key={business.value}
                onClick={() => toggleBusiness(business.value)}
                type="button"
              >
                <div
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border-2",
                    getBusinessCheckboxClassName(isSelected, business.value)
                  )}
                >
                  {isSelected ? <Check className="size-4" /> : null}
                </div>
                <div className="text-left">
                  <div className="font-medium">{business.label}</div>
                  <div className="text-muted-foreground text-xs">
                    {business.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {errors.businesses ? (
          <p className="mt-2 text-destructive text-sm">{errors.businesses}</p>
        ) : null}
      </WizardStepSection>

      {data.businesses.includes("GCMC") ? (
        <WizardStepSection
          className="mt-6"
          description="Select the GCMC services the client is interested in (optional)"
          title={
            <span className="flex items-center gap-2">
              GCMC Services
              <Badge
                className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                variant="secondary"
              >
                GCMC
              </Badge>
            </span>
          }
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {GCMC_SERVICES.map((service) => (
              <div
                className="flex items-start space-x-3 rounded-lg border p-3"
                key={service.value}
              >
                <Checkbox
                  checked={data.gcmcServices.includes(service.value)}
                  id={`gcmc-${service.value}`}
                  onCheckedChange={() => toggleGCMCService(service.value)}
                />
                <div className="grid gap-0.5 leading-none">
                  <Label
                    className="cursor-pointer font-medium"
                    htmlFor={`gcmc-${service.value}`}
                  >
                    {service.label}
                  </Label>
                  <span className="text-muted-foreground text-xs">
                    {service.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </WizardStepSection>
      ) : null}

      {data.businesses.includes("KAJ") ? (
        <WizardStepSection
          className="mt-6"
          description="Select the KAJ services the client is interested in (optional)"
          title={
            <span className="flex items-center gap-2">
              KAJ Services
              <Badge
                className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                variant="secondary"
              >
                KAJ
              </Badge>
            </span>
          }
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {KAJ_SERVICES.map((service) => (
              <div
                className="flex items-start space-x-3 rounded-lg border p-3"
                key={service.value}
              >
                <Checkbox
                  checked={data.kajServices.includes(service.value)}
                  id={`kaj-${service.value}`}
                  onCheckedChange={() => toggleKAJService(service.value)}
                />
                <div className="grid gap-0.5 leading-none">
                  <Label
                    className="cursor-pointer font-medium"
                    htmlFor={`kaj-${service.value}`}
                  >
                    {service.label}
                  </Label>
                  <span className="text-muted-foreground text-xs">
                    {service.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </WizardStepSection>
      ) : null}
    </WizardStep>
  );
}
