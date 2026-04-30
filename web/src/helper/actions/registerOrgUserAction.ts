import type { ActionFunctionArgs } from "react-router-dom";
import { apiFetch } from "../../service/apiFetch";

export type RegisterOrgUserActionData = {
  error?: string;
  success?: string;
};

export async function registerOrgUserAction({
  request,
}: ActionFunctionArgs): Promise<RegisterOrgUserActionData | undefined> {
  const data = await request.formData();

  const firstName = data.get("firstName")?.toString().trim();
  const lastName = data.get("lastName")?.toString().trim();
  const email = data.get("email")?.toString().trim();
  const password = data.get("password")?.toString();
  const roles = data
    .getAll("roles")
    .map((role) => role.toString())
    .filter(Boolean);

  if (!firstName || !lastName || !email || !password || roles.length === 0) {
    return { error: "Please complete all fields before submitting." };
  }

  const response = await apiFetch("/users/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      firstName,
      lastName,
      email,
      password,
      roles,
    }),
  });

  if (response.ok) {
    return { success: "User registered successfully." };
  }

  let errorMessage = "Unable to register user.";

  try {
    const result = await response.json();
    if (typeof result?.error === "string") {
      errorMessage = result.error;
    }
  } catch {
    const text = await response.text();
    if (text) {
      errorMessage = text;
    }
  }

  return { error: errorMessage };
}
