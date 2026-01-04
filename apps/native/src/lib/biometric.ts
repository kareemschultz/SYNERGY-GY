// biome-ignore lint/performance/noNamespaceImport: Expo SDK standard pattern
import * as LocalAuthentication from "expo-local-authentication";
// biome-ignore lint/performance/noNamespaceImport: Expo SDK standard pattern
import * as SecureStore from "expo-secure-store";

const BIOMETRIC_ENABLED_KEY = "gk_biometric_enabled";

/**
 * Check if biometric authentication is available on the device.
 * Requires both hardware support and enrolled biometrics.
 */
export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) {
    return false;
  }

  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

/**
 * Get the type of biometric authentication available.
 * Returns "Face ID", "Fingerprint", or null.
 */
export async function getBiometricType(): Promise<string | null> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

  if (
    types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
  ) {
    return "Face ID";
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return "Fingerprint";
  }
  return null;
}

/**
 * Prompt user for biometric authentication.
 * Returns true if authentication was successful.
 */
export async function authenticateWithBiometric(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate to continue",
      disableDeviceFallback: false,
      cancelLabel: "Cancel",
    });

    return result.success;
  } catch {
    return false;
  }
}

/**
 * Check if user has enabled biometric login.
 */
export async function isBiometricEnabled(): Promise<boolean> {
  const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
  return enabled === "true";
}

/**
 * Enable or disable biometric login.
 */
export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(
    BIOMETRIC_ENABLED_KEY,
    enabled ? "true" : "false"
  );
}

/**
 * Security level for biometric authentication.
 * BIOMETRIC_STRONG: Hardware-backed biometrics only (most secure)
 * BIOMETRIC_WEAK: Any biometric supported
 */
export async function getSecurityLevel(): Promise<LocalAuthentication.SecurityLevel> {
  return await LocalAuthentication.getEnrolledLevelAsync();
}
