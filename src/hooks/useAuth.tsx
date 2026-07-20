import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";

// Types
export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: "super_admin" | "admin" | "manager" | "agent" | "user";
  status: "active" | "inactive" | "suspended";
  avatar?: string;
  brandName?: string;
  tenantId: string;
  // The brand the user is currently working in (drives data scoping).
  activeBrandId?: string | null;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  // Switch the active brand; scopes all data to that brand going forward.
  setActiveBrand: (brandId: string) => Promise<void>;
  clearError: () => void;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  brandName?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });
  const queryClient = useQueryClient();

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get<{ user: User }>("/auth/profile");
      setState({
        user: response.data,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    }
  }, []);

 
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await api.post<{ user: User }>("/auth/login", {
        email,
        password,
      });
      setState({
        user: response.data.user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Login failed. Please try again.";
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: message,
      });
      throw new Error(message);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await api.post<{ user: User }>("/auth/register", data);
      setState({
        user: response.data.user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Registration failed. Please try again.";
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: message,
      });
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Even if logout API fails, clear local state
    }
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
    queryClient.clear(); // Clear all query cache
  }, [queryClient]);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    const response = await api.put<{ user: User }>("/auth/profile", data);
    setState((prev) => ({
      ...prev,
      user: response.data,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const setActiveBrand = useCallback(async (brandId: string) => {
    const response = await api.post<{ activeBrandId: string }>(`/brands/${brandId}/activate`, {});
    setState((prev) => ({
      ...prev,
      user: { ...(prev.user as User), activeBrandId: response.data?.activeBrandId ?? brandId },
    }));
    // Invalidate every cached list so it re-scopes to the new active brand.
    queryClient.invalidateQueries();
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
        setActiveBrand,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
