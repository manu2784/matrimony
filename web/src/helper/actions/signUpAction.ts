import type { Route } from "./+types/project";

export default async function signUpAction({ request }: Route.ActionArgs) {
  console.log('here', request);
  const data = await request.formData();
  const [firstname, lastname] = data.get("name").split(" ");
  const email = data.get("email");
  const password = data.get("password");
  const payload = {
    firstName: firstname,
    lastName: lastname,
    email: email,
    password: password
  }
  console.log(payload);
  if (firstname && lastname && email && password) {
    const response = await fetch("http://localhost:3000/users/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (response) console.log(await response.json());
    return;
  }
  return undefined;
}