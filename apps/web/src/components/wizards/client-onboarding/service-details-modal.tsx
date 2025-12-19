import { Building2, Clock, FileText, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDuration } from "@/utils/pricing";
import type { ServiceCatalogItem } from "./types";

/**
 * Helper component to display pricing information based on pricing type.
 * Extracted to avoid nested ternary in the main component.
 */
function PricingDisplay({ service }: { service: ServiceCatalogItem }) {
  if (service.pricingType === "FIXED") {
    return (
      <div className="flex items-baseline gap-2">
        <span className="font-bold text-2xl">
          {formatCurrency(service.basePrice || 0)}
        </span>
        <span className="text-muted-foreground">one-time</span>
      </div>
    );
  }

  if (service.pricingType === "RANGE") {
    return (
      <div className="flex items-baseline gap-2">
        <span className="font-bold text-2xl">
          {formatCurrency(service.basePrice || 0)} -{" "}
          {formatCurrency(service.maxPrice || 0)}
        </span>
      </div>
    );
  }

  if (service.pricingType === "TIERED" && service.pricingTiers) {
    return (
      <div className="space-y-2">
        {service.pricingTiers.map((tier) => (
          <div
            className="flex items-baseline justify-between rounded bg-muted/30 p-2"
            key={tier.name}
          >
            <span className="text-sm">{tier.name}</span>
            <TierPriceDisplay tier={tier} />
          </div>
        ))}
      </div>
    );
  }

  if (service.pricingType === "CUSTOM") {
    return (
      <div className="rounded-md bg-muted/30 p-3">
        <p className="text-muted-foreground text-sm">
          {service.pricingNotes || "Contact us for a custom quote"}
        </p>
      </div>
    );
  }

  return null;
}

/**
 * Helper component to display tier price based on available price data.
 * Extracted to avoid nested ternary in PricingDisplay.
 */
function TierPriceDisplay({
  tier,
}: {
  tier: { price?: number; minPrice?: number; maxPrice?: number };
}) {
  if (tier.price !== undefined) {
    return <span className="font-semibold">{formatCurrency(tier.price)}</span>;
  }

  if (tier.minPrice !== undefined && tier.maxPrice !== undefined) {
    return (
      <span className="font-semibold">
        {formatCurrency(tier.minPrice)} - {formatCurrency(tier.maxPrice)}
      </span>
    );
  }

  return <span className="text-muted-foreground">Custom</span>;
}

type ServiceDetailsModalProps = {
  service: ServiceCatalogItem | null;
  isOpen: boolean;
  onClose: () => void;
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Modal displays comprehensive service details including pricing tiers, document requirements, government agencies, and timeline information
export function ServiceDetailsModal({
  service,
  isOpen,
  onClose,
}: ServiceDetailsModalProps) {
  if (!service) {
    return null;
  }

  const documentCount = service.documentRequirements?.length || 0;
  const agencyCount = service.governmentAgencies?.length || 0;

  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl">
                {service.displayName}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {service.categoryDisplayName || service.business} Service
              </DialogDescription>
            </div>
            <Badge
              className={
                service.business === "GCMC"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              }
              variant="secondary"
            >
              {service.business}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          {service.description || service.shortDescription ? (
            <div>
              <h3 className="mb-2 font-semibold text-sm">Description</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {service.description || service.shortDescription}
              </p>
            </div>
          ) : null}

          <Separator />

          {/* Pricing Details */}
          <div>
            <h3 className="mb-3 font-semibold text-sm">Pricing</h3>
            <PricingDisplay service={service} />
          </div>

          <Separator />

          {/* Service Details */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Duration */}
            {service.estimatedDays || service.typicalDuration ? (
              <div>
                <div className="mb-2 flex items-center gap-2 text-muted-foreground text-sm">
                  <Clock className="size-4" />
                  <span>Estimated Duration</span>
                </div>
                <div className="font-medium">
                  {formatDuration(
                    service.estimatedDays,
                    service.typicalDuration
                  )}
                </div>
              </div>
            ) : null}

            {/* Document Requirements */}
            {documentCount > 0 ? (
              <div>
                <div className="mb-2 flex items-center gap-2 text-muted-foreground text-sm">
                  <FileText className="size-4" />
                  <span>Required Documents</span>
                </div>
                <div className="font-medium">
                  {documentCount}{" "}
                  {documentCount === 1 ? "document" : "documents"}
                </div>
              </div>
            ) : null}

            {/* Government Agencies */}
            {agencyCount > 0 ? (
              <div>
                <div className="mb-2 flex items-center gap-2 text-muted-foreground text-sm">
                  <Building2 className="size-4" />
                  <span>Government Agencies</span>
                </div>
                <div className="font-medium">
                  {agencyCount} {agencyCount === 1 ? "agency" : "agencies"}
                </div>
              </div>
            ) : null}

            {/* Featured */}
            {service.isFeatured ? (
              <div>
                <div className="mb-2 flex items-center gap-2 text-muted-foreground text-sm">
                  <Info className="size-4" />
                  <span>Popularity</span>
                </div>
                <Badge variant="secondary">Popular Service</Badge>
              </div>
            ) : null}
          </div>

          {/* Required Documents List */}
          {documentCount > 0 ? (
            <>
              <Separator />
              <div>
                <h3 className="mb-3 font-semibold text-sm">
                  Required Documents ({documentCount})
                </h3>
                <ul className="space-y-2">
                  {service.documentRequirements?.map((doc) => (
                    <li className="flex items-start gap-2 text-sm" key={doc}>
                      <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}

          {/* Government Agencies List */}
          {agencyCount > 0 ? (
            <>
              <Separator />
              <div>
                <h3 className="mb-3 font-semibold text-sm">
                  Government Agencies Involved ({agencyCount})
                </h3>
                <ul className="space-y-2">
                  {service.governmentAgencies?.map((agency) => (
                    <li className="flex items-start gap-2 text-sm" key={agency}>
                      <Building2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <span>{agency}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
