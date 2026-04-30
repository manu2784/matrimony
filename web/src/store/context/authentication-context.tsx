import React, { useEffect, useState } from "react";
import { apiFetch } from "../../service/apiFetch";
import {
  type AuthState,
  type User,
} from "../../types/authentication/authentication-types";
import { AuthContext } from "./authContext";
import {
  setAccessToken,
  getAccessToken,
  readAccessTokenResponse,
} from "../../service/apiFetch";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);

  function applyAuthState(nextAuth: AuthState | null) {
    setAuth(nextAuth);
    setUser(nextAuth?.user ?? null);
  }

  async function initialize() {
    try {
      const res = await apiFetch("/users/me");
      if (!res.ok) throw new Error();

      const data = (await res.json()) as AuthState;
      applyAuthState(data);
    } catch {
      applyAuthState(null);
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    initialize();
  }, []);

  async function login(email: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) throw new Error("Login failed");

    const token = await readAccessTokenResponse(res);

    setAccessToken(token);

    const me = await apiFetch("/users/me");
    if (!me.ok) throw new Error("Unable to load user");
    const authData = (await me.json()) as AuthState;
    applyAuthState(authData);
  }

  async function logout() {
    await fetch(`${API_BASE_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });

    setAccessToken(null);
    applyAuthState(null);
  }

  function hasRole(role: string) {
    return auth?.roles.includes(role) ?? false;
  }

  function hasPermission(
    role: string,
    scopeType?: string,
    scopeId?: string | null,
  ) {
    return (
      auth?.permissions.some((permission) => {
        if (permission.role !== role) {
          return false;
        }

        if (scopeType && permission.scopeType !== scopeType) {
          return false;
        }

        if (
          scopeId !== undefined &&
          (permission.scopeId || null) !== (scopeId || null)
        ) {
          return false;
        }

        return true;
      }) ?? false
    );
  }

  const orgType = auth?.orgType ?? auth?.user?.orgType ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        auth,
        orgType,
        roles: auth?.roles ?? [],
        permissions: auth?.permissions ?? [],
        loading,
        login,
        logout,
        getAccessToken,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
