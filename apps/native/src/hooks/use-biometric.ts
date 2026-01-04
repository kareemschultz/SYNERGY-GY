import { useCallback, useEffect, useState } from "react";
import {
  authenticateWithBiometric,
  getBiometricType,
  isBiometricAvailable,
  isBiometricEnabled,
  setBiometricEnabled,
} from "../lib/biometric";

/**
 * Hook for managing biometric authentication.
 * Provides availability check, enable/disable toggle, and authenticate function.
 */
export function useBiometricAuth() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkBiometric() {
      try {
        const available = await isBiometricAvailable();
        setIsAvailable(available);

        if (available) {
          const type = await getBiometricType();
          setBiometricType(type);

          const enabled = await isBiometricEnabled();
          setIsEnabled(enabled);
        }
      } catch (error) {
        console.error("Error checking biometric:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkBiometric();
  }, []);

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!(isAvailable && isEnabled)) {
      return false;
    }
    return await authenticateWithBiometric();
  }, [isAvailable, isEnabled]);

  const toggleBiometric = useCallback(
    async (enable: boolean): Promise<boolean> => {
      if (!isAvailable) {
        return false;
      }

      if (enable) {
        // Verify biometric before enabling
        const success = await authenticateWithBiometric();
        if (success) {
          await setBiometricEnabled(true);
          setIsEnabled(true);
          return true;
        }
        return false;
      }

      await setBiometricEnabled(false);
      setIsEnabled(false);
      return true;
    },
    [isAvailable]
  );

  return {
    isLoading,
    isAvailable,
    isEnabled,
    biometricType,
    authenticate,
    toggleBiometric,
  };
}
