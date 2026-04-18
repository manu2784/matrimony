import type { ActionFunctionArgs } from "react-router-dom";
import { redirect } from "react-router";
import { setAccessToken } from "../../service/apiFetch";
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
    const token = await response.text();
    if (response.status==200 && token) {
      setAccessToken(token);
      throw redirect("/dashboard");
    }
        if (response.status==403) {
        return { error: "Invalid email or password" };
    }
            if (response.status==400) {
        return { error: response.text() };
    }
  }
  return;
}
