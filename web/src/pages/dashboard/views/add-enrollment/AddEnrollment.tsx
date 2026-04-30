import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormLabel,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
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

export default function AddEnrollment() {
  const actionData = useActionData() as CreateEnrollmentActionData | undefined;
  const navigation = useNavigation();
  const { user, hasRole } = useAuth();
  const loaderUser = useLoaderData() as User;
  const currentUser = user ?? loaderUser;
  const formRef = useRef<HTMLFormElement | null>(null);
  const isSubmitting = navigation.state === "submitting";
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseOption | null>(
    null,
  );
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const canCreateEnrollment =
    hasRole("orgSuperAdmin") || hasRole("courseAdmin");

  const enrolledByLabel = useMemo(() => {
    if (!currentUser) return "";
    const name = `${currentUser.firstName || ""} ${
      currentUser.lastName || ""
    }`.trim();
    return name || currentUser.email;
  }, [currentUser]);

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
    if (!actionData?.success) return;
    formRef.current?.reset();
    setSelectedCourse(null);
  }, [actionData]);

  if (!canCreateEnrollment) {
    return null;
  }

  return (
    <Card
      variant="outlined"
      sx={{
        width: "100%",
        maxWidth: 900,
        borderRadius: 1,
        boxShadow: 3,
      }}
    >
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Add Enrollment
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create a student account and enroll them into a course.
            </Typography>
          </Box>

          {actionData?.error && (
            <Alert severity="error">{actionData.error}</Alert>
          )}
          {actionData?.success && (
            <Alert severity="success">{actionData.success}</Alert>
          )}

          <Form method="post" action="/dashboard/add-enrollment" ref={formRef}>
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
                    required
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
                    required
                    fullWidth
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="courseId">Course ID</FormLabel>
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
                        helperText={coursesError || selectedCourse?.id || " "}
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
                    value={enrolledByLabel}
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
                  sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}
                >
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? "Creating Enrollment..."
                      : "Create Enrollment"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Form>
        </Stack>
      </CardContent>
    </Card>
  );
}
