import type { Route } from "./+types/project";

export default async function signUpAction({ request }: Route.ActionArgs) {
  console.log("here", request);
  const data = await request.formData();
  const [firstname, lastname] = data.get("name").split(" ");
  const email = data.get("email");
  const password = data.get("password");
  const payload = {
    firstName: firstname,
    lastName: lastname,
    email: email,
    password: password,
  };

  if (firstname && lastname && email && password) {
    const response = await fetch("http://localhost:3000/users/register", {
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
