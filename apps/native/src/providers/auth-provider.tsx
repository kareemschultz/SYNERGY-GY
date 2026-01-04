import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { PortalUser, StaffUser, UserType } from "../lib/auth";
import {
  clearPortalAuth,
  clearStaffAuth,
  getAuthToken,
  getPortalToken,
  getPortalUser,
  getStaffUser,
  getUserType,
  setPortalAuth,
  setStaffAuth,
} from "../lib/auth";

type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  userType: UserType | null;
  staffUser: StaffUser | null;
  portalUser: PortalUser | null;
  loginStaff: (token: string, user: StaffUser) => Promise<void>;
  loginPortal: (token: string, user: PortalUser) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [portalUser, setPortalUser] = useState<PortalUser | null>(null);

  const isAuthenticated = useMemo(() => {
    if (userType === "staff") {
      return !!staffUser;
    }
    if (userType === "portal") {
      return !!portalUser;
    }
    return false;
  }, [userType, staffUser, portalUser]);

  const refreshAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const type = await getUserType();
      setUserType(type);

      if (type === "staff") {
        const token = await getAuthToken();
        if (token) {
          const user = await getStaffUser();
          setStaffUser(user);
        } else {
          setStaffUser(null);
        }
        setPortalUser(null);
      } else if (type === "portal") {
        const token = await getPortalToken();
        if (token) {
          const user = await getPortalUser();
          setPortalUser(user);
        } else {
          setPortalUser(null);
        }
        setStaffUser(null);
      } else {
        setStaffUser(null);
        setPortalUser(null);
      }
    } catch (error) {
      console.error("Error refreshing auth:", error);
      setUserType(null);
      setStaffUser(null);
      setPortalUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginStaff = useCallback(async (token: string, user: StaffUser) => {
    await setStaffAuth(token, user);
    setUserType("staff");
    setStaffUser(user);
    setPortalUser(null);
  }, []);

  const loginPortal = useCallback(async (token: string, user: PortalUser) => {
    await setPortalAuth(token, user);
    setUserType("portal");
    setPortalUser(user);
    setStaffUser(null);
  }, []);

  const logout = useCallback(async () => {
    if (userType === "staff") {
      await clearStaffAuth();
    } else if (userType === "portal") {
      await clearPortalAuth();
    }
    setUserType(null);
    setStaffUser(null);
    setPortalUser(null);
  }, [userType]);

  // Check auth state on mount
  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const value = useMemo(
    () => ({
      isLoading,
      isAuthenticated,
      userType,
      staffUser,
      portalUser,
      loginStaff,
      loginPortal,
      logout,
      refreshAuth,
    }),
    [
      isLoading,
      isAuthenticated,
      userType,
      staffUser,
      portalUser,
      loginStaff,
      loginPortal,
      logout,
      refreshAuth,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
