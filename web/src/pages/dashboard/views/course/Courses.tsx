import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  FormControl,
  FormLabel,
  Grid,
  LinearProgress,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Form,
  Link as RouterLink,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router-dom";
import type { CreateOrgCourseActionData } from "../../../../helper/actions/createOrgCourseAction";
import { apiFetch } from "../../../../service/apiFetch";
import { useAuth } from "../../../../store/context/useAuth";
import type { User } from "../../../../types/authentication/authentication-types";

type UserOption = {
  id: string;
  label: string;
  email: string;
};

type CourseTile = {
  id: string;
  title: string;
  description?: string;
  durationWeeks?: number;
  isActive?: boolean;
  modulesCount: number;
  createdAt?: string;
  studentCount?: number;
};

function getCourseMeta(course: CourseTile) {
  const meta = [];

  if (course.durationWeeks) {
    meta.push(
      `${course.durationWeeks} week${course.durationWeeks === 1 ? "" : "s"}`,
    );
  }

  if (course.modulesCount > 0) {
    meta.push(
      `${course.modulesCount} module${course.modulesCount === 1 ? "" : "s"}`,
    );
  }

  if (course.createdAt) {
    meta.push(
      new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(course.createdAt)),
    );
  }

  return meta;
}

export default function Courses() {
  const actionData = useActionData() as CreateOrgCourseActionData | undefined;
  const navigation = useNavigation();
  const { user, hasRole } = useAuth();
  const loaderUser = useLoaderData() as User;
  const currentUser = user ?? loaderUser;
  const isSubmitting = navigation.state === "submitting";
  const formRef = useRef<HTMLFormElement | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [courses, setCourses] = useState<CourseTile[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [courseAdmins, setCourseAdmins] = useState<UserOption[]>([]);
  const [selectedCourseAdmin, setSelectedCourseAdmin] =
    useState<UserOption | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [isLoadingCourseAdmins, setIsLoadingCourseAdmins] = useState(true);
  const [courseAdminsError, setCourseAdminsError] = useState<string | null>(
    null,
  );
  const canManageCourses =
    hasRole("orgSuperAdmin") ||
    hasRole("courseAdmin") ||
    hasRole("courseManager");

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
      const courseRows: CourseTile[] = Array.isArray(result?.data)
        ? result.data
            .filter((course: { _id?: string; title?: string }) =>
              Boolean(course?._id && course?.title),
            )
            .map(
              (course: {
                _id: string;
                title: string;
                description?: string;
                durationWeeks?: number;
                isActive?: boolean;
                modules?: unknown[];
                createdAt?: string;
              }) => ({
                id: course._id,
                title: course.title,
                description: course.description,
                durationWeeks: course.durationWeeks,
                isActive: course.isActive,
                modulesCount: Array.isArray(course.modules)
                  ? course.modules.length
                  : 0,
                createdAt: course.createdAt,
              }),
            )
        : [];

      const coursesWithStudentCounts = await Promise.all(
        courseRows.map(async (course) => {
          try {
            const enrollmentResponse = await apiFetch(
              `/enrollments?courseId=${course.id}&limit=1`,
            );

            if (!enrollmentResponse.ok) {
              return course;
            }

            const enrollmentResult = await enrollmentResponse.json();
            const total = enrollmentResult?.pagination?.total;

            return {
              ...course,
              studentCount: typeof total === "number" ? total : undefined,
            };
          } catch {
            return course;
          }
        }),
      );

      setCourses(coursesWithStudentCounts);
    } catch (error) {
      setCourses([]);
      setCoursesError(
        error instanceof Error ? error.message : "Unable to load courses.",
      );
    } finally {
      setIsLoadingCourses(false);
    }
  }, [currentUser?.orgId]);

  useEffect(() => {
    let isMounted = true;

    async function loadCourseAdmins() {
      if (!currentUser?.orgId) {
        setCourseAdmins([]);
        setCourseAdminsError("Unable to determine your organization.");
        setIsLoadingCourseAdmins(false);
        return;
      }

      try {
        setIsLoadingCourseAdmins(true);
        setCourseAdminsError(null);

        const response = await apiFetch(
          `/users?orgId=${currentUser.orgId}&limit=100&status=enabled`,
        );

        if (!response.ok) {
          throw new Error("Unable to load users.");
        }

        const result = await response.json();
        const options = Array.isArray(result?.data)
          ? result.data
              .filter(
                (nextUser: {
                  _id?: string;
                  firstName?: string;
                  lastName?: string;
                  email?: string;
                }) => Boolean(nextUser?._id && nextUser?.email),
              )
              .map(
                (nextUser: {
                  _id: string;
                  firstName?: string;
                  lastName?: string;
                  email: string;
                }) => ({
                  id: nextUser._id,
                  label:
                    `${nextUser.firstName || ""} ${
                      nextUser.lastName || ""
                    }`.trim() || nextUser.email,
                  email: nextUser.email,
                }),
              )
          : [];

        if (isMounted) {
          setCourseAdmins(options);
        }
      } catch (error) {
        if (isMounted) {
          setCourseAdmins([]);
          setCourseAdminsError(
            error instanceof Error ? error.message : "Unable to load users.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingCourseAdmins(false);
        }
      }
    }

    loadCourseAdmins();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.orgId]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    if (!actionData?.success) {
      return;
    }

    formRef.current?.reset();
    setSelectedCourseAdmin(null);
    setSelectedModules([]);
    setIsFormOpen(false);
    loadCourses();
  }, [actionData, loadCourses]);

  if (!canManageCourses) {
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
            Courses
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create courses and review the active course catalog.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => setIsFormOpen((open) => !open)}
          sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
        >
          Add Course
        </Button>
      </Box>

      {actionData?.error && <Alert severity="error">{actionData.error}</Alert>}
      {actionData?.success && (
        <Alert severity="success">{actionData.success}</Alert>
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
          <Form method="post" ref={formRef}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="title">Title</FormLabel>
                  <TextField
                    id="title"
                    name="title"
                    placeholder="Mathematics 1"
                    required
                    fullWidth
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="durationWeeks">Duration</FormLabel>
                  <TextField
                    id="durationWeeks"
                    name="durationWeeks"
                    type="number"
                    placeholder="12"
                    fullWidth
                    slotProps={{
                      htmlInput: {
                        min: 1,
                      },
                    }}
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="courseAdminId">Course Admin</FormLabel>
                  <input
                    type="hidden"
                    name="courseAdminId"
                    value={selectedCourseAdmin?.id ?? ""}
                  />
                  <Autocomplete
                    id="courseAdminId"
                    options={courseAdmins}
                    value={selectedCourseAdmin}
                    onChange={(_, value) => {
                      setSelectedCourseAdmin(value);
                    }}
                    getOptionLabel={(option) =>
                      option.email
                        ? `${option.label} (${option.email})`
                        : option.label
                    }
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    loading={isLoadingCourseAdmins}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Search user"
                        required
                        error={Boolean(courseAdminsError)}
                        helperText={
                          courseAdminsError ||
                          "Enabled users from your organization are listed."
                        }
                        slotProps={{
                          input: {
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {isLoadingCourseAdmins ? (
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
                      isLoadingCourseAdmins
                        ? "Loading users..."
                        : "No users found"
                    }
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="modules">Modules</FormLabel>
                  {selectedModules.map((moduleTitle) => (
                    <input
                      key={moduleTitle}
                      type="hidden"
                      name="modules"
                      value={moduleTitle}
                    />
                  ))}
                  <Autocomplete
                    id="modules"
                    multiple
                    freeSolo
                    options={[]}
                    value={selectedModules}
                    onChange={(_, value) => {
                      const normalizedModules = value
                        .map((moduleTitle) => moduleTitle.trim())
                        .filter(Boolean);

                      setSelectedModules(
                        Array.from(new Set(normalizedModules)),
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Type a module and press Enter"
                        helperText="Each tag is saved as a module title."
                      />
                    )}
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="description">Description</FormLabel>
                  <TextField
                    id="description"
                    name="description"
                    placeholder="Short overview"
                    multiline
                    minRows={3}
                    fullWidth
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
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => setIsFormOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating Course..." : "Create Course"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Form>
        </Box>
      </Collapse>

      {coursesError && <Alert severity="error">{coursesError}</Alert>}

      <Grid container spacing={3}>
        {isLoadingCourses
          ? Array.from({ length: 6 }).map((_, index) => (
              <Grid key={index} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Card variant="outlined" sx={{ borderRadius: 1, height: 188 }}>
                  <CardContent>
                    <Skeleton width="70%" height={34} />
                    <Skeleton width="52%" />
                    <Skeleton width="84%" />
                    <Skeleton width="100%" sx={{ mt: 4 }} />
                  </CardContent>
                </Card>
              </Grid>
            ))
          : courses.map((course) => {
              const meta = getCourseMeta(course);
              const progress = course.studentCount
                ? Math.min(100, Math.max(8, course.studentCount * 8))
                : 8;

              return (
                <Grid key={course.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 1,
                      height: "100%",
                      minHeight: 188,
                      display: "flex",
                    }}
                  >
                    <CardActionArea
                      component={RouterLink}
                      to={`/dashboard/courses/${course.id}`}
                      sx={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "stretch",
                      }}
                    >
                      <CardContent
                        sx={{
                          width: "100%",
                          display: "flex",
                          flexDirection: "column",
                          gap: 1.25,
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              flex: 1,
                              overflowWrap: "anywhere",
                            }}
                          >
                            {course.title}
                          </Typography>
                          <Chip
                            size="small"
                            color={
                              course.isActive === false ? "default" : "success"
                            }
                            icon={<CheckCircleRoundedIcon />}
                            label={
                              course.isActive === false ? "Inactive" : "Active"
                            }
                          />
                        </Stack>

                        {course.description ? (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {course.description}
                          </Typography>
                        ) : null}

                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          {meta.map((item) => (
                            <Chip
                              key={item}
                              size="small"
                              variant="outlined"
                              icon={<ScheduleRoundedIcon />}
                              label={item}
                            />
                          ))}
                        </Stack>

                        <Box sx={{ mt: "auto" }}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            spacing={1}
                          >
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={0.75}
                            >
                              <GroupRoundedIcon
                                color="action"
                                sx={{ fontSize: 18 }}
                              />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {typeof course.studentCount === "number"
                                  ? `Student ${course.studentCount}`
                                  : "Students"}
                              </Typography>
                            </Stack>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {course.id.slice(-6)}
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                              mt: 1,
                              height: 8,
                              borderRadius: 1,
                            }}
                          />
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
      </Grid>

      {!isLoadingCourses && courses.length === 0 && !coursesError ? (
        <Box
          sx={(theme) => ({
            border: `1px dashed ${theme.palette.divider}`,
            borderRadius: 1,
            p: 4,
            textAlign: "center",
            bgcolor: "background.paper",
          })}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            No courses yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add the first course to start building the catalog.
          </Typography>
        </Box>
      ) : null}
    </Stack>
  );
}
