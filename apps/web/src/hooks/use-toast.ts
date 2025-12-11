/**
 * Toast Hook
 *
 * Provides a wrapper around sonner's toast functionality with a compatible API
 * for components that expect a shadcn-style useToast hook.
 */

import { type ExternalToast, toast as sonnerToast } from "sonner";

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: {
    label: string;
    onClick: () => void;
  };
}

type ToastFunction = (options: ToastOptions) => void;

interface UseToastReturn {
  toast: ToastFunction;
}

/**
 * Hook that provides toast notification functionality
 * Compatible with shadcn/ui toast API but uses sonner under the hood
 */
export function useToast(): UseToastReturn {
  const toast: ToastFunction = (options) => {
    const { title, description, variant, action } = options;

    // Combine title and description into message
    const message = title || "";
    const descriptionText = description || "";

    const sonnerOptions: ExternalToast = {
      description: descriptionText,
      action: action
        ? {
            label: action.label,
            onClick: action.onClick,
          }
        : undefined,
    };

    // Use appropriate sonner method based on variant
    if (variant === "destructive") {
      sonnerToast.error(message, sonnerOptions);
    } else {
      sonnerToast(message, sonnerOptions);
    }
  };

  return { toast };
}
