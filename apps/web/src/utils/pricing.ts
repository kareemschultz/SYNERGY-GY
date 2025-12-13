/**
 * Pricing Utility Functions
 *
 * Helpers for formatting and displaying service pricing in the wizard.
 */

import type {
  PricingTier,
  ServiceCatalogItem,
} from "@/components/wizards/client-onboarding/types";

/**
 * Format a number as GYD currency
 * @example formatCurrency(50000) => "GYD 50,000"
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  options?: { compact?: boolean }
): string {
  if (amount === null || amount === undefined) {
    return "Contact for pricing";
  }

  const numericAmount =
    typeof amount === "string" ? Number.parseFloat(amount) : amount;

  if (Number.isNaN(numericAmount)) {
    return "Contact for pricing";
  }

  if (options?.compact) {
    // Compact format: GYD 50k
    if (numericAmount >= 1000) {
      return `GYD ${(numericAmount / 1000).toFixed(0)}k`;
    }
    return `GYD ${numericAmount.toLocaleString()}`;
  }

  // Full format: GYD 50,000
  return `GYD ${numericAmount.toLocaleString()}`;
}

/**
 * Format a pricing tier for display
 * @example formatPricingTier({ name: "3 Days", price: 35000 }) => "3 Days: GYD 35,000"
 */
export function formatPricingTier(tier: PricingTier): string {
  const parts: string[] = [tier.name];

  if (tier.price !== undefined) {
    parts.push(formatCurrency(tier.price));
  } else if (tier.minPrice !== undefined && tier.maxPrice !== undefined) {
    parts.push(
      `${formatCurrency(tier.minPrice)} - ${formatCurrency(tier.maxPrice)}`
    );
  } else if (tier.minPrice !== undefined) {
    parts.push(`From ${formatCurrency(tier.minPrice)}`);
  }

  return parts.join(": ");
}

/**
 * Format all pricing tiers for inline display (checkbox view)
 * User requirement: Show ALL tiers in checkbox view
 * @example formatAllTiers(tiers) => "2-day: GYD 35k | 5-day: GYD 50k"
 */
export function formatAllTiers(
  tiers: PricingTier[],
  options?: { compact?: boolean; separator?: string }
): string {
  const separator = options?.separator || " | ";

  return tiers
    .map((tier) => {
      if (tier.price !== undefined) {
        return `${tier.name}: ${formatCurrency(tier.price, { compact: options?.compact })}`;
      }
      if (tier.minPrice !== undefined && tier.maxPrice !== undefined) {
        return `${tier.name}: ${formatCurrency(tier.minPrice, { compact: options?.compact })} - ${formatCurrency(tier.maxPrice, { compact: options?.compact })}`;
      }
      if (tier.minPrice !== undefined) {
        return `${tier.name}: From ${formatCurrency(tier.minPrice, { compact: options?.compact })}`;
      }
      return tier.name;
    })
    .join(separator);
}

/**
 * Get price display text for a service (for checkbox view)
 * Handles all pricing types: FIXED, RANGE, TIERED, CUSTOM
 */
export function getServicePriceDisplay(
  service: ServiceCatalogItem,
  options?: { compact?: boolean }
): string {
  const { pricingType, basePrice, maxPrice, pricingTiers } = service;

  switch (pricingType) {
    case "FIXED":
      return formatCurrency(basePrice, options);

    case "RANGE":
      if (basePrice && maxPrice) {
        return `${formatCurrency(basePrice, options)} - ${formatCurrency(maxPrice, options)}`;
      }
      if (basePrice) {
        return `From ${formatCurrency(basePrice, options)}`;
      }
      return "Contact for pricing";

    case "TIERED":
      if (pricingTiers && pricingTiers.length > 0) {
        // User wants ALL tiers in checkbox view
        return formatAllTiers(pricingTiers, { compact: options?.compact });
      }
      return formatCurrency(basePrice, options);

    case "CUSTOM":
      return "Custom pricing - contact for quote";

    default:
      return "Contact for pricing";
  }
}

/**
 * Get minimum price for a service (for sorting/filtering)
 */
export function getMinPrice(service: ServiceCatalogItem): number {
  const { pricingType, basePrice, pricingTiers } = service;

  switch (pricingType) {
    case "FIXED":
    case "RANGE":
      if (basePrice) {
        const price =
          typeof basePrice === "string"
            ? Number.parseFloat(basePrice)
            : basePrice;
        return Number.isNaN(price) ? 0 : price;
      }
      return 0;

    case "TIERED":
      if (pricingTiers && pricingTiers.length > 0) {
        const prices = pricingTiers
          .map((t) => t.price ?? t.minPrice ?? 0)
          .filter((p) => p > 0);
        return prices.length > 0 ? Math.min(...prices) : 0;
      }
      return 0;

    default:
      return 0;
  }
}

/**
 * Get maximum price for a service (for range display)
 */
export function getMaxPrice(service: ServiceCatalogItem): number | null {
  const { pricingType, maxPrice, pricingTiers } = service;

  switch (pricingType) {
    case "RANGE":
      if (maxPrice) {
        const price =
          typeof maxPrice === "string" ? Number.parseFloat(maxPrice) : maxPrice;
        return Number.isNaN(price) ? null : price;
      }
      return null;

    case "TIERED":
      if (pricingTiers && pricingTiers.length > 0) {
        const prices = pricingTiers
          .map((t) => t.price ?? t.maxPrice ?? 0)
          .filter((p) => p > 0);
        return prices.length > 0 ? Math.max(...prices) : null;
      }
      return null;

    default:
      return null;
  }
}

/**
 * Calculate total estimated price for selected services
 */
export function calculateTotalPrice(services: ServiceCatalogItem[]): {
  min: number;
  max: number | null;
  display: string;
} {
  let totalMin = 0;
  let totalMax: number | null = 0;
  let hasCustomPricing = false;

  for (const service of services) {
    const minPrice = getMinPrice(service);
    const maxPrice = getMaxPrice(service);

    totalMin += minPrice;

    if (service.pricingType === "CUSTOM") {
      hasCustomPricing = true;
      totalMax = null;
    } else if (totalMax !== null) {
      totalMax += maxPrice ?? minPrice;
    }
  }

  // Generate display string
  let display: string;
  if (hasCustomPricing) {
    display = `From ${formatCurrency(totalMin)} (includes custom pricing)`;
  } else if (totalMax !== null && totalMax > totalMin) {
    display = `${formatCurrency(totalMin)} - ${formatCurrency(totalMax)}`;
  } else {
    display = formatCurrency(totalMin);
  }

  return {
    min: totalMin,
    max: totalMax,
    display,
  };
}

/**
 * Format duration for display
 */
export function formatDuration(
  estimatedDays?: number | null,
  typicalDuration?: string | null
): string {
  if (typicalDuration) {
    return typicalDuration;
  }

  if (estimatedDays) {
    const days = estimatedDays === 1 ? "day" : "days";
    return `${estimatedDays} business ${days}`;
  }

  return "Duration varies";
}
