import { useQuery } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { client } from "@/utils/orpc";
import { WizardStep, WizardStepSection } from "../wizard-step";
import { ServiceCategoryAccordion } from "./service-category-accordion";
import { ServiceCheckboxItem } from "./service-checkbox-item";
import { ServiceDetailsModal } from "./service-details-modal";
import {
  BUSINESSES,
  type Business,
  type ClientOnboardingData,
  type ServiceCatalogItem,
} from "./types";

type StepServicesProps = {
  data: ClientOnboardingData;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<ClientOnboardingData>) => void;
};

export function StepServicesEnhanced({
  data,
  errors,
  onUpdate,
}: StepServicesProps) {
  const [selectedServiceForDetails, setSelectedServiceForDetails] =
    useState<ServiceCatalogItem | null>(null);

  // Fetch GCMC services
  const { data: gcmcData, isLoading: gcmcLoading } = useQuery({
    queryKey: ["serviceCatalog", "wizard", "GCMC"],
    queryFn: () =>
      client.serviceCatalog.services.getForWizard({ business: "GCMC" }),
    enabled: data.businesses.includes("GCMC"),
  });

  // Fetch KAJ services
  const { data: kajData, isLoading: kajLoading } = useQuery({
    queryKey: ["serviceCatalog", "wizard", "KAJ"],
    queryFn: () =>
      client.serviceCatalog.services.getForWizard({ business: "KAJ" }),
    enabled: data.businesses.includes("KAJ"),
  });

  const toggleBusiness = (business: Business) => {
    const current = data.businesses;
    const updated = current.includes(business)
      ? current.filter((b) => b !== business)
      : [...current, business];

    // Clear services for deselected businesses
    const updates: Partial<ClientOnboardingData> = { businesses: updated };
    if (!updated.includes("GCMC") && gcmcData) {
      // Remove GCMC service IDs from selectedServiceIds
      const gcmcServiceIds = new Set(
        Object.values(gcmcData).flatMap((cat: any) =>
          cat.services.map((s: any) => s.id)
        )
      );
      updates.selectedServiceIds = data.selectedServiceIds.filter(
        (id) => !gcmcServiceIds.has(id)
      );
      updates.gcmcServices = [];
    }
    if (!updated.includes("KAJ") && kajData) {
      // Remove KAJ service IDs from selectedServiceIds
      const kajServiceIds = new Set(
        Object.values(kajData).flatMap((cat: any) =>
          cat.services.map((s: any) => s.id)
        )
      );
      updates.selectedServiceIds = data.selectedServiceIds.filter(
        (id) => !kajServiceIds.has(id)
      );
      updates.kajServices = [];
    }

    onUpdate(updates);
  };

  const toggleService = (serviceId: string) => {
    const current = data.selectedServiceIds;
    const updated = current.includes(serviceId)
      ? current.filter((id) => id !== serviceId)
      : [...current, serviceId];

    onUpdate({ selectedServiceIds: updated });
  };

  return (
    <WizardStep
      description="Select which businesses will serve this client and the specific services they need"
      title="Business Assignment & Services"
    >
      {/* Business Selection */}
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
                  isSelected
                    ? business.value === "GCMC"
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                      : "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : "border-border hover:border-primary/50"
                )}
                key={business.value}
                onClick={() => toggleBusiness(business.value)}
                type="button"
              >
                <div
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border-2",
                    isSelected
                      ? business.value === "GCMC"
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-blue-500 bg-blue-500 text-white"
                      : "border-muted-foreground/30"
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

      {/* GCMC Services */}
      {data.businesses.includes("GCMC") ? (
        <WizardStepSection
          className="mt-6"
          description="Select the specific GCMC services the client needs"
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
          {gcmcLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : gcmcData && Object.keys(gcmcData).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(gcmcData).map(
                ([categoryKey, category]: [string, any]) => (
                  <ServiceCategoryAccordion
                    categoryDescription={category.categoryDescription}
                    categoryDisplayName={category.categoryDisplayName}
                    categoryName={category.categoryName}
                    key={categoryKey}
                    onServiceDetails={setSelectedServiceForDetails}
                    onServiceToggle={toggleService}
                    renderServiceItem={(service, isSelected) => (
                      <ServiceCheckboxItem
                        isSelected={isSelected}
                        key={service.id}
                        onShowDetails={() =>
                          setSelectedServiceForDetails(service)
                        }
                        onToggle={() => toggleService(service.id)}
                        service={service}
                      />
                    )}
                    selectedServiceIds={data.selectedServiceIds}
                    services={category.services}
                  />
                )
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No services available. Please contact support.
            </p>
          )}
        </WizardStepSection>
      ) : null}

      {/* KAJ Services */}
      {data.businesses.includes("KAJ") ? (
        <WizardStepSection
          className="mt-6"
          description="Select the specific KAJ services the client needs"
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
          {kajLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : kajData && Object.keys(kajData).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(kajData).map(
                ([categoryKey, category]: [string, any]) => (
                  <ServiceCategoryAccordion
                    categoryDescription={category.categoryDescription}
                    categoryDisplayName={category.categoryDisplayName}
                    categoryName={category.categoryName}
                    key={categoryKey}
                    onServiceDetails={setSelectedServiceForDetails}
                    onServiceToggle={toggleService}
                    renderServiceItem={(service, isSelected) => (
                      <ServiceCheckboxItem
                        isSelected={isSelected}
                        key={service.id}
                        onShowDetails={() =>
                          setSelectedServiceForDetails(service)
                        }
                        onToggle={() => toggleService(service.id)}
                        service={service}
                      />
                    )}
                    selectedServiceIds={data.selectedServiceIds}
                    services={category.services}
                  />
                )
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No services available. Please contact support.
            </p>
          )}
        </WizardStepSection>
      ) : null}

      {errors.services ? (
        <p className="mt-2 text-destructive text-sm">{errors.services}</p>
      ) : null}

      {/* Service Details Modal */}
      <ServiceDetailsModal
        isOpen={selectedServiceForDetails !== null}
        onClose={() => setSelectedServiceForDetails(null)}
        service={selectedServiceForDetails}
      />
    </WizardStep>
  );
}
