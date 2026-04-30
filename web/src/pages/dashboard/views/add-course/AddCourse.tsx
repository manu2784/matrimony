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
import { useEffect, useRef, useState } from "react";
import {
  Form,
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

export default function AddCourse() {
  const actionData = useActionData() as CreateOrgCourseActionData | undefined;
  const navigation = useNavigation();
  const { user } = useAuth();
  const loaderUser = useLoaderData() as User;
  const currentUser = user ?? loaderUser;
  const isSubmitting = navigation.state === "submitting";
  const formRef = useRef<HTMLFormElement | null>(null);

  const [courseAdmins, setCourseAdmins] = useState<UserOption[]>([]);
  const [selectedCourseAdmin, setSelectedCourseAdmin] =
    useState<UserOption | null>(null);
  const [isLoadingCourseAdmins, setIsLoadingCourseAdmins] = useState(true);
  const [courseAdminsError, setCourseAdminsError] = useState<string | null>(
    null,
  );

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
    if (!actionData?.success) {
      return;
    }

    formRef.current?.reset();
    setSelectedCourseAdmin(null);
  }, [actionData]);

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
              Add Course
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create a course for your organization and assign a course admin.
            </Typography>
          </Box>

          {actionData?.error && (
            <Alert severity="error">{actionData.error}</Alert>
          )}
          {actionData?.success && (
            <Alert severity="success">{actionData.success}</Alert>
          )}

          <Form method="post" action="/dashboard/add-course" ref={formRef}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="title">Title</FormLabel>
                  <TextField
                    id="title"
                    name="title"
                    placeholder="Frontend Engineering Fundamentals"
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

              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="description">Description</FormLabel>
                  <TextField
                    id="description"
                    name="description"
                    placeholder="Add a short overview of the course"
                    multiline
                    minRows={4}
                    fullWidth
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12 }}>
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
                        placeholder="Search user by name or email"
                        required
                        error={Boolean(courseAdminsError)}
                        helperText={
                          courseAdminsError ||
                          "Only enabled users from your organization are listed."
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

              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}
                >
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
        </Stack>
      </CardContent>
    </Card>
  );
}
