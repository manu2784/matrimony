import type { Route } from "./+types/project";
import { redirect } from "react-router";
import { setJwt } from "../../helper/jwt/jwt";

export async function signInAction({ request }: Route.ActionArgs) {
  const data = await request.formData();

  const email = data.get("email");
  const password = data.get("password");
  const payload = {
    email: email,
    password: password,
  };
  if (email && password) {
    const response = await fetch("http://localhost:3000/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
  
    const token = await response.text();
    console.log("token", response.status);
    if (response.status==200 && token) {
      setJwt(token);
      throw redirect("/dashboard");
    }
  }
  return;
}
