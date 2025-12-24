import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { client } from "@/utils/orpc";
import { unwrapOrpc } from "@/utils/orpc-response";

// Type for impersonation start response
type ImpersonationStartResponse = {
  token: string;
  expiresAt: Date;
  portalUserId: string;
  clientId: string;
};

export function useImpersonation() {
  const _navigate = useNavigate();

  const startImpersonationMutation = useMutation({
    mutationFn: async (input: { clientId: string; reason: string }) => {
      const response = await client.portal.impersonation.start(input);
      // Unwrap oRPC response envelope
      return unwrapOrpc<ImpersonationStartResponse>(response);
    },
  });
  const endImpersonationMutation = useMutation({
    mutationFn: (input: { token: string }) =>
      client.portal.impersonation.end(input),
  });

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
