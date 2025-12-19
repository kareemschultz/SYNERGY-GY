import { useQuery } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  GCMC_SERVICES,
  type GCMCService,
  KAJ_SERVICES,
  type KAJService,
  type ServiceCatalogCategory,
  type ServiceCatalogItem,
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

  // Check if catalog data is available
  const hasGcmcCatalog = gcmcData && Object.keys(gcmcData).length > 0;
  const hasKajCatalog = kajData && Object.keys(kajData).length > 0;

  const toggleBusiness = (business: Business) => {
    const current = data.businesses;
    const updated = current.includes(business)
      ? current.filter((b) => b !== business)
      : [...current, business];

    // Clear services for deselected businesses
    const updates: Partial<ClientOnboardingData> = { businesses: updated };
    if (!updated.includes("GCMC")) {
      if (gcmcData) {
        // Remove GCMC service IDs from selectedServiceIds
        const gcmcServiceIds = new Set(
          Object.values(gcmcData).flatMap((cat: ServiceCatalogCategory) =>
            cat.services.map((s: ServiceCatalogItem) => s.id)
          )
        );
        updates.selectedServiceIds = data.selectedServiceIds.filter(
          (id) => !gcmcServiceIds.has(id)
        );
      }
      updates.gcmcServices = [];
    }
    if (!updated.includes("KAJ")) {
      if (kajData) {
        // Remove KAJ service IDs from selectedServiceIds
        const kajServiceIds = new Set(
          Object.values(kajData).flatMap((cat: ServiceCatalogCategory) =>
            cat.services.map((s: ServiceCatalogItem) => s.id)
          )
        );
        updates.selectedServiceIds = data.selectedServiceIds.filter(
          (id) => !kajServiceIds.has(id)
        );
      }
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

  // Fallback toggle functions for static services
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

  // Render GCMC services content based on loading/data state
  const renderGcmcServices = () => {
    if (gcmcLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (hasGcmcCatalog) {
      return (
        <div className="space-y-3">
          {Object.entries(gcmcData).map(
            ([categoryKey, category]: [string, ServiceCatalogCategory]) => (
              <ServiceCategoryAccordion
                categoryDescription={category.categoryDescription ?? ""}
                categoryDisplayName={category.categoryDisplayName}
                categoryName={category.categoryName}
                key={categoryKey}
                onServiceDetails={setSelectedServiceForDetails}
                onServiceToggle={toggleService}
                renderServiceItem={(service, isSelected) => (
                  <ServiceCheckboxItem
                    isSelected={isSelected}
                    key={service.id}
                    onShowDetails={() => setSelectedServiceForDetails(service)}
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
      );
    }

    // Fallback to static services when catalog is empty
    return (
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
    );
  };

  // Render KAJ services content based on loading/data state
  const renderKajServices = () => {
    if (kajLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (hasKajCatalog) {
      return (
        <div className="space-y-3">
          {Object.entries(kajData).map(
            ([categoryKey, category]: [string, ServiceCatalogCategory]) => (
              <ServiceCategoryAccordion
                categoryDescription={category.categoryDescription ?? ""}
                categoryDisplayName={category.categoryDisplayName}
                categoryName={category.categoryName}
                key={categoryKey}
                onServiceDetails={setSelectedServiceForDetails}
                onServiceToggle={toggleService}
                renderServiceItem={(service, isSelected) => (
                  <ServiceCheckboxItem
                    isSelected={isSelected}
                    key={service.id}
                    onShowDetails={() => setSelectedServiceForDetails(service)}
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
      );
    }

    // Fallback to static services when catalog is empty
    return (
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
    );
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

      {/* GCMC Services */}
      {data.businesses.includes("GCMC") ? (
        <WizardStepSection
          className="mt-6"
          description="Select the GCMC services the client is interested in"
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
          {renderGcmcServices()}
        </WizardStepSection>
      ) : null}

      {/* KAJ Services */}
      {data.businesses.includes("KAJ") ? (
        <WizardStepSection
          className="mt-6"
          description="Select the KAJ services the client is interested in"
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
          {renderKajServices()}
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
