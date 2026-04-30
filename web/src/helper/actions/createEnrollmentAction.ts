import type { ActionFunctionArgs } from "react-router-dom";
import { apiFetch } from "../../service/apiFetch";

export type CreateEnrollmentActionData = {
  error?: string;
  success?: string;
};

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const result = await response.json();
    if (typeof result?.message === "string") return result.message;
    if (typeof result?.error === "string") return result.error;
    if (Array.isArray(result?.errors) && result.errors.length > 0) {
      return result.errors.join(", ");
    }
  } catch {
    const text = await response.text();
    if (text) return text;
  }

  return fallback;
}

export async function createEnrollmentAction({
  request,
}: ActionFunctionArgs): Promise<CreateEnrollmentActionData | undefined> {
  const data = await request.formData();

  const studentName = data.get("studentName")?.toString().trim();
  const studentEmail = data.get("studentEmail")?.toString().trim();
  const courseId = data.get("courseId")?.toString().trim();
  const instituteId = data.get("instituteId")?.toString().trim();
  const feePaidValue = data.get("feePaid")?.toString().trim();

  if (!studentName || !studentEmail || !courseId || !instituteId) {
    return { error: "Please complete all required fields before submitting." };
  }

  const feePaid = feePaidValue ? Number(feePaidValue) : 0;

  if (!Number.isFinite(feePaid) || feePaid < 0) {
    return { error: "Fee paid must be a positive number." };
  }

  const response = await apiFetch("/enrollments/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      studentName,
      studentEmail,
      courseId,
      instituteId,
      feePaid,
    }),
  });

  if (response.ok) {
    return { success: "Student enrolled successfully." };
  }

  return {
    error: await readErrorMessage(response, "Unable to create enrollment."),
  };
}
