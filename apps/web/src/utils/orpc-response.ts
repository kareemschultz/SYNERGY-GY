/**
 * Unwraps oRPC response envelope
 *
 * oRPC v1.12+ may wrap responses in { json: T } envelope.
 * This helper provides consistent access to the actual response data.
 *
 * @example
 * // API returns: { json: { hasStaffProfile: true } }
 * const staff = unwrapOrpc<StaffStatus>(response);
 * staff.hasStaffProfile // true (no .json needed)
 *
 * @param response - oRPC response (may be wrapped or unwrapped)
 * @returns Unwrapped response data
 */
export function unwrapOrpc<T>(response: unknown): T {
  // Check if response is wrapped in { json: T } envelope
  if (
    response &&
    typeof response === "object" &&
    "json" in response &&
    response.json !== undefined
  ) {
    return response.json as T;
  }

  // Return as-is if already unwrapped
  return response as T;
}
