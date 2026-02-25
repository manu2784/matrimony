import React, { useEffect, useState } from "react";
import { apiFetch } from "../../service/apiFetch";
import { type User } from "../../types/authentication/authentication-types";
import { AuthContext } from "./authContext";
import { setAccessToken, getAccessToken } from "../../service/apiFetch";


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function initialize() {
    try {
      const res = await apiFetch("/users/me");
      if (!res.ok) throw new Error();

      const data = await res.json();
      setUser(data.user);
    } catch {
      setUser(null);
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    initialize();
  }, []);

  async function login(email: string, password: string) {
    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) throw new Error("Login failed");

    const data = await res.json();

    setAccessToken(data.accessToken);
    setUser(data.user);
  }

  async function logout() {
    await fetch("/logout", {
      method: "POST",
      credentials: "include",
    });

    setAccessToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};