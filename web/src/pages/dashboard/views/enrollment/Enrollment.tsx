import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  FormControl,
  FormLabel,
  Grid,
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router-dom";
import type { CreateEnrollmentActionData } from "../../../../helper/actions/createEnrollmentAction";
import { apiFetch } from "../../../../service/apiFetch";
import { useAuth } from "../../../../store/context/useAuth";
import type { User } from "../../../../types/authentication/authentication-types";

type CourseOption = {
  id: string;
  label: string;
};

type PopulatedUser = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

type PopulatedCourse = {
  _id?: string;
  title?: string;
};

type EnrollmentRow = {
  id: string;
  studentName: string;
  studentEmail?: string;
  courseId: string;
  courseTitle: string;
  feePaid: number;
};

function getUserName(user: PopulatedUser | string | null | undefined) {
  if (!user || typeof user === "string") return "Unknown student";

  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return name || user.email || "Unknown student";
}

function getCourseTitle(course: PopulatedCourse | string | null | undefined) {
  if (!course || typeof course === "string") return "Unknown course";

  return course.title || "Unknown course";
}

function getCourseId(course: PopulatedCourse | string | null | undefined) {
  if (!course) return "";
  return typeof course === "string" ? course : course._id || "";
}

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

export default function Enrollment() {
  const actionData = useActionData() as CreateEnrollmentActionData | undefined;
  const navigation = useNavigation();
  const { user, hasRole } = useAuth();
  const loaderUser = useLoaderData() as User;
  const currentUser = user ?? loaderUser;
  const formRef = useRef<HTMLFormElement | null>(null);
  const isSubmitting = navigation.state === "submitting";

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseOption | null>(
    null,
  );
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(true);
  const [enrollmentsError, setEnrollmentsError] = useState<string | null>(null);
  const [localMessage, setLocalMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [editingEnrollment, setEditingEnrollment] =
    useState<EnrollmentRow | null>(null);
  const [deletingEnrollmentId, setDeletingEnrollmentId] = useState<
    string | null
  >(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const canManageEnrollments =
    hasRole("orgSuperAdmin") || hasRole("courseAdmin");

  const enrolledByLabel = useMemo(() => {
    if (!currentUser) return "";
    const name = `${currentUser.firstName || ""} ${
      currentUser.lastName || ""
    }`.trim();
    return name || currentUser.email;
  }, [currentUser]);

  const loadCourses = useCallback(async () => {
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

      setCourses(options);
    } catch (error) {
      setCourses([]);
      setCoursesError(
        error instanceof Error ? error.message : "Unable to load courses.",
      );
    } finally {
      setIsLoadingCourses(false);
    }
  }, [currentUser?.orgId]);

  const loadEnrollments = useCallback(async () => {
    if (!currentUser?.orgId) {
      setEnrollments([]);
      setEnrollmentsError("Unable to determine your organization.");
      setIsLoadingEnrollments(false);
      return;
    }

    try {
      setIsLoadingEnrollments(true);
      setEnrollmentsError(null);

      const response = await apiFetch(
        `/enrollments?instituteId=${currentUser.orgId}&limit=100`,
      );

      if (!response.ok) {
        throw new Error("Unable to load enrollments.");
      }

      const result = await response.json();
      const rows: EnrollmentRow[] = Array.isArray(result?.data)
        ? result.data
            .filter((enrollment: { _id?: string }) => Boolean(enrollment?._id))
            .map(
              (enrollment: {
                _id: string;
                studentId?: PopulatedUser | string;
                courseId?: PopulatedCourse | string;
                feePaid?: number;
              }) => ({
                id: enrollment._id,
                studentName: getUserName(enrollment.studentId),
                studentEmail:
                  typeof enrollment.studentId === "object"
                    ? enrollment.studentId?.email
                    : undefined,
                courseId: getCourseId(enrollment.courseId),
                courseTitle: getCourseTitle(enrollment.courseId),
                feePaid:
                  typeof enrollment.feePaid === "number"
                    ? enrollment.feePaid
                    : 0,
              }),
            )
        : [];

      setEnrollments(rows);
    } catch (error) {
      setEnrollments([]);
      setEnrollmentsError(
        error instanceof Error ? error.message : "Unable to load enrollments.",
      );
    } finally {
      setIsLoadingEnrollments(false);
    }
  }, [currentUser?.orgId]);

  useEffect(() => {
    loadCourses();
    loadEnrollments();
  }, [loadCourses, loadEnrollments]);

  useEffect(() => {
    if (!actionData?.success) return;

    formRef.current?.reset();
    setSelectedCourse(null);
    setEditingEnrollment(null);
    setIsFormOpen(false);
    loadEnrollments();
  }, [actionData, loadEnrollments]);

  function openCreateForm() {
    setLocalMessage(null);
    setEditingEnrollment(null);
    setSelectedCourse(null);
    formRef.current?.reset();
    setIsFormOpen((open) => !open);
  }

  function openEditForm(enrollment: EnrollmentRow) {
    setLocalMessage(null);
    setEditingEnrollment(enrollment);
    setSelectedCourse(
      courses.find((course) => course.id === enrollment.courseId) ?? {
        id: enrollment.courseId,
        label: enrollment.courseTitle,
      },
    );
    setIsFormOpen(true);
  }

  function closeForm() {
    setEditingEnrollment(null);
    setSelectedCourse(null);
    formRef.current?.reset();
    setIsFormOpen(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!editingEnrollment) return;

    event.preventDefault();
    setLocalMessage(null);

    const data = new FormData(event.currentTarget);
    const courseId = data.get("courseId")?.toString().trim();
    const feePaidValue = data.get("feePaid")?.toString().trim();
    const feePaid = feePaidValue ? Number(feePaidValue) : 0;

    if (!courseId) {
      setLocalMessage({ type: "error", text: "Please select a course." });
      return;
    }

    if (!Number.isFinite(feePaid) || feePaid < 0) {
      setLocalMessage({
        type: "error",
        text: "Fee paid must be a positive number.",
      });
      return;
    }

    try {
      setIsSavingEdit(true);

      const response = await apiFetch(
        `/enrollments/update/${editingEnrollment.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            courseId,
            feePaid,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Unable to update enrollment."),
        );
      }

      setLocalMessage({
        type: "success",
        text: "Enrollment updated successfully.",
      });
      closeForm();
      loadEnrollments();
    } catch (error) {
      setLocalMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to update enrollment.",
      });
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleDeleteEnrollment(enrollmentId: string) {
    const confirmed = window.confirm(
      "Delete this enrollment? This cannot be undone.",
    );

    if (!confirmed) return;

    try {
      setLocalMessage(null);
      setDeletingEnrollmentId(enrollmentId);

      const response = await apiFetch(`/enrollments/delete/${enrollmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Unable to delete enrollment."),
        );
      }

      setLocalMessage({
        type: "success",
        text: "Enrollment deleted successfully.",
      });
      loadEnrollments();
    } catch (error) {
      setLocalMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to delete enrollment.",
      });
    } finally {
      setDeletingEnrollmentId(null);
    }
  }

  if (!canManageEnrollments) {
    return null;
  }

  return (
    <Stack spacing={3} sx={{ width: "100%", maxWidth: 1120 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
          alignItems: { xs: "stretch", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Enrollments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enroll students and review organization course access.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={openCreateForm}
          sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
        >
          Enroll Student
        </Button>
      </Box>

      {actionData?.error && <Alert severity="error">{actionData.error}</Alert>}
      {actionData?.success && (
        <Alert severity="success">{actionData.success}</Alert>
      )}
      {localMessage && (
        <Alert severity={localMessage.type}>{localMessage.text}</Alert>
      )}

      <Collapse in={isFormOpen} unmountOnExit>
        <Box
          sx={(theme) => ({
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: { xs: 2, md: 3 },
            bgcolor: "background.paper",
            boxShadow: 1,
          })}
        >
          <Form
            key={editingEnrollment?.id ?? "create-enrollment"}
            method="post"
            action="/dashboard/enrollment"
            ref={formRef}
            onSubmit={handleSubmit}
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
                  <FormLabel htmlFor="studentName">Student Name</FormLabel>
                  <TextField
                    id="studentName"
                    name="studentName"
                    placeholder="Avery Johnson"
                    defaultValue={editingEnrollment?.studentName ?? ""}
                    required={!editingEnrollment}
                    disabled={Boolean(editingEnrollment)}
                    fullWidth
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="studentEmail">Student Email</FormLabel>
                  <TextField
                    id="studentEmail"
                    name="studentEmail"
                    type="email"
                    placeholder="avery@example.com"
                    defaultValue={editingEnrollment?.studentEmail ?? ""}
                    required={!editingEnrollment}
                    disabled={Boolean(editingEnrollment)}
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
                        placeholder="Select course"
                        required
                        error={Boolean(coursesError)}
                        helperText={coursesError || " "}
                        slotProps={{
                          input: {
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {isLoadingCourses ? (
                                  <CircularProgress color="inherit" size={20} />
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

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="enrolledBy">Enrolled By</FormLabel>
                  <TextField
                    id="enrolledBy"
                    value={
                      editingEnrollment
                        ? "Existing enrollment"
                        : enrolledByLabel
                    }
                    fullWidth
                    disabled
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="feePaid">Fee Paid</FormLabel>
                  <TextField
                    id="feePaid"
                    name="feePaid"
                    type="number"
                    placeholder="0"
                    defaultValue={editingEnrollment?.feePaid ?? ""}
                    fullWidth
                    slotProps={{
                      htmlInput: {
                        min: 0,
                        step: "0.01",
                      },
                    }}
                  />
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
                  <Button type="button" variant="outlined" onClick={closeForm}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting || isSavingEdit}
                  >
                    {editingEnrollment
                      ? isSavingEdit
                        ? "Saving Enrollment..."
                        : "Save Enrollment"
                      : isSubmitting
                        ? "Creating Enrollment..."
                        : "Create Enrollment"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Form>
        </Box>
      </Collapse>

      {enrollmentsError && <Alert severity="error">{enrollmentsError}</Alert>}

      <Box
        sx={(theme) => ({
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          bgcolor: "background.paper",
          overflow: "hidden",
        })}
      >
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Course/Courses</TableCell>
                <TableCell>Payment Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoadingEnrollments ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <CircularProgress size={20} />
                      <Typography variant="body2">
                        Loading enrollments...
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : enrollments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No enrollments found.
                  </TableCell>
                </TableRow>
              ) : (
                enrollments.map((enrollment) => {
                  const isPaid = enrollment.feePaid > 0;

                  return (
                    <TableRow key={enrollment.id} hover>
                      <TableCell>
                        <Stack spacing={0.25}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {enrollment.studentName}
                          </Typography>
                          {enrollment.studentEmail ? (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {enrollment.studentEmail}
                            </Typography>
                          ) : null}
                        </Stack>
                      </TableCell>
                      <TableCell>{enrollment.courseTitle}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={isPaid ? "success" : "warning"}
                          label={isPaid ? "Paid" : "Pending"}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end"
                        >
                          <Button
                            variant="outlined"
                            startIcon={<EditRoundedIcon />}
                            onClick={() => openEditForm(enrollment)}
                          >
                            Edit
                          </Button>
                          <Button
                            color="error"
                            variant="outlined"
                            startIcon={<DeleteOutlineIcon />}
                            onClick={() => {
                              void handleDeleteEnrollment(enrollment.id);
                            }}
                            disabled={deletingEnrollmentId === enrollment.id}
                          >
                            {deletingEnrollmentId === enrollment.id
                              ? "Deleting..."
                              : "Delete"}
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Stack>
  );
}
