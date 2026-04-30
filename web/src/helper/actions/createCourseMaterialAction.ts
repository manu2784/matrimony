import type { ActionFunctionArgs } from "react-router-dom";
import { apiFetch } from "../../service/apiFetch";

export type CreateCourseMaterialActionData = {
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

export async function createCourseMaterialAction({
  request,
}: ActionFunctionArgs): Promise<CreateCourseMaterialActionData | undefined> {
  const data = await request.formData();

  const title = data.get("title")?.toString().trim();
  const description = data.get("description")?.toString().trim();
  const instituteId = data.get("instituteId")?.toString().trim();
  const courseId = data.get("courseId")?.toString().trim();
  const file = data.get("file");

  if (!title || !instituteId || !(file instanceof File) || file.size === 0) {
    return { error: "Please add a title, organization, and file." };
  }

  const uploadForm = new FormData();
  uploadForm.set("title", title);
  uploadForm.set("instituteId", instituteId);
  uploadForm.set("file", file);

  if (description) {
    uploadForm.set("description", description);
  }

  if (courseId) {
    uploadForm.set("courseId", courseId);
  }

  const assetResponse = await apiFetch("/assets/upload", {
    method: "POST",
    body: uploadForm,
  });

  if (assetResponse.ok) {
    return { success: "Course material uploaded successfully." };
  }

  return {
    error: await readErrorMessage(
      assetResponse,
      "The file uploaded, but the course material record could not be saved.",
    ),
  };
}
