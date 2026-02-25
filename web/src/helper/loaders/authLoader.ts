import { redirect } from "react-router-dom";
import { apiFetch } from "../../service/apiFetch";


export async function requireAuthLoader() {
  try {
    const user = await apiFetch("/users/me");
    return user;
  } catch (e){
    console.error("Authentication check failed:", e);
    throw redirect("/sign-in");
  }
}
