import type { ActionFunctionArgs } from "react-router-dom";
import { apiFetch } from "../../service/apiFetch";

export type CreateCourseActionData = {
  error?: string;
  success?: string;
};

export async function createCourseAction({
  request,
}: ActionFunctionArgs): Promise<CreateCourseActionData | undefined> {
  const data = await request.formData();

  const title = data.get("title")?.toString().trim();
  const description = data.get("description")?.toString().trim();
  const durationWeeksValue = data.get("durationWeeks")?.toString().trim();
  const instituteId = data.get("instituteId")?.toString().trim();
  const courseAdminId = data.get("courseAdminId")?.toString().trim();

  if (!title || !durationWeeksValue || !instituteId || !courseAdminId) {
    return { error: "Please complete all required fields before submitting." };
  }

  const durationWeeks = Number(durationWeeksValue);

  if (!Number.isFinite(durationWeeks) || durationWeeks <= 0) {
    return { error: "Duration in weeks must be a positive number." };
  }

  const payload = {
    title,
    description: description || undefined,
    durationWeeks,
    instituteId,
    courseAdminId,
  };

  const response = await apiFetch("/courses/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    return { success: "Course created successfully." };
  }

  let errorMessage = "Unable to create course.";

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
