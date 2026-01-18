"use client";

import type { AdminResponse } from "@/lib/webApi/generated/models";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "padelnet.admin";

type AdminContextType = {
  admin: AdminResponse | null;
  setAdmin: (admin: AdminResponse | null) => void;
  clearAdmin: () => void;
  isHydrated: boolean;
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
  const [admin, setAdminState] = useState<AdminResponse | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

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

  const setAdmin = useCallback((nextAdmin: AdminResponse | null) => {
    setAdminState(nextAdmin);
    if (typeof window === "undefined") return;
    if (nextAdmin) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAdmin));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const clearAdmin = useCallback(() => setAdmin(null), [setAdmin]);

  const value = useMemo(
    () => ({
      admin,
      setAdmin,
      clearAdmin,
      isHydrated,
    }),
    [admin, clearAdmin, isHydrated, setAdmin],
  );

  console.log(value)

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};
