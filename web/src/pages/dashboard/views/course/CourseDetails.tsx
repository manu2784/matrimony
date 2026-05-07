import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import PermMediaRoundedIcon from "@mui/icons-material/PermMediaRounded";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormLabel,
  IconButton,
  LinearProgress,
  Link,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  Link as RouterLink,
  useLoaderData,
  useNavigate,
  useParams,
} from "react-router-dom";
import { apiFetch } from "../../../../service/apiFetch";
import { useAuth } from "../../../../store/context/useAuth";
import type { User } from "../../../../types/authentication/authentication-types";

type Lesson = {
  _id?: string;
  title: string;
};

type CourseModule = {
  _id?: string;
  title: string;
  status?: string;
  lessons?: Lesson[];
};

type Course = {
  _id: string;
  title: string;
  description?: string;
  durationWeeks?: number;
  price?: number;
  isActive?: boolean;
  modules?: CourseModule[];
  instituteId?: string;
};

type Asset = {
  _id: string;
  title: string;
  originalFileName?: string;
  type?: string;
  moduleId?: string | null;
  lessonId?: string | null;
};

type ModalState =
  | { type: "edit-course" }
  | { type: "delete-course" }
  | { type: "add-module" }
  | { type: "edit-module"; moduleIndex: number }
  | { type: "delete-module"; moduleIndex: number }
  | { type: "add-lesson"; moduleIndex: number }
  | { type: "edit-lesson"; moduleIndex: number; lessonIndex: number }
  | { type: "delete-lesson"; moduleIndex: number; lessonIndex: number }
  | {
      type: "add-asset";
      moduleIndex?: number;
      lessonIndex?: number;
    }
  | null;

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

function normalizeLessons(values: string[]) {
  return Array.from(
    new Set(values.map((lesson) => lesson.trim()).filter(Boolean)),
  );
}

function getModuleKey(moduleItem: CourseModule, moduleIndex: number) {
  return moduleItem._id || `${moduleItem.title}-${moduleIndex}`;
}

function getLessonKey(lesson: Lesson, lessonIndex: number) {
  return lesson._id || `${lesson.title}-${lessonIndex}`;
}

export default function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const loaderUser = useLoaderData() as User;
  const currentUser = user ?? loaderUser;

  const [course, setCourse] = useState<Course | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [lessonTags, setLessonTags] = useState<string[]>([]);
  const [assetModuleIndex, setAssetModuleIndex] = useState<number | null>(null);
  const [assetLessonIndex, setAssetLessonIndex] = useState<number | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const canManageCourse =
    hasRole("orgSuperAdmin") ||
    hasRole("courseAdmin") ||
    hasRole("courseManager");

  const loadCourse = useCallback(async () => {
    if (!courseId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [courseResponse, assetsResponse] = await Promise.all([
        apiFetch(`/courses/${courseId}`),
        apiFetch(`/assets?courseId=${courseId}&limit=500&status=active`),
      ]);

      if (!courseResponse.ok) {
        throw new Error(
          await readErrorMessage(courseResponse, "Unable to load course."),
        );
      }

      const courseResult = await courseResponse.json();
      setCourse(courseResult.data);

      if (assetsResponse.ok) {
        const assetsResult = await assetsResponse.json();
        setAssets(Array.isArray(assetsResult?.data) ? assetsResult.data : []);
      } else {
        setAssets([]);
      }
    } catch (loadError) {
      setCourse(null);
      setAssets([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load course.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  if (!canManageCourse) {
    return null;
  }

  async function updateCourse(payload: Partial<Course>) {
    if (!courseId) return null;

    const response = await apiFetch(`/courses/update/${courseId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "Unable to update course."),
      );
    }

    const result = await response.json();
    setCourse(result.data);
    return result.data as Course;
  }

  function closeModal() {
    setModal(null);
    setLessonTags([]);
    setAssetModuleIndex(null);
    setAssetLessonIndex(null);
    setDeleteConfirmation("");
  }

  function openAssetModal(moduleIndex?: number, lessonIndex?: number) {
    setAssetModuleIndex(moduleIndex ?? null);
    setAssetLessonIndex(lessonIndex ?? null);
    setModal({ type: "add-asset", moduleIndex, lessonIndex });
  }

  function setModuleAt(
    modules: CourseModule[],
    moduleIndex: number,
    nextModule: CourseModule,
  ) {
    return modules.map((moduleItem, index) =>
      index === moduleIndex ? nextModule : moduleItem,
    );
  }

  async function saveModules(
    nextModules: CourseModule[],
    successMessage: string,
  ) {
    try {
      setIsSaving(true);
      setError(null);
      await updateCourse({ modules: nextModules });
      setSuccess(successMessage);
      closeModal();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update course.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEditCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = data.get("title")?.toString().trim();
    const durationWeeksValue = data.get("durationWeeks")?.toString().trim();
    const priceValue = data.get("price")?.toString().trim();

    if (!title) {
      setError("Course title is required.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await updateCourse({
        title,
        description: data.get("description")?.toString().trim(),
        durationWeeks: durationWeeksValue
          ? Number(durationWeeksValue)
          : undefined,
        price: priceValue ? Number(priceValue) : undefined,
        isActive: data.get("isActive") === "on",
      });
      setSuccess("Course updated successfully.");
      closeModal();
    } catch (editError) {
      setError(
        editError instanceof Error
          ? editError.message
          : "Unable to update course.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleModuleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!course || !modal) return;

    const title = new FormData(event.currentTarget)
      .get("moduleTitle")
      ?.toString()
      .trim();

    if (!title) {
      setError("Module name is required.");
      return;
    }

    const modules = course.modules || [];

    if (modal.type === "edit-module") {
      const currentModule = modules[modal.moduleIndex];
      if (!currentModule) return;

      await saveModules(
        setModuleAt(modules, modal.moduleIndex, {
          ...currentModule,
          title,
        }),
        "Module updated successfully.",
      );
      return;
    }

    const nextModules = [
      ...modules,
      {
        title,
        lessons: normalizeLessons(lessonTags).map((lesson) => ({
          title: lesson,
        })),
      },
    ];

    await saveModules(nextModules, "Module added successfully.");
  }

  async function handleLessonSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!course || !modal) return;

    const title = new FormData(event.currentTarget)
      .get("lessonTitle")
      ?.toString()
      .trim();

    if (!title) {
      setError("Lesson name is required.");
      return;
    }

    const modules = course.modules || [];

    if (modal.type === "add-lesson") {
      const currentModule = modules[modal.moduleIndex];
      if (!currentModule) return;

      await saveModules(
        setModuleAt(modules, modal.moduleIndex, {
          ...currentModule,
          lessons: [...(currentModule.lessons || []), { title }],
        }),
        "Lesson added successfully.",
      );
    }

    if (modal.type === "edit-lesson") {
      const currentModule = modules[modal.moduleIndex];
      const currentLessons = currentModule?.lessons || [];
      const currentLesson = currentLessons[modal.lessonIndex];
      if (!currentModule || !currentLesson) return;

      await saveModules(
        setModuleAt(modules, modal.moduleIndex, {
          ...currentModule,
          lessons: currentLessons.map((lesson, index) =>
            index === modal.lessonIndex ? { ...lesson, title } : lesson,
          ),
        }),
        "Lesson updated successfully.",
      );
    }
  }

  async function handleAddAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!course || !currentUser?.orgId) return;

    const data = new FormData(event.currentTarget);
    const title = data.get("title")?.toString().trim();
    const file = data.get("file");

    if (!title || !(file instanceof File) || file.size === 0) {
      setError("Please add a material title and file.");
      return;
    }

    const uploadForm = new FormData();
    uploadForm.set("title", title);
    uploadForm.set("instituteId", currentUser.orgId);
    uploadForm.set("courseId", course._id);
    uploadForm.set("file", file);

    if (assetModuleIndex !== null) {
      const moduleItem = course.modules?.[assetModuleIndex];
      const lesson =
        assetLessonIndex !== null
          ? moduleItem?.lessons?.[assetLessonIndex]
          : undefined;

      if (!moduleItem?._id || !lesson?._id) {
        setError("Select a module and one of its lessons for this material.");
        return;
      }

      uploadForm.set("moduleId", moduleItem._id);
      uploadForm.set("lessonId", lesson._id);
    }

    const description = data.get("description")?.toString().trim();
    if (description) uploadForm.set("description", description);

    try {
      setIsSaving(true);
      setError(null);
      const response = await apiFetch("/assets/upload", {
        method: "POST",
        body: uploadForm,
      });

      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Unable to add course material."),
        );
      }

      setSuccess("Course material added successfully.");
      closeModal();
      await loadCourse();
    } catch (assetError) {
      setError(
        assetError instanceof Error
          ? assetError.message
          : "Unable to add course material.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteCourse() {
    if (!course || deleteConfirmation !== course.title) return;

    try {
      setIsSaving(true);
      setError(null);
      const response = await apiFetch(`/courses/delete/${course._id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Unable to delete course."),
        );
      }

      navigate("/dashboard/courses");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete course.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteModule() {
    if (!course || modal?.type !== "delete-module") return;
    const moduleItem = course.modules?.[modal.moduleIndex];
    if (!moduleItem || deleteConfirmation !== moduleItem.title) return;

    await saveModules(
      (course.modules || []).filter((_, index) => index !== modal.moduleIndex),
      "Module deleted successfully.",
    );
  }

  async function handleDeleteLesson() {
    if (!course || modal?.type !== "delete-lesson") return;
    const moduleItem = course.modules?.[modal.moduleIndex];
    const lesson = moduleItem?.lessons?.[modal.lessonIndex];
    if (!moduleItem || !lesson || deleteConfirmation !== lesson.title) return;

    await saveModules(
      setModuleAt(course.modules || [], modal.moduleIndex, {
        ...moduleItem,
        lessons: (moduleItem.lessons || []).filter(
          (_, index) => index !== modal.lessonIndex,
        ),
      }),
      "Lesson deleted successfully.",
    );
  }

  async function handleMarkModuleComplete(moduleIndex: number) {
    if (!course) return;
    const moduleItem = course.modules?.[moduleIndex];
    if (!moduleItem) return;

    await saveModules(
      setModuleAt(course.modules || [], moduleIndex, {
        ...moduleItem,
        status: "Completed",
      }),
      "Module marked as complete.",
    );
  }

  const modules = course?.modules || [];
  const selectedModule =
    modal &&
    "moduleIndex" in modal &&
    modal.moduleIndex !== undefined &&
    course?.modules
      ? course.modules[modal.moduleIndex]
      : undefined;
  const selectedLesson =
    modal &&
    "lessonIndex" in modal &&
    modal.lessonIndex !== undefined &&
    selectedModule?.lessons
      ? selectedModule.lessons[modal.lessonIndex]
      : undefined;
  const selectedDeleteName =
    modal?.type === "delete-course"
      ? course?.title
      : modal?.type === "delete-module"
        ? selectedModule?.title
        : modal?.type === "delete-lesson"
          ? selectedLesson?.title
          : "";
  const assetModuleOptions = modules
    .map((moduleItem, index) => ({ moduleItem, index }))
    .filter(({ moduleItem }) => Boolean(moduleItem._id));
  const selectedAssetModule =
    assetModuleIndex !== null ? modules[assetModuleIndex] : undefined;
  const assetLessonOptions = (selectedAssetModule?.lessons || [])
    .map((lesson, index) => ({ lesson, index }))
    .filter(({ lesson }) => Boolean(lesson._id));

  return (
    <Stack spacing={3} sx={{ width: "100%", maxWidth: 1120 }}>
      <Link component={RouterLink} to="/dashboard/courses" underline="hover">
        Courses
      </Link>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      {isLoading ? (
        <LinearProgress />
      ) : course ? (
        <>
          <Paper
            variant="outlined"
            sx={{ p: { xs: 2, md: 3 }, borderRadius: 1 }}
          >
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "flex-start" }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, overflowWrap: "anywhere" }}
                  >
                    {course.title}
                  </Typography>
                  {course.description ? (
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                      {course.description}
                    </Typography>
                  ) : null}
                </Box>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Edit course">
                    <IconButton
                      onClick={() => setModal({ type: "edit-course" })}
                    >
                      <EditRoundedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete course">
                    <IconButton
                      color="error"
                      onClick={() => setModal({ type: "delete-course" })}
                    >
                      <DeleteOutlineRoundedIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>

              <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                <Link
                  component="button"
                  type="button"
                  underline="hover"
                  onClick={() => setModal({ type: "add-module" })}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <AddCircleOutlineRoundedIcon fontSize="small" />
                  Add Modules
                </Link>
                <Link
                  component="button"
                  type="button"
                  underline="hover"
                  onClick={() => openAssetModal()}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <PermMediaRoundedIcon fontSize="small" />
                  Course Material
                </Link>
              </Stack>
            </Stack>
          </Paper>

          {modules.length ? (
            <Stack spacing={1.5}>
              {modules.map((moduleItem, moduleIndex) => {
                const lessons = moduleItem.lessons || [];
                const moduleAssets = assets.filter(
                  (asset) => asset.moduleId === moduleItem._id,
                );
                const lessonAssets = assets.filter((asset) =>
                  lessons.some((lesson) => lesson._id === asset.lessonId),
                );
                const resourceCount = moduleAssets.length + lessonAssets.length;
                const isComplete = moduleItem.status === "Completed";

                return (
                  <Accordion
                    key={getModuleKey(moduleItem, moduleIndex)}
                    disableGutters
                    variant="outlined"
                    sx={{ borderRadius: 1, "&:before": { display: "none" } }}
                  >
                    <AccordionSummary>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ width: "100%", pr: 1 }}
                      >
                        <Typography
                          sx={{
                            flex: 1,
                            fontWeight: 700,
                            fontSize: "1.125rem",
                          }}
                        >
                          {moduleItem.title}
                        </Typography>
                        {isComplete ? (
                          <Chip
                            size="small"
                            icon={<CheckCircleOutlineRoundedIcon />}
                            label="completed"
                            variant="outlined"
                          />
                        ) : null}
                        <Tooltip title="Edit module">
                          <IconButton
                            size="small"
                            onClick={(event) => {
                              event.stopPropagation();
                              setModal({ type: "edit-module", moduleIndex });
                            }}
                          >
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete module">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(event) => {
                              event.stopPropagation();
                              setModal({ type: "delete-module", moduleIndex });
                            }}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0, pl: { xs: 3, sm: 5 } }}>
                      <Stack spacing={1.5}>
                        {lessons.length ? (
                          <Stack spacing={1}>
                            {lessons.map((lesson, lessonIndex) => {
                              const assetsForLesson = assets.filter(
                                (asset) => asset.lessonId === lesson._id,
                              );

                              return (
                                <Accordion
                                  key={getLessonKey(lesson, lessonIndex)}
                                  disableGutters
                                  variant="outlined"
                                  sx={{
                                    borderRadius: 1,
                                    "&:before": { display: "none" },
                                  }}
                                >
                                  <AccordionSummary
                                    sx={{
                                      bgcolor:
                                        lessonIndex === 0
                                          ? "primary.light"
                                          : "background.paper",
                                      color:
                                        lessonIndex === 0
                                          ? "primary.contrastText"
                                          : "text.primary",
                                    }}
                                  >
                                    <Stack
                                      direction="row"
                                      spacing={1}
                                      alignItems="center"
                                      sx={{ width: "100%", pr: 1 }}
                                    >
                                      <Typography
                                        sx={{ flex: 1, fontWeight: 600 }}
                                      >
                                        {lesson.title}
                                      </Typography>
                                      <Tooltip title="Edit lesson">
                                        <IconButton
                                          size="small"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            setModal({
                                              type: "edit-lesson",
                                              moduleIndex,
                                              lessonIndex,
                                            });
                                          }}
                                        >
                                          <EditRoundedIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Delete lesson">
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            setModal({
                                              type: "delete-lesson",
                                              moduleIndex,
                                              lessonIndex,
                                            });
                                          }}
                                        >
                                          <DeleteOutlineRoundedIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </Stack>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    {assetsForLesson.length ? (
                                      <Stack spacing={1}>
                                        {assetsForLesson.map((asset) => (
                                          <Stack
                                            key={asset._id}
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                          >
                                            <DescriptionRoundedIcon
                                              color="action"
                                              fontSize="small"
                                            />
                                            <Typography>
                                              {asset.originalFileName ||
                                                asset.title}
                                            </Typography>
                                          </Stack>
                                        ))}
                                      </Stack>
                                    ) : (
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        No assets yet
                                      </Typography>
                                    )}
                                    <Link
                                      component="button"
                                      type="button"
                                      underline="hover"
                                      onClick={() =>
                                        openAssetModal(moduleIndex, lessonIndex)
                                      }
                                      sx={{ mt: 1.5 }}
                                    >
                                      Add material
                                    </Link>
                                  </AccordionDetails>
                                </Accordion>
                              );
                            })}
                          </Stack>
                        ) : (
                          <Typography color="text.secondary">
                            No lessons yet
                          </Typography>
                        )}

                        <Divider />
                        <Stack
                          direction="row"
                          spacing={2}
                          flexWrap="wrap"
                          useFlexGap
                          alignItems="center"
                        >
                          <Chip
                            icon={<FolderRoundedIcon />}
                            label={`${lessons.length} lesson${
                              lessons.length === 1 ? "" : "s"
                            }`}
                            variant="outlined"
                          />
                          <Chip
                            icon={<DescriptionRoundedIcon />}
                            label={`${resourceCount} resource${
                              resourceCount === 1 ? "" : "s"
                            }`}
                            variant="outlined"
                          />
                          {!isComplete ? (
                            <Link
                              component="button"
                              type="button"
                              underline="hover"
                              onClick={() =>
                                handleMarkModuleComplete(moduleIndex)
                              }
                            >
                              Mark as complete
                            </Link>
                          ) : null}
                          <Link
                            component="button"
                            type="button"
                            underline="hover"
                            onClick={() =>
                              setModal({ type: "add-lesson", moduleIndex })
                            }
                          >
                            Add Lesson
                          </Link>
                        </Stack>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Stack>
          ) : (
            <Box sx={{ minHeight: 360, display: "grid", placeItems: "center" }}>
              <Typography variant="h6" color="text.secondary">
                No Modules Yet
              </Typography>
            </Box>
          )}
        </>
      ) : null}

      <Dialog
        open={modal?.type === "edit-course"}
        onClose={closeModal}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={handleEditCourse}>
          <DialogTitle>Edit Course</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <FormControl fullWidth>
                <FormLabel htmlFor="edit-title">Title</FormLabel>
                <TextField
                  id="edit-title"
                  name="title"
                  defaultValue={course?.title || ""}
                  required
                />
              </FormControl>
              <FormControl fullWidth>
                <FormLabel htmlFor="edit-description">Description</FormLabel>
                <TextField
                  id="edit-description"
                  name="description"
                  defaultValue={course?.description || ""}
                  multiline
                  minRows={3}
                />
              </FormControl>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="edit-duration">Duration</FormLabel>
                  <TextField
                    id="edit-duration"
                    name="durationWeeks"
                    type="number"
                    defaultValue={course?.durationWeeks || ""}
                  />
                </FormControl>
                <FormControl fullWidth>
                  <FormLabel htmlFor="edit-price">Price</FormLabel>
                  <TextField
                    id="edit-price"
                    name="price"
                    type="number"
                    defaultValue={course?.price || ""}
                  />
                </FormControl>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Switch
                  name="isActive"
                  defaultChecked={course?.isActive !== false}
                />
                <Typography>Active</Typography>
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSaving}>
              Save
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={modal?.type === "add-module" || modal?.type === "edit-module"}
        onClose={closeModal}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={handleModuleSubmit}>
          <DialogTitle>
            {modal?.type === "edit-module" ? "Edit Module" : "Add New Module"}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <FormControl fullWidth>
                <FormLabel htmlFor="module-title">Module Name</FormLabel>
                <TextField
                  id="module-title"
                  name="moduleTitle"
                  defaultValue={
                    modal?.type === "edit-module" ? selectedModule?.title : ""
                  }
                  required
                />
              </FormControl>
              {modal?.type === "add-module" ? (
                <FormControl fullWidth>
                  <FormLabel htmlFor="module-lessons">Lessons</FormLabel>
                  <Autocomplete
                    id="module-lessons"
                    multiple
                    freeSolo
                    options={[]}
                    value={lessonTags}
                    onChange={(_, value) =>
                      setLessonTags(normalizeLessons(value))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Type a lesson and press Enter"
                      />
                    )}
                  />
                </FormControl>
              ) : null}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSaving}>
              Save
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={modal?.type === "add-lesson" || modal?.type === "edit-lesson"}
        onClose={closeModal}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={handleLessonSubmit}>
          <DialogTitle>
            {modal?.type === "edit-lesson" ? "Edit Lesson" : "Add Lesson"}
          </DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ pt: 1 }}>
              <FormLabel htmlFor="lesson-title">Lesson Name</FormLabel>
              <TextField
                id="lesson-title"
                name="lessonTitle"
                defaultValue={
                  modal?.type === "edit-lesson" ? selectedLesson?.title : ""
                }
                required
              />
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSaving}>
              Save
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={modal?.type === "add-asset"}
        onClose={closeModal}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={handleAddAsset}>
          <DialogTitle>Course Material</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <FormControl fullWidth>
                <FormLabel htmlFor="asset-title">Title</FormLabel>
                <TextField id="asset-title" name="title" required />
              </FormControl>
              <FormControl fullWidth>
                <FormLabel htmlFor="asset-module">Module</FormLabel>
                <Autocomplete
                  id="asset-module"
                  options={assetModuleOptions}
                  value={
                    assetModuleIndex !== null
                      ? assetModuleOptions.find(
                          (option) => option.index === assetModuleIndex,
                        ) || null
                      : null
                  }
                  onChange={(_, value) => {
                    setAssetModuleIndex(value?.index ?? null);
                    setAssetLessonIndex(null);
                  }}
                  getOptionLabel={(option) => option.moduleItem.title}
                  isOptionEqualToValue={(option, value) =>
                    option.index === value.index
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select module"
                      required
                      helperText="Choose the module this material belongs to."
                    />
                  )}
                  noOptionsText="No modules found"
                />
              </FormControl>
              <FormControl fullWidth>
                <FormLabel htmlFor="asset-lesson">Lesson</FormLabel>
                <Autocomplete
                  id="asset-lesson"
                  options={assetLessonOptions}
                  value={
                    assetLessonIndex !== null
                      ? assetLessonOptions.find(
                          (option) => option.index === assetLessonIndex,
                        ) || null
                      : null
                  }
                  onChange={(_, value) => {
                    setAssetLessonIndex(value?.index ?? null);
                  }}
                  getOptionLabel={(option) => option.lesson.title}
                  isOptionEqualToValue={(option, value) =>
                    option.index === value.index
                  }
                  disabled={assetModuleIndex === null}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select lesson"
                      required
                      helperText={
                        assetModuleIndex === null
                          ? "Select a module first."
                          : "Only lessons from the selected module are listed."
                      }
                    />
                  )}
                  noOptionsText="No lessons found"
                />
              </FormControl>
              <FormControl fullWidth>
                <FormLabel htmlFor="asset-description">Description</FormLabel>
                <TextField
                  id="asset-description"
                  name="description"
                  multiline
                  minRows={3}
                />
              </FormControl>
              <FormControl fullWidth>
                <FormLabel htmlFor="asset-file">File</FormLabel>
                <TextField id="asset-file" name="file" type="file" required />
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSaving}>
              Save
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={
          modal?.type === "delete-course" ||
          modal?.type === "delete-module" ||
          modal?.type === "delete-lesson"
        }
        onClose={closeModal}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {modal?.type === "delete-course"
            ? "Delete Course"
            : modal?.type === "delete-module"
              ? "Delete Module"
              : "Delete Lesson"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography>
              Type <strong>{selectedDeleteName}</strong> to confirm deletion.
            </Typography>
            <TextField
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              autoFocus
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (modal?.type === "delete-course") void handleDeleteCourse();
              if (modal?.type === "delete-module") void handleDeleteModule();
              if (modal?.type === "delete-lesson") void handleDeleteLesson();
            }}
            disabled={isSaving || deleteConfirmation !== selectedDeleteName}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
