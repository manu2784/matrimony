import type { ActionFunctionArgs } from "react-router-dom";
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export default async function signUpAction({ request }: ActionFunctionArgs) {
  const data = await request.formData();

  const name = data.get("name");
  const [firstname, lastname] = name?.toString().split(" ") ?? [];
  const email = data.get("email");
  const password = data.get("password");
  const payload = {
    firstName: firstname,
    lastName: lastname,
    email: email,
    password: password,
  };

  if (firstname && lastname && email && password) {
    const response = await fetch('/api/users/register', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    const user = await response.json();
    if (response.status ===200)
    return user;
  }
  return undefined;
}
