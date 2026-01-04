// biome-ignore lint/performance/noNamespaceImport: Expo SDK standard pattern
import * as SecureStore from "expo-secure-store";

const STAFF_TOKEN_KEY = "gk_staff_session_token";
const PORTAL_TOKEN_KEY = "gk_portal_session_token";
const USER_TYPE_KEY = "gk_user_type";
const STAFF_USER_KEY = "gk_staff_user";
const PORTAL_USER_KEY = "gk_portal_user";

export type UserType = "staff" | "portal";

export type StaffUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type PortalUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  clientId: string;
};

// ─────────────────────────────────────────────────
// Staff Authentication
// ─────────────────────────────────────────────────

export async function setStaffAuth(
  token: string,
  user: StaffUser
): Promise<void> {
  await SecureStore.setItemAsync(STAFF_TOKEN_KEY, token);
  await SecureStore.setItemAsync(STAFF_USER_KEY, JSON.stringify(user));
  await SecureStore.setItemAsync(USER_TYPE_KEY, "staff");
}

export async function getAuthToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(STAFF_TOKEN_KEY);
}

export async function getStaffUser(): Promise<StaffUser | null> {
  const userJson = await SecureStore.getItemAsync(STAFF_USER_KEY);
  if (!userJson) {
    return null;
  }
  try {
    return JSON.parse(userJson) as StaffUser;
  } catch {
    return null;
  }
}

export async function clearStaffAuth(): Promise<void> {
  await SecureStore.deleteItemAsync(STAFF_TOKEN_KEY);
  await SecureStore.deleteItemAsync(STAFF_USER_KEY);
  await SecureStore.deleteItemAsync(USER_TYPE_KEY);
}

// ─────────────────────────────────────────────────
// Portal (Client) Authentication
// ─────────────────────────────────────────────────

export async function setPortalAuth(
  token: string,
  user: PortalUser
): Promise<void> {
  await SecureStore.setItemAsync(PORTAL_TOKEN_KEY, token);
  await SecureStore.setItemAsync(PORTAL_USER_KEY, JSON.stringify(user));
  await SecureStore.setItemAsync(USER_TYPE_KEY, "portal");
}

export async function getPortalToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(PORTAL_TOKEN_KEY);
}

export async function getPortalUser(): Promise<PortalUser | null> {
  const userJson = await SecureStore.getItemAsync(PORTAL_USER_KEY);
  if (!userJson) {
    return null;
  }
  try {
    return JSON.parse(userJson) as PortalUser;
  } catch {
    return null;
  }
}

export async function clearPortalAuth(): Promise<void> {
  await SecureStore.deleteItemAsync(PORTAL_TOKEN_KEY);
  await SecureStore.deleteItemAsync(PORTAL_USER_KEY);
  await SecureStore.deleteItemAsync(USER_TYPE_KEY);
}

// ─────────────────────────────────────────────────
// Shared Utilities
// ─────────────────────────────────────────────────

export async function getUserType(): Promise<UserType | null> {
  const type = await SecureStore.getItemAsync(USER_TYPE_KEY);
  return type as UserType | null;
}

export async function isAuthenticated(): Promise<boolean> {
  const userType = await getUserType();
  if (userType === "staff") {
    return !!(await getAuthToken());
  }
  if (userType === "portal") {
    return !!(await getPortalToken());
  }
  return false;
}

export async function logout(): Promise<void> {
  const userType = await getUserType();
  if (userType === "staff") {
    await clearStaffAuth();
  } else if (userType === "portal") {
    await clearPortalAuth();
  }
}
