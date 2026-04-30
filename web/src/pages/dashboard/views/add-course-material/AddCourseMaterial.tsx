import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import { useEffect, useRef, useState } from "react";
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

export default function AddCourseMaterial() {
  const actionData = useActionData() as
    | CreateCourseMaterialActionData
    | undefined;
  const navigation = useNavigation();
  const { user, hasRole } = useAuth();
  const loaderUser = useLoaderData() as User;
  const currentUser = user ?? loaderUser;
  const isSubmitting = navigation.state === "submitting";
  const formRef = useRef<HTMLFormElement | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseOption | null>(
    null,
  );
  const [selectedFileName, setSelectedFileName] = useState("");
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const canAddCourseMaterial =
    hasRole("orgSuperAdmin") || hasRole("courseAdmin");

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
    if (!actionData?.success) {
      return;
    }

    formRef.current?.reset();
    setSelectedCourse(null);
    setSelectedFileName("");
  }, [actionData]);

  if (!canAddCourseMaterial) {
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
              Add Course Material
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Upload videos, documents, images, and slides for your
              organization.
            </Typography>
          </Box>

          {actionData?.error && (
            <Alert severity="error">{actionData.error}</Alert>
          )}
          {actionData?.success && (
            <Alert severity="success">{actionData.success}</Alert>
          )}

          <Form
            method="post"
            action="/dashboard/add-course-material"
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
                  <FormLabel htmlFor="title">Title</FormLabel>
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

              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="description">Description</FormLabel>
                  <TextField
                    id="description"
                    name="description"
                    placeholder="Add a short note for students or instructors"
                    multiline
                    minRows={4}
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
                    Images up to 5MB, PDFs up to 20MB, slides up to 30MB, videos
                    up to 200MB.
                  </FormHelperText>
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
                    {isSubmitting ? "Uploading Material..." : "Upload Material"}
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
