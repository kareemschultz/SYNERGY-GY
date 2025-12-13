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

type ServiceDetailsModalProps = {
  service: ServiceCatalogItem | null;
  isOpen: boolean;
  onClose: () => void;
};

export function ServiceDetailsModal({
  service,
  isOpen,
  onClose,
}: ServiceDetailsModalProps) {
  if (!service) return null;

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
          {service.longDescription || service.shortDescription ? (
            <div>
              <h3 className="mb-2 font-semibold text-sm">Description</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {service.longDescription || service.shortDescription}
              </p>
            </div>
          ) : null}

          <Separator />

          {/* Pricing Details */}
          <div>
            <h3 className="mb-3 font-semibold text-sm">Pricing</h3>
            {service.pricingType === "FIXED" ? (
              <div className="rounded-lg border bg-accent/20 p-4">
                <div className="font-medium text-lg">
                  {formatCurrency(service.basePrice)}
                </div>
                <div className="text-muted-foreground text-sm">Fixed price</div>
              </div>
            ) : service.pricingType === "RANGE" ? (
              <div className="rounded-lg border bg-accent/20 p-4">
                <div className="font-medium text-lg">
                  {formatCurrency(service.basePrice)} -{" "}
                  {formatCurrency(service.maxPrice)}
                </div>
                <div className="text-muted-foreground text-sm">
                  Price range (depends on complexity)
                </div>
              </div>
            ) : service.pricingType === "TIERED" &&
              service.pricingTiers &&
              service.pricingTiers.length > 0 ? (
              <div className="space-y-2">
                {service.pricingTiers.map((tier, index) => (
                  <div
                    className="flex items-center justify-between rounded-lg border p-3"
                    key={index}
                  >
                    <div>
                      <div className="font-medium">{tier.name}</div>
                      {tier.description ? (
                        <div className="text-muted-foreground text-sm">
                          {tier.description}
                        </div>
                      ) : null}
                    </div>
                    <div className="font-semibold text-primary">
                      {tier.price
                        ? formatCurrency(tier.price)
                        : tier.minPrice && tier.maxPrice
                          ? `${formatCurrency(tier.minPrice)} - ${formatCurrency(tier.maxPrice)}`
                          : tier.minPrice
                            ? `From ${formatCurrency(tier.minPrice)}`
                            : "Contact"}
                    </div>
                  </div>
                ))}
              </div>
            ) : service.pricingType === "CUSTOM" ? (
              <div className="rounded-lg border bg-accent/20 p-4">
                <div className="font-medium">Custom Pricing</div>
                <div className="text-muted-foreground text-sm">
                  Contact us for a personalized quote based on your specific
                  requirements.
                </div>
              </div>
            ) : null}
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
                  {service.documentRequirements?.map((doc, index) => (
                    <li className="flex items-start gap-2 text-sm" key={index}>
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
                  {service.governmentAgencies?.map((agency, index) => (
                    <li className="flex items-start gap-2 text-sm" key={index}>
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
