import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { RenderOptions } from "@testing-library/react";
import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

/**
 * Create a fresh QueryClient for testing
 * Disables retries and garbage collection for predictable tests
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Number.POSITIVE_INFINITY,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Test wrapper with all required providers
 */
function AllProviders({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

/**
 * Custom render function that wraps components with providers
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library
export * from "@testing-library/react";
export { userEvent } from "@testing-library/user-event";

// Override render with our custom version
export { customRender as render };

/**
 * Helper to wait for loading states to resolve
 */
export function waitForLoadingToFinish() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Mock API response helper
 */
export function createMockApiResponse<T>(data: T) {
  return {
    data,
    error: null,
    isLoading: false,
    isError: false,
    isSuccess: true,
  };
}

/**
 * Mock error response helper
 */
export function createMockErrorResponse(message: string) {
  return {
    data: null,
    error: new Error(message),
    isLoading: false,
    isError: true,
    isSuccess: false,
  };
}
