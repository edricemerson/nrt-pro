"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  changePassword as apiChangePassword,
  getCurrentCustomer,
  registerCustomer,
  signIn as apiSignIn,
  signOut as apiSignOut,
  updateDeliveryProfile,
} from "@/lib/api";
import type { Customer, DeliveryProfile, RegisterInput } from "@/lib/types";

interface AuthContextValue {
  customer: Customer | null;
  /** True until the stored session has been read, so the header can avoid flicker. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<Customer>;
  register: (input: RegisterInput) => Promise<Customer>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<DeliveryProfile>) => Promise<Customer>;
  changePassword: (currentPassword: string, nextPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentCustomer()
      .then(setCustomer)
      .catch(() => setCustomer(null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const next = await apiSignIn(email, password);
    setCustomer(next);
    return next;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const next = await registerCustomer(input);
    setCustomer(next);
    return next;
  }, []);

  const signOut = useCallback(async () => {
    await apiSignOut();
    setCustomer(null);
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<DeliveryProfile>) => {
      if (!customer) throw new Error("Belum masuk.");
      const next = await updateDeliveryProfile(customer.id, patch);
      setCustomer(next);
      return next;
    },
    [customer],
  );

  const changePassword = useCallback(
    async (currentPassword: string, nextPassword: string) => {
      if (!customer) throw new Error("Belum masuk.");
      await apiChangePassword(customer.id, currentPassword, nextPassword);
    },
    [customer],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ customer, loading, signIn, register, signOut, updateProfile, changePassword }),
    [customer, loading, signIn, register, signOut, updateProfile, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  return ctx;
}
