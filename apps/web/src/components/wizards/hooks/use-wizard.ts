import { useCallback, useEffect, useMemo, useState } from "react";

export type StepValidation<T> = (data: T) => Record<string, string> | null;

export type WizardStep<T> = {
  id: string;
  title: string;
  description?: string;
  isOptional?: boolean;
  validate?: StepValidation<T>;
};

export type WizardConfig<T> = {
  steps: WizardStep<T>[];
  initialData: T;
  storageKey?: string;
  onComplete?: (data: T) => void | Promise<void>;
};

export type WizardState<T> = {
  currentStep: number;
  totalSteps: number;
  data: T;
  errors: Record<string, string>;
  visitedSteps: Set<number>;
  isComplete: boolean;
  isSubmitting: boolean;
};

export type WizardActions<T> = {
  goToStep: (step: number) => void;
  goNext: () => void;
  goPrev: () => void;
  skipStep: () => void;
  updateData: (updates: Partial<T>) => void;
  setErrors: (errors: Record<string, string>) => void;
  clearErrors: () => void;
  validateCurrentStep: () => boolean;
  submit: () => Promise<void>;
  reset: () => void;
};

export type UseWizardReturn<T> = WizardState<T> &
  WizardActions<T> & {
    currentStepConfig: WizardStep<T>;
    canGoNext: boolean;
    canGoPrev: boolean;
    canSkip: boolean;
    progress: number;
    isFirstStep: boolean;
    isLastStep: boolean;
  };

const STORAGE_PREFIX = "gk-nexus-wizard-";

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...fallback,
        ...parsed.data,
      };
    }
  } catch {
    // Ignore storage errors
  }
  return fallback;
}

function saveToStorage<T>(key: string, data: T, currentStep: number): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${key}`,
      JSON.stringify({ data, currentStep, savedAt: new Date().toISOString() })
    );
  } catch {
    // Ignore storage errors
  }
}

function clearStorage(key: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch {
    // Ignore storage errors
  }
}

export function useWizard<T extends Record<string, unknown>>(
  config: WizardConfig<T>
): UseWizardReturn<T> {
  const { steps, initialData, storageKey, onComplete } = config;

  // Load initial data from storage if available
  const savedData = storageKey
    ? loadFromStorage(storageKey, initialData)
    : initialData;

  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<T>(savedData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = steps.length;
  const currentStepConfig = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const canGoPrev = !isFirstStep;
  const canSkip = currentStepConfig?.isOptional ?? false;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Save to storage when data or step changes
  useEffect(() => {
    if (storageKey && !isComplete) {
      saveToStorage(storageKey, data, currentStep);
    }
  }, [storageKey, data, currentStep, isComplete]);

  const validateCurrentStep = useCallback((): boolean => {
    const stepConfig = steps[currentStep];
    if (!stepConfig.validate) {
      return true;
    }

    const validationErrors = stepConfig.validate(data);
    if (validationErrors && Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return false;
    }

    setErrors({});
    return true;
  }, [currentStep, data, steps]);

  const canGoNext = useMemo(() => {
    const stepConfig = steps[currentStep];
    if (!stepConfig.validate) {
      return true;
    }

    const validationErrors = stepConfig.validate(data);
    return !validationErrors || Object.keys(validationErrors).length === 0;
  }, [currentStep, data, steps]);

  const goToStep = useCallback(
    (step: number) => {
      if (step < 0 || step >= totalSteps) {
        return;
      }
      // Only allow going to visited steps or the next step
      if (
        step <= currentStep ||
        visitedSteps.has(step) ||
        step === currentStep + 1
      ) {
        setCurrentStep(step);
        setVisitedSteps((prev) => new Set([...prev, step]));
        setErrors({});
      }
    },
    [totalSteps, currentStep, visitedSteps]
  );

  const goNext = useCallback(() => {
    if (isLastStep) {
      return;
    }
    if (!validateCurrentStep()) {
      return;
    }

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    setVisitedSteps((prev) => new Set([...prev, nextStep]));
    setErrors({});
  }, [currentStep, isLastStep, validateCurrentStep]);

  const goPrev = useCallback(() => {
    if (isFirstStep) {
      return;
    }
    setCurrentStep((prev) => prev - 1);
    setErrors({});
  }, [isFirstStep]);

  const skipStep = useCallback(() => {
    if (!canSkip || isLastStep) {
      return;
    }
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    setVisitedSteps((prev) => new Set([...prev, nextStep]));
    setErrors({});
  }, [canSkip, currentStep, isLastStep]);

  const updateData = useCallback((updates: Partial<T>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const submit = useCallback(async () => {
    if (!validateCurrentStep()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (onComplete) {
        await onComplete(data);
      }
      setIsComplete(true);
      if (storageKey) {
        clearStorage(storageKey);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An error occurred";
      setErrors({ submit: message });
    } finally {
      setIsSubmitting(false);
    }
  }, [data, onComplete, storageKey, validateCurrentStep]);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setData(initialData);
    setErrors({});
    setVisitedSteps(new Set([0]));
    setIsComplete(false);
    setIsSubmitting(false);
    if (storageKey) {
      clearStorage(storageKey);
    }
  }, [initialData, storageKey]);

  return {
    // State
    currentStep,
    totalSteps,
    data,
    errors,
    visitedSteps,
    isComplete,
    isSubmitting,

    // Computed
    currentStepConfig,
    canGoNext,
    canGoPrev,
    canSkip,
    progress,
    isFirstStep,
    isLastStep,

    // Actions
    goToStep,
    goNext,
    goPrev,
    skipStep,
    updateData,
    setErrors,
    clearErrors,
    validateCurrentStep,
    submit,
    reset,
  };
}
