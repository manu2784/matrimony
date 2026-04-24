import type { ActionFunctionArgs } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export type CreateInstituteActionData = {
  error?: string;
  success?: string;
};

export async function createInstituteAction({
  request,
}: ActionFunctionArgs): Promise<CreateInstituteActionData | undefined> {
  const data = await request.formData();

  const name = data.get("name")?.toString().trim();
  const description = data.get("description")?.toString().trim();
  const admin = data.get("admin")?.toString().trim();
  const isActiveValue = data.get("isActive")?.toString().trim();

  if (!name || !admin) {
    return { error: "Name and admin are required." };
  }

  const payload = {
    name,
    description: description || undefined,
    admin,
    isActive: isActiveValue !== "false",
  };

  const response = await fetch(`${API_BASE_URL}/institutes/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    return { success: "Organization created successfully." };
  }

  let errorMessage = "Unable to create organization.";

  try {
    const result = await response.json();
    if (typeof result?.message === "string") {
      errorMessage = result.message;
    } else if (typeof result?.error === "string") {
      errorMessage = result.error;
    } else if (Array.isArray(result?.errors) && result.errors.length > 0) {
      errorMessage = result.errors.join(", ");
    }
  } catch {
    const text = await response.text();
    if (text) {
      errorMessage = text;
    }
  }

  return { error: errorMessage };
}
