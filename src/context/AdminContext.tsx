"use client";

import type { AdminResponse, AdminRolesPermissionsResponse } from "@/lib/webApi/generated/models";
import { getApiAdmin } from "@/lib/webApi/generated/requests";
import { clearTokens, getSessionToken } from "@/lib/utils/auth/tokenStorage";
import { decryptPermissions } from "@/lib/utils/auth/permissionEncryption";
import { env } from "@/env";
import { useRouter } from "next/navigation";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const STORAGE_KEY = "padelnet.admin";
const PERMISSIONS_COOKIE_NAME = "padelnet.permissions";

type AdminContextType = {
  admin: AdminResponse | null;
  permissions: AdminRolesPermissionsResponse | null;
  setAdmin: (admin: AdminResponse | null) => void;
  clearAdmin: () => void;
  isHydrated: boolean;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const [admin, setAdminState] = useState<AdminResponse | null>(null);
  const [permissions, setPermissions] = useState<AdminRolesPermissionsResponse | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const hasFetchedRef = useRef(false);

  // Hydrate admin from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setIsHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as AdminResponse;
      setAdminState(parsed);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Decrypt permissions from cookie
  const lastCookieRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !isHydrated) return;

    const decryptPermissionsFromCookie = async () => {
      try {
        // Get encrypted permissions from cookie
        const cookieString = document.cookie
          .split("; ")
          .find((row) => row.startsWith(`${PERMISSIONS_COOKIE_NAME}=`));

        if (!cookieString) {
          lastCookieRef.current = null;
          setPermissions(null);
          return;
        }

        // Extract value after the first '='
        const encryptedPermissions = cookieString.substring(
          PERMISSIONS_COOKIE_NAME.length + 1
        );

        // Skip decryption if cookie value hasn't changed
        if (encryptedPermissions === lastCookieRef.current) return;

        if (encryptedPermissions) {
          lastCookieRef.current = encryptedPermissions;
          const decrypted = await decryptPermissions<AdminRolesPermissionsResponse>(
            encryptedPermissions,
            env.NEXT_PUBLIC_PERMISSIONS_DECRYPTION_SECRET,
          );
          setPermissions(decrypted);
        } else {
          lastCookieRef.current = null;
          setPermissions(null);
        }
      } catch (error) {
        console.error("Failed to decrypt permissions:", error);
        lastCookieRef.current = null;
        setPermissions(null);
      }
    };

    // Decrypt once on mount
    void decryptPermissionsFromCookie();

    // Re-check when tab becomes visible (user navigated back, middleware may have refreshed cookie)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void decryptPermissionsFromCookie();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isHydrated]);

  const setAdmin = useCallback((nextAdmin: AdminResponse | null) => {
    setAdminState(nextAdmin);
    if (typeof window === "undefined") return;
    if (nextAdmin) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAdmin));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const clearAdmin = useCallback(() => {
    setAdmin(null);
    setPermissions(null);
  }, [setAdmin]);

  // Fetch admin data on mount (if authenticated)
  useEffect(() => {
    if (!isHydrated || hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchAdmin = async () => {
      const token = await getSessionToken();
      if (!token) return;

      setIsLoading(true);
      try {
        const { payload, error, response } = await getApiAdmin({
          safeFetch: true,
        });

        if (error) {
          if (response?.status === 401) {
            await clearTokens();
            setAdmin(null);
            router.replace("/signin");
          }
          return;
        }

        setAdmin(payload ?? null);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAdmin();
  }, [isHydrated, router, setAdmin]);

  // Permission check helpers
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!permissions?.permissions) return false;
      return permissions.permissions.includes(permission);
    },
    [permissions],
  );

  const hasRole = useCallback(
    (role: string): boolean => {
      if (!permissions?.role) return false;
      return permissions.role === role;
    },
    [permissions],
  );

  const value = useMemo(
    () => ({
      admin,
      permissions,
      setAdmin,
      clearAdmin,
      isHydrated,
      isLoading,
      hasPermission,
      hasRole,
    }),
    [admin, permissions, clearAdmin, isHydrated, isLoading, setAdmin, hasPermission, hasRole],
  );

  console.log(value);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};
