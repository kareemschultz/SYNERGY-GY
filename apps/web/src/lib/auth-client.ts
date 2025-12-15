import { createAuthClient } from "better-auth/react";

// Use relative URL in production for reverse proxy compatibility
// When VITE_SERVER_URL is not set or is localhost, omit baseURL to use same origin
const getAuthBaseURL = () => {
  const viteServerUrl = import.meta.env.VITE_SERVER_URL;

  // If VITE_SERVER_URL is not set or is localhost, return undefined
  // This makes Better-Auth use the same origin as the frontend
  if (!viteServerUrl || viteServerUrl.includes("localhost")) {
    return;
  }

  return viteServerUrl;
};

export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
});
