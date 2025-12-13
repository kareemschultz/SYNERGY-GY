import { Clock, FileText, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatDuration, getServicePriceDisplay } from "@/utils/pricing";
import type { ServiceCatalogItem } from "./types";

type ServiceCheckboxItemProps = {
  service: ServiceCatalogItem;
  isSelected: boolean;
  onToggle: () => void;
  onShowDetails?: () => void;
};

export function ServiceCheckboxItem({
  service,
  isSelected,
  onToggle,
  onShowDetails,
}: ServiceCheckboxItemProps) {
  const priceDisplay = getServicePriceDisplay(service, { compact: false });
  const durationDisplay = formatDuration(
    service.estimatedDays,
    service.typicalDuration
  );
  const documentCount = service.documentRequirements?.length || 0;

  return (
    <div className="flex items-start gap-3 p-4 transition-colors hover:bg-accent/30">
      <Checkbox
        checked={isSelected}
        className="mt-1"
        id={`service-${service.id}`}
        onCheckedChange={onToggle}
      />
      <div className="flex-1">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Label
              className="cursor-pointer font-medium leading-tight"
              htmlFor={`service-${service.id}`}
            >
              {service.displayName}
            </Label>
            {service.shortDescription ? (
              <p className="mt-1 text-muted-foreground text-sm leading-snug">
                {service.shortDescription}
              </p>
            ) : null}

            {/* Service Metadata */}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
              {/* Pricing - All tiers displayed inline per user requirement */}
              <div className="flex items-center gap-1 font-medium text-primary">
                <span>{priceDisplay}</span>
              </div>

              {/* Duration */}
              {service.estimatedDays || service.typicalDuration ? (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="size-3" />
                  <span>{durationDisplay}</span>
                </div>
              ) : null}

              {/* Document Count */}
              {documentCount > 0 ? (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <FileText className="size-3" />
                  <span>
                    {documentCount} {documentCount === 1 ? "doc" : "docs"}{" "}
                    required
                  </span>
                </div>
              ) : null}

              {/* Featured Badge */}
              {service.isFeatured ? (
                <Badge className="h-5" variant="secondary">
                  Popular
                </Badge>
              ) : null}
            </div>
          </div>

          {/* Details Button */}
          {onShowDetails ? (
            <button
              className="text-muted-foreground transition-colors hover:text-foreground"
              onClick={(e) => {
                e.preventDefault();
                onShowDetails();
              }}
              title="View service details"
              type="button"
            >
              <Info className="size-5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
