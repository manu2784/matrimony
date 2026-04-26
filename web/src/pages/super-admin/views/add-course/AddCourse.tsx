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
import { Form, useActionData, useNavigation } from "react-router-dom";
import type { CreateCourseActionData } from "../../../../helper/actions/createCourseAction";
import { apiFetch } from "../../../../service/apiFetch";

type InstituteOption = {
  id: string;
  label: string;
};

type UserOption = {
  id: string;
  label: string;
  email: string;
};

export default function AddCourse() {
  const actionData = useActionData() as CreateCourseActionData | undefined;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const formRef = useRef<HTMLFormElement | null>(null);

  const [institutes, setInstitutes] = useState<InstituteOption[]>([]);
  const [selectedInstitute, setSelectedInstitute] =
    useState<InstituteOption | null>(null);
  const [isLoadingInstitutes, setIsLoadingInstitutes] = useState(true);
  const [institutesError, setInstitutesError] = useState<string | null>(null);

  const [courseAdmins, setCourseAdmins] = useState<UserOption[]>([]);
  const [selectedCourseAdmin, setSelectedCourseAdmin] =
    useState<UserOption | null>(null);
  const [isLoadingCourseAdmins, setIsLoadingCourseAdmins] = useState(false);
  const [courseAdminsError, setCourseAdminsError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    async function loadInstitutes() {
      try {
        setIsLoadingInstitutes(true);
        setInstitutesError(null);

        const response = await apiFetch("/institutes?limit=100");

        if (!response.ok) {
          throw new Error("Unable to load institutes.");
        }

        const result = await response.json();
        const options = Array.isArray(result?.data)
          ? result.data
              .filter((institute: { _id?: string; name?: string }) =>
                Boolean(institute?._id && institute?.name),
              )
              .map((institute: { _id: string; name: string }) => ({
                id: institute._id,
                label: institute.name,
              }))
          : [];

        if (isMounted) {
          setInstitutes(options);
        }
      } catch (error) {
        if (isMounted) {
          setInstitutes([]);
          setInstitutesError(
            error instanceof Error
              ? error.message
              : "Unable to load institutes.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingInstitutes(false);
        }
      }
    }

    loadInstitutes();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadCourseAdmins() {
      if (!selectedInstitute?.id) {
        setCourseAdmins([]);
        setSelectedCourseAdmin(null);
        setCourseAdminsError(null);
        setIsLoadingCourseAdmins(false);
        return;
      }

      try {
        setIsLoadingCourseAdmins(true);
        setCourseAdminsError(null);
        setSelectedCourseAdmin(null);

        const response = await apiFetch(
          `/users?orgId=${selectedInstitute.id}&limit=100&status=enabled`,
        );

        if (!response.ok) {
          throw new Error("Unable to load course admins.");
        }

        const result = await response.json();
        const options = Array.isArray(result?.data)
          ? result.data
              .filter(
                (user: {
                  _id?: string;
                  firstName?: string;
                  lastName?: string;
                  email?: string;
                }) => Boolean(user?._id && user?.email),
              )
              .map(
                (user: {
                  _id: string;
                  firstName?: string;
                  lastName?: string;
                  email: string;
                }) => ({
                  id: user._id,
                  label:
                    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                    user.email,
                  email: user.email,
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
            error instanceof Error
              ? error.message
              : "Unable to load course admins.",
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
  }, [selectedInstitute]);

  useEffect(() => {
    if (!actionData?.success) {
      return;
    }

    formRef.current?.reset();
    setSelectedInstitute(null);
    setSelectedCourseAdmin(null);
    setCourseAdmins([]);
    setCourseAdminsError(null);
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
              Create a course, assign an organization, and grant the selected
              course admin access to it.
            </Typography>
          </Box>

          {actionData?.error && (
            <Alert severity="error">{actionData.error}</Alert>
          )}
          {actionData?.success && (
            <Alert severity="success">{actionData.success}</Alert>
          )}

          <Form method="post" action="/add-course" ref={formRef}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="title">Course Title</FormLabel>
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
                  <FormLabel htmlFor="durationWeeks">
                    Duration in Weeks
                  </FormLabel>
                  <TextField
                    id="durationWeeks"
                    name="durationWeeks"
                    type="number"
                    placeholder="12"
                    required
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

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="instituteId">Organization</FormLabel>
                  <input
                    type="hidden"
                    name="instituteId"
                    value={selectedInstitute?.id ?? ""}
                  />
                  <Autocomplete
                    id="instituteId"
                    options={institutes}
                    value={selectedInstitute}
                    onChange={(_, value) => {
                      setSelectedInstitute(value);
                    }}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    loading={isLoadingInstitutes}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Search organization by name"
                        required
                        error={Boolean(institutesError)}
                        helperText={
                          institutesError ||
                          "Choose the organization that owns this course."
                        }
                        slotProps={{
                          input: {
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {isLoadingInstitutes ? (
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
                      isLoadingInstitutes
                        ? "Loading organizations..."
                        : "No organizations found"
                    }
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
                    disabled={!selectedInstitute}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder={
                          selectedInstitute
                            ? "Search user by name or email"
                            : "Choose an organization first"
                        }
                        required
                        error={Boolean(courseAdminsError)}
                        helperText={
                          courseAdminsError ||
                          "Only enabled users in the selected organization are listed."
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
                      selectedInstitute
                        ? isLoadingCourseAdmins
                          ? "Loading users..."
                          : "No users found"
                        : "Select an organization first"
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
