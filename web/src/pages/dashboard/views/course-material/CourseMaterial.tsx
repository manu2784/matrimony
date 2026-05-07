import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router-dom";
import type { CreateCourseMaterialActionData } from "../../../../helper/actions/createCourseMaterialAction";
import { apiFetch } from "../../../../service/apiFetch";
import { useAuth } from "../../../../store/context/useAuth";
import type { User } from "../../../../types/authentication/authentication-types";

type CourseOption = {
  id: string;
  label: string;
};

type PopulatedUser = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

type PopulatedCourse = {
  _id?: string;
  title?: string;
};

type CourseMaterialAsset = {
  _id: string;
  title: string;
  description?: string;
  type?: string;
  courseId?: string | PopulatedCourse | null;
  ownerId?: string | PopulatedUser | null;
  originalFileName?: string;
};

const ACCEPTED_FILE_TYPES = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".mp4",
  ".webm",
  ".mov",
  ".pdf",
  ".ppt",
  ".pptx",
].join(",");

const ALL_COURSES_OPTION: CourseOption = {
  id: "all",
  label: "All courses",
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

function getCourseId(asset: CourseMaterialAsset) {
  if (!asset.courseId) return "";
  return typeof asset.courseId === "string"
    ? asset.courseId
    : asset.courseId._id || "";
}

function getCourseTitle(asset: CourseMaterialAsset) {
  if (!asset.courseId) return "Organization-wide";
  if (typeof asset.courseId === "string") return "Selected course";
  return asset.courseId.title || "Selected course";
}

function getUploaderFirstName(asset: CourseMaterialAsset) {
  if (!asset.ownerId || typeof asset.ownerId === "string") return "";
  return asset.ownerId.firstName || asset.ownerId.email || "";
}

function getMaterialName(asset: CourseMaterialAsset) {
  return asset.title || asset.originalFileName || "Untitled material";
}

export default function CourseMaterial() {
  const actionData = useActionData() as
    | CreateCourseMaterialActionData
    | undefined;
  const navigation = useNavigation();
  const { user, hasRole } = useAuth();
  const loaderUser = useLoaderData() as User;
  const currentUser = user ?? loaderUser;
  const isSubmitting = navigation.state === "submitting";
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseOption | null>(
    null,
  );
  const [filterCourse, setFilterCourse] =
    useState<CourseOption>(ALL_COURSES_OPTION);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [materials, setMaterials] = useState<CourseMaterialAsset[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [materialsError, setMaterialsError] = useState<string | null>(null);
  const [editingMaterial, setEditingMaterial] =
    useState<CourseMaterialAsset | null>(null);
  const [editCourse, setEditCourse] = useState<CourseOption | null>(null);
  const [editError, setEditError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingMaterialId, setDeletingMaterialId] = useState<string | null>(
    null,
  );
  const canManageCourseMaterial =
    hasRole("orgSuperAdmin") ||
    hasRole("courseAdmin") ||
    hasRole("courseManager");

  const loadMaterials = useCallback(async () => {
    if (!currentUser?.orgId) {
      setMaterials([]);
      setMaterialsError("Unable to determine your organization.");
      setIsLoadingMaterials(false);
      return;
    }

    try {
      setIsLoadingMaterials(true);
      setMaterialsError(null);

      const response = await apiFetch(
        `/assets?instituteId=${currentUser.orgId}&limit=500&status=active`,
      );

      if (!response.ok) {
        throw new Error("Unable to load course materials.");
      }

      const result = await response.json();
      setMaterials(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      setMaterials([]);
      setMaterialsError(
        error instanceof Error
          ? error.message
          : "Unable to load course materials.",
      );
    } finally {
      setIsLoadingMaterials(false);
    }
  }, [currentUser?.orgId]);

  useEffect(() => {
    let isMounted = true;

    async function loadCourses() {
      if (!currentUser?.orgId) {
        setCourses([]);
        setCoursesError("Unable to determine your organization.");
        setIsLoadingCourses(false);
        return;
      }

      try {
        setIsLoadingCourses(true);
        setCoursesError(null);

        const response = await apiFetch(
          `/courses?instituteId=${currentUser.orgId}&limit=100&isActive=true`,
        );

        if (!response.ok) {
          throw new Error("Unable to load courses.");
        }

        const result = await response.json();
        const options = Array.isArray(result?.data)
          ? result.data
              .filter((course: { _id?: string; title?: string }) =>
                Boolean(course?._id && course?.title),
              )
              .map((course: { _id: string; title: string }) => ({
                id: course._id,
                label: course.title,
              }))
          : [];

        if (isMounted) {
          setCourses(options);
        }
      } catch (error) {
        if (isMounted) {
          setCourses([]);
          setCoursesError(
            error instanceof Error ? error.message : "Unable to load courses.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingCourses(false);
        }
      }
    }

    loadCourses();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.orgId]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  useEffect(() => {
    if (!actionData?.success) {
      return;
    }

    formRef.current?.reset();
    setSelectedCourse(null);
    setSelectedFileName("");
    setIsFormOpen(false);
    loadMaterials();
  }, [actionData, loadMaterials]);

  useEffect(() => {
    if (!editingMaterial) {
      setEditCourse(null);
      setEditError("");
      return;
    }

    const courseId = getCourseId(editingMaterial);
    setEditCourse(courses.find((course) => course.id === courseId) ?? null);
  }, [courses, editingMaterial]);

  async function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingMaterial) {
      return;
    }

    const data = new FormData(event.currentTarget);
    const title = data.get("title")?.toString().trim();
    const description = data.get("description")?.toString().trim();

    if (!title) {
      setEditError("Please add a material name.");
      return;
    }

    setIsSavingEdit(true);
    setEditError("");

    const response = await apiFetch(`/assets/update/${editingMaterial._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || "",
        courseId: editCourse?.id || "",
      }),
    });

    if (!response.ok) {
      setEditError(
        await readErrorMessage(response, "Unable to update course material."),
      );
      setIsSavingEdit(false);
      return;
    }

    setIsSavingEdit(false);
    setEditingMaterial(null);
    await loadMaterials();
  }

  async function handleDeleteMaterial(material: CourseMaterialAsset) {
    const confirmed = window.confirm(
      `Delete "${getMaterialName(material)}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingMaterialId(material._id);
    setMaterialsError(null);

    const response = await apiFetch(
      `/assets/delete/${material._id}?deleteFromS3=true`,
      { method: "DELETE" },
    );

    if (!response.ok) {
      setMaterialsError(
        await readErrorMessage(response, "Unable to delete course material."),
      );
      setDeletingMaterialId(null);
      return;
    }

    setDeletingMaterialId(null);
    await loadMaterials();
  }

  const visibleMaterials =
    filterCourse.id === ALL_COURSES_OPTION.id
      ? materials
      : materials.filter(
          (material) => getCourseId(material) === filterCourse.id,
        );

  if (!canManageCourseMaterial) {
    return null;
  }

  return (
    <Stack spacing={3} sx={{ width: "100%" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Course Material
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage videos, documents, images, and slides for your organization.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<CloudUploadRoundedIcon />}
          onClick={() => setIsFormOpen((value) => !value)}
        >
          Add course Material
        </Button>
      </Stack>

      {actionData?.error && <Alert severity="error">{actionData.error}</Alert>}
      {actionData?.success && (
        <Alert severity="success">{actionData.success}</Alert>
      )}
      {materialsError && <Alert severity="error">{materialsError}</Alert>}

      {isFormOpen && (
        <Card variant="outlined" sx={{ borderRadius: 1 }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Form
              method="post"
              action="/dashboard/course-material"
              encType="multipart/form-data"
              ref={formRef}
            >
              <input
                type="hidden"
                name="instituteId"
                value={currentUser?.orgId ?? ""}
              />
              <input
                type="hidden"
                name="courseId"
                value={selectedCourse?.id ?? ""}
              />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <FormLabel htmlFor="title">Material Name</FormLabel>
                    <TextField
                      id="title"
                      name="title"
                      placeholder="Week 1 orientation video"
                      required
                      fullWidth
                    />
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <FormLabel htmlFor="courseId">Course</FormLabel>
                    <Autocomplete
                      id="courseId"
                      options={courses}
                      value={selectedCourse}
                      onChange={(_, value) => {
                        setSelectedCourse(value);
                      }}
                      getOptionLabel={(option) => option.label}
                      isOptionEqualToValue={(option, value) =>
                        option.id === value.id
                      }
                      loading={isLoadingCourses}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Optional"
                          error={Boolean(coursesError)}
                          helperText={
                            coursesError ||
                            "Leave blank to make this organization-wide material."
                          }
                          slotProps={{
                            input: {
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {isLoadingCourses ? (
                                    <CircularProgress
                                      color="inherit"
                                      size={20}
                                    />
                                  ) : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            },
                          }}
                        />
                      )}
                      noOptionsText={
                        isLoadingCourses
                          ? "Loading courses..."
                          : "No courses found"
                      }
                    />
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <FormLabel htmlFor="description">Description</FormLabel>
                    <TextField
                      id="description"
                      name="description"
                      placeholder="Add a short note for students or instructors"
                      multiline
                      minRows={3}
                      fullWidth
                    />
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth required>
                    <FormLabel htmlFor="file">Material File</FormLabel>
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<CloudUploadRoundedIcon />}
                      sx={{
                        justifyContent: "flex-start",
                        minHeight: 48,
                        borderRadius: 1,
                      }}
                    >
                      {selectedFileName || "Select file"}
                      <input
                        id="file"
                        name="file"
                        type="file"
                        accept={ACCEPTED_FILE_TYPES}
                        required
                        hidden
                        onChange={(event) => {
                          setSelectedFileName(
                            event.target.files?.[0]?.name ?? "",
                          );
                        }}
                      />
                    </Button>
                    <FormHelperText>
                      Images up to 5MB, PDFs up to 20MB, slides up to 30MB,
                      videos up to 200MB.
                    </FormHelperText>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 1,
                      mt: 1,
                    }}
                  >
                    <Button
                      type="button"
                      variant="text"
                      onClick={() => setIsFormOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? "Uploading Material..."
                        : "Upload Material"}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Form>
          </CardContent>
        </Card>
      )}

      <Paper variant="outlined" sx={{ width: "100%", borderRadius: 1 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{
            p: 2,
            alignItems: { md: "center" },
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6">Materials</Typography>
          <Autocomplete
            size="small"
            options={[ALL_COURSES_OPTION, ...courses]}
            value={filterCourse}
            onChange={(_, value) => {
              setFilterCourse(value ?? ALL_COURSES_OPTION);
            }}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            sx={{ width: { xs: "100%", md: 280 } }}
            renderInput={(params) => (
              <TextField {...params} label="Filter by course" />
            )}
          />
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name of the material</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Uploaded by</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoadingMaterials ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center", py: 3 }}
                    >
                      <CircularProgress size={20} />
                      <Typography color="text.secondary">
                        Loading course materials...
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : visibleMaterials.length ? (
                visibleMaterials.map((material) => (
                  <TableRow key={material._id} hover>
                    <TableCell>{getMaterialName(material)}</TableCell>
                    <TableCell sx={{ textTransform: "capitalize" }}>
                      {material.type || "other"}
                    </TableCell>
                    <TableCell>{getCourseTitle(material)}</TableCell>
                    <TableCell>
                      {getUploaderFirstName(material) || "-"}
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={1.5}
                        sx={{ justifyContent: "flex-end" }}
                      >
                        <Link
                          component="button"
                          type="button"
                          underline="hover"
                          onClick={() => setEditingMaterial(material)}
                        >
                          Edit
                        </Link>
                        <Link
                          component="button"
                          type="button"
                          color="error"
                          underline="hover"
                          disabled={deletingMaterialId === material._id}
                          onClick={() => handleDeleteMaterial(material)}
                        >
                          {deletingMaterialId === material._id
                            ? "Deleting..."
                            : "Delete"}
                        </Link>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color="text.secondary" sx={{ py: 3 }}>
                      No course materials found.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={Boolean(editingMaterial)}
        onClose={() => setEditingMaterial(null)}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={handleEditSubmit}>
          <DialogTitle>Edit Course Material</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {editError && <Alert severity="error">{editError}</Alert>}
              <FormControl fullWidth>
                <FormLabel htmlFor="edit-title">Material Name</FormLabel>
                <TextField
                  id="edit-title"
                  name="title"
                  defaultValue={editingMaterial?.title ?? ""}
                  required
                />
              </FormControl>
              <FormControl fullWidth>
                <FormLabel htmlFor="edit-course">Course</FormLabel>
                <Autocomplete
                  id="edit-course"
                  options={courses}
                  value={editCourse}
                  onChange={(_, value) => setEditCourse(value)}
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Organization-wide"
                      helperText="Leave blank to make this organization-wide material."
                    />
                  )}
                />
              </FormControl>
              <FormControl fullWidth>
                <FormLabel htmlFor="edit-description">Description</FormLabel>
                <TextField
                  id="edit-description"
                  name="description"
                  defaultValue={editingMaterial?.description ?? ""}
                  multiline
                  minRows={3}
                />
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingMaterial(null)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSavingEdit}>
              {isSavingEdit ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
}
