import React, { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../service/apiFetch";
import { type User } from "../../types/authentication/authentication-types";
import { AuthContext } from "./authContext";


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiFetch<User>("/users/me");
      setUser(data);
    } catch {
      setUser(null);
    }
  }, []);

  const login = async (email: string, password: string) => {
    await apiFetch("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await refreshUser();
  };

  const logout = async () => {
    await apiFetch("http://localhost:3000/logout", { method: "POST" });
    setUser(null);
  };

  useEffect(() => {
    let isActive = true;

    const initializeAuth = async () => {
      try {
        await refreshUser();
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void initializeAuth();

    return () => {
      isActive = false;
    };
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
