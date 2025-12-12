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

export async function uploadFile(
  documentId: string,
  file: File
): Promise<{ success: boolean; document: any }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`/api/upload/${documentId}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload file");
  }

  return response.json();
}
