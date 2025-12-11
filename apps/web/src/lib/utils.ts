import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param currency - Currency code (default: "GYD")
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency = "GYD"): string {
  const formatter = new Intl.NumberFormat("en-GY", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const formattedAmount = formatter.format(amount);

  // GYD uses $ prefix
  if (currency === "GYD") {
    return `$${formattedAmount}`;
  }

  // For other currencies, show currency code
  return `${currency} ${formattedAmount}`;
}
