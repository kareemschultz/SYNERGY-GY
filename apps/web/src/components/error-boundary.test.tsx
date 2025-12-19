import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/utils";
import { ErrorBoundary } from "./error-boundary";

// Regex patterns at top level for performance
const TRY_AGAIN_REGEX = /try again/i;
const RELOAD_PAGE_REGEX = /reload page/i;

// Empty function for suppressing console.error in tests
const noop = () => {
  /* suppress console.error */
};

describe("ErrorBoundary", () => {
  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Content</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders error UI when child component throws", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(noop);

    const ThrowingComponent = () => {
      throw new Error("Test error");
    };

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: TRY_AGAIN_REGEX })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: RELOAD_PAGE_REGEX })
    ).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it("renders custom fallback when provided", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(noop);

    const ThrowingComponent = () => {
      throw new Error("Test error");
    };

    render(
      <ErrorBoundary fallback={<div>Custom error fallback</div>}>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom error fallback")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it("shows error message in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(noop);

    const ThrowingComponent = () => {
      throw new Error("Detailed error message");
    };

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Detailed error message")).toBeInTheDocument();

    consoleSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });
});
