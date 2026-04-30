import type { ActionFunctionArgs } from "react-router-dom";
import { redirect } from "react-router";
import {
  apiFetch,
  readAccessTokenResponse,
  setAccessToken,
} from "../../service/apiFetch";
import type { AuthState } from "../../types/authentication/authentication-types";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export async function signInAction({ request }: ActionFunctionArgs) {
  const data = await request.formData();

  const email = data.get("email");
  const password = data.get("password");
  const payload = {
    email: email,
    password: password,
  };
  if (email && password) {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (response.status === 200) {
      const token = await readAccessTokenResponse(response);

      if (token) {
        setAccessToken(token);
      }

      const authResponse = await apiFetch("/users/me");
      if (!authResponse.ok) {
        return { error: "Unable to load user profile" };
      }

      const authState = (await authResponse.json()) as AuthState;
      const orgType = authState.orgType ?? authState.user?.orgType ?? null;

      throw redirect(
        orgType === "provider" ? "/provider-dashboard" : "/dashboard",
      );
    }

    if (response.status === 403) {
      return { error: "Invalid email or password" };
    }

    if (response.status === 400) {
      const errorText = await response.text();
      return { error: errorText };
    }
  }
  return;
}
