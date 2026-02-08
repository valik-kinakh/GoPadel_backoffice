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
  useEffect(() => {
    if (typeof window === "undefined" || !isHydrated) return;

    try {
      // Get encrypted permissions from cookie
      const encryptedPermissions = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${PERMISSIONS_COOKIE_NAME}=`))
        ?.split("=")[1];

      if (encryptedPermissions) {
        const decrypted = decryptPermissions<AdminRolesPermissionsResponse>(
          decodeURIComponent(encryptedPermissions),
          env.NEXT_PUBLIC_PERMISSIONS_DECRYPTION_SECRET,
        );
        setPermissions(decrypted);
      } else {
        setPermissions(null);
      }
    } catch (error) {
      console.error("Failed to decrypt permissions:", error);
      setPermissions(null);
    }
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
      hasPermission,
      hasRole,
    }),
    [admin, permissions, clearAdmin, isHydrated, setAdmin, hasPermission, hasRole],
  );

  //console.log(value)

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};
