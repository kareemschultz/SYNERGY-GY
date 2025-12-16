import { useNavigate } from "@tanstack/react-router";
import { orpc } from "@/utils/orpc";

export function useImpersonation() {
  const _navigate = useNavigate();

  const startImpersonationMutation =
    orpc.portal.impersonation.start.useMutation();
  const endImpersonationMutation = orpc.portal.impersonation.end.useMutation();

  const startImpersonation = async (
    clientId: string,
    reason: string,
    clientName?: string
  ) => {
    const { token } = await startImpersonationMutation.mutateAsync({
      clientId,
      reason,
    });

    sessionStorage.setItem("impersonation_token", token);
    sessionStorage.setItem("impersonated_client_id", clientId);
    if (clientName) {
      sessionStorage.setItem("impersonated_client_name", clientName);
    }

    // Navigate to portal home
    // We need to reload or force re-render to pick up the new token in auth headers
    // But since we are likely using a different layout for portal, navigation might work if the auth provider checks session storage
    // However, usually API clients are initialized once.
    // If the API client reads from sessionStorage on every request, it should work.
    // Assuming the auth setup handles 'x-portal-session' or similar from session storage if in impersonation mode.
    // The prompt says "Navigate to /portal?impersonated=true".

    window.location.href = "/portal?impersonated=true";
  };

  const endImpersonation = async () => {
    const token = sessionStorage.getItem("impersonation_token");
    if (token) {
      try {
        await endImpersonationMutation.mutateAsync({ token });
      } catch (e) {
        console.error("Failed to end impersonation session cleanly", e);
      }
      sessionStorage.removeItem("impersonation_token");
      sessionStorage.removeItem("impersonated_client_id");
      sessionStorage.removeItem("impersonated_client_name");
    }
    window.location.href = "/app/clients";
  };

  const isImpersonating = () => !!sessionStorage.getItem("impersonation_token");

  return { startImpersonation, endImpersonation, isImpersonating };
}
