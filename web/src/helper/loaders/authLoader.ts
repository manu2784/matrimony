import { redirect } from "react-router-dom";
import { apiFetch } from "../../service/apiFetch";
import { type User } from "../../types/authentication/authentication-types";

export async function requireAuthLoader() {
  try {
    const user = await apiFetch<User>("http://localhost:3000/users/me");
    console.log("Authenticated user:", user);
    return user;
  } catch (e){
    console.error("Authentication check failed:", e);
    throw redirect("/sign-in");
  }
}
