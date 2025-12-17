import { createAuthClient } from "better-auth/react";

// Get baseURL config for Better-Auth
// In production with reverse proxy, omit baseURL to use same origin
const getAuthConfig = () => {
  const viteServerUrl = import.meta.env.VITE_SERVER_URL;

  // If VITE_SERVER_URL is not set or is localhost, omit baseURL entirely
  // This makes Better-Auth use the same origin as the frontend (relative URLs)
  if (!viteServerUrl || viteServerUrl.includes("localhost")) {
    return {}; // No baseURL property at all
  }

  // Otherwise use the provided URL (for development/different domains)
  return { baseURL: viteServerUrl };
};

export const authClient = createAuthClient(getAuthConfig());
