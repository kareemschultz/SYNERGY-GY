import {
  Building2,
  FileCheck,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  type LucideIcon,
  Mail,
  MoreHorizontal,
  Plane,
  Receipt,
  User,
} from "lucide-react";

// Document category values matching database enum
export const DOCUMENT_CATEGORIES = [
  "IDENTITY",
  "TAX",
  "FINANCIAL",
  "LEGAL",
  "IMMIGRATION",
  "BUSINESS",
  "CORRESPONDENCE",
  "TRAINING",
  "OTHER",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

// Category styling configuration
export const categoryConfig: Record<
  string,
  {
    label: string;
    className: string;
    icon: LucideIcon;
    bgColor: string;
    textColor: string;
  }
> = {
  IDENTITY: {
    label: "Identity",
    className: "bg-purple-500/10 text-purple-600 border-purple-200",
    icon: User,
    bgColor: "bg-purple-500/10",
    textColor: "text-purple-600",
  },
  TAX: {
    label: "Tax",
    className: "bg-blue-500/10 text-blue-600 border-blue-200",
    icon: Receipt,
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-600",
  },
  FINANCIAL: {
    label: "Financial",
    className: "bg-green-500/10 text-green-600 border-green-200",
    icon: FileSpreadsheet,
    bgColor: "bg-green-500/10",
    textColor: "text-green-600",
  },
  LEGAL: {
    label: "Legal",
    className: "bg-amber-500/10 text-amber-600 border-amber-200",
    icon: FileCheck,
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-600",
  },
  IMMIGRATION: {
    label: "Immigration",
    className: "bg-cyan-500/10 text-cyan-600 border-cyan-200",
    icon: Plane,
    bgColor: "bg-cyan-500/10",
    textColor: "text-cyan-600",
  },
  BUSINESS: {
    label: "Business",
    className: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
    icon: Building2,
    bgColor: "bg-indigo-500/10",
    textColor: "text-indigo-600",
  },
  CORRESPONDENCE: {
    label: "Correspondence",
    className: "bg-pink-500/10 text-pink-600 border-pink-200",
    icon: Mail,
    bgColor: "bg-pink-500/10",
    textColor: "text-pink-600",
  },
  TRAINING: {
    label: "Training",
    className: "bg-orange-500/10 text-orange-600 border-orange-200",
    icon: GraduationCap,
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-600",
  },
  OTHER: {
    label: "Other",
    className: "bg-gray-500/10 text-gray-600 border-gray-200",
    icon: MoreHorizontal,
    bgColor: "bg-gray-500/10",
    textColor: "text-gray-600",
  },
};

// Helper function to get category config with fallback
export function getCategoryConfig(category: string) {
  return categoryConfig[category] || categoryConfig.OTHER;
}

// Helper function to get category label
export function getCategoryLabel(category: string): string {
  return getCategoryConfig(category).label;
}

// Helper function to get category icon
export function getCategoryIcon(category: string): LucideIcon {
  return getCategoryConfig(category).icon;
}

// Template category values matching database enum
export const TEMPLATE_CATEGORIES = [
  "LETTER",
  "AGREEMENT",
  "CERTIFICATE",
  "FORM",
  "REPORT",
  "INVOICE",
  "OTHER",
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

// Template category styling configuration
export const templateCategoryConfig: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  LETTER: {
    label: "Letter",
    className: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  AGREEMENT: {
    label: "Agreement",
    className: "bg-purple-500/10 text-purple-600 border-purple-200",
  },
  CERTIFICATE: {
    label: "Certificate",
    className: "bg-green-500/10 text-green-600 border-green-200",
  },
  FORM: {
    label: "Form",
    className: "bg-amber-500/10 text-amber-600 border-amber-200",
  },
  REPORT: {
    label: "Report",
    className: "bg-cyan-500/10 text-cyan-600 border-cyan-200",
  },
  INVOICE: {
    label: "Invoice",
    className: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
  },
  OTHER: {
    label: "Other",
    className: "bg-gray-500/10 text-gray-600 border-gray-200",
  },
};

// Helper function to get template category config with fallback
export function getTemplateCategoryConfig(category: string) {
  return templateCategoryConfig[category] || templateCategoryConfig.OTHER;
}

// Helper function to get template category label
export function getTemplateCategoryLabel(category: string): string {
  return getTemplateCategoryConfig(category).label;
}

// Business styling configuration
export const businessConfig: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  GCMC: {
    label: "GCMC",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  },
  KAJ: {
    label: "KAJ",
    className: "bg-orange-500/10 text-orange-600 border-orange-200",
  },
};

// File type icons based on MIME type or extension
export function getFileIcon(
  mimeType?: string | null,
  fileName?: string | null
): LucideIcon {
  const ext = fileName?.split(".").pop()?.toLowerCase();

  // Check by extension first
  if (ext) {
    if (["pdf"].includes(ext)) {
      return FileText;
    }
    if (["doc", "docx"].includes(ext)) {
      return FileText;
    }
    if (["xls", "xlsx", "csv"].includes(ext)) {
      return FileSpreadsheet;
    }
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
      return FileText;
    }
  }

  // Check by MIME type
  if (mimeType) {
    if (mimeType.includes("pdf")) {
      return FileText;
    }
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
      return FileSpreadsheet;
    }
    if (mimeType.includes("word") || mimeType.includes("document")) {
      return FileText;
    }
  }

  return FileText;
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}
