import { redirect } from "react-router-dom";
import { apiFetch } from "../../service/apiFetch";

export async function requireAuthLoader() {
  try {
    const response = await apiFetch("/users/me");

    if (!response.ok) {
      throw new Error("Unable to load authenticated user");
    }

    const authState = await response.json();
    return authState.user;
  } catch (e) {
    console.error("Authentication check failed:", e);
    throw redirect("/sign-in");
  }
}
