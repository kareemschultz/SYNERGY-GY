import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getMaxPrice, getMinPrice } from "@/utils/pricing";
import type { ServiceCatalogItem } from "./types";

type ServiceCategoryAccordionProps = {
  categoryName: string;
  categoryDisplayName: string;
  categoryDescription: string;
  services: ServiceCatalogItem[];
  selectedServiceIds: string[];
  onServiceToggle: (serviceId: string) => void;
  onServiceDetails?: (service: ServiceCatalogItem) => void;
  renderServiceItem: (
    service: ServiceCatalogItem,
    isSelected: boolean
  ) => React.ReactNode;
};

export function ServiceCategoryAccordion({
  categoryName: _categoryName,
  categoryDisplayName,
  categoryDescription,
  services,
  selectedServiceIds,
  onServiceToggle: _onServiceToggle,
  onServiceDetails: _onServiceDetails,
  renderServiceItem,
}: ServiceCategoryAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const selectedCount = services.filter((s) =>
    selectedServiceIds.includes(s.id)
  ).length;

  // Calculate price range for category
  const prices = services.map((s) => getMinPrice(s)).filter((p) => p > 0);
  const maxPrices = services
    .map((s) => getMaxPrice(s))
    .filter((p) => p !== null && p > 0);

  const minCategoryPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxCategoryPrice =
    maxPrices.length > 0
      ? Math.max(...(maxPrices as number[]))
      : minCategoryPrice;

  const getPriceDisplay = (): string => {
    if (
      minCategoryPrice &&
      maxCategoryPrice &&
      maxCategoryPrice > minCategoryPrice
    ) {
      return `${formatCurrency(minCategoryPrice, { compact: true })} - ${formatCurrency(maxCategoryPrice, { compact: true })}`;
    }
    if (minCategoryPrice) {
      return `From ${formatCurrency(minCategoryPrice, { compact: true })}`;
    }
    return "Contact for pricing";
  };

  const priceDisplay = getPriceDisplay();

  return (
    <div className="rounded-lg border">
      {/* Category Header - Clickable to expand/collapse */}
      <button
        className="w-full px-4 py-3 text-left transition-colors hover:bg-accent/50"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="size-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-5 text-muted-foreground" />
            )}
            <div>
              <h3 className="font-semibold">{categoryDisplayName}</h3>
              <p className="text-muted-foreground text-sm">
                {categoryDescription}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-muted-foreground text-sm">
                {services.length}{" "}
                {services.length === 1 ? "service" : "services"}
              </div>
              <div className="font-medium text-sm">{priceDisplay}</div>
            </div>
            {selectedCount > 0 ? (
              <Badge variant="default">{selectedCount} selected</Badge>
            ) : null}
          </div>
        </div>
      </button>

      {/* Services List - Shows when expanded */}
      {isExpanded ? (
        <div className="border-t">
          <div className="space-y-0 divide-y">
            {services.map((service) => (
              <div key={service.id}>
                {renderServiceItem(
                  service,
                  selectedServiceIds.includes(service.id)
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
