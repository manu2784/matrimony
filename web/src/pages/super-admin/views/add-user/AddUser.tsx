import {
  Autocomplete,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormLabel,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Form, useActionData, useNavigation } from "react-router-dom";
import type { RegisterUserActionData } from "../../../../helper/actions/registerUserAction";
import { apiFetch } from "../../../../service/apiFetch";

const roleOptions = [
  { value: "superAdmin", label: "Super Admin" },
  { value: "accountAdmin", label: "Account Admin" },
  { value: "accountManager", label: "Account Manager" },
  { value: "orgSuperAdmin", label: "Org Super Admin" },
  { value: "courseAdmin", label: "Course Admin" },
  { value: "courseManager", label: "Course Manager" },
  { value: "courseViewer", label: "Course Viewer" },
];

const orgTypeOptions = [
  { value: "provider", label: "Provider" },
  { value: "tenant", label: "Tenant" },
];

type InstituteOption = {
  id: string;
  label: string;
};

export default function AddUser() {
  const actionData = useActionData() as RegisterUserActionData | undefined;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [institutes, setInstitutes] = useState<InstituteOption[]>([]);
  const [selectedInstitute, setSelectedInstitute] =
    useState<InstituteOption | null>(null);
  const [isLoadingInstitutes, setIsLoadingInstitutes] = useState(true);
  const [institutesError, setInstitutesError] = useState<string | null>(null);

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
              .filter((institute: { _id?: string; name?: string }) => {
                return Boolean(institute?._id && institute?.name);
              })
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
              Add User
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create a new user account and submit it through the route action.
            </Typography>
          </Box>

          {actionData?.error && (
            <Alert severity="error">{actionData.error}</Alert>
          )}
          {actionData?.success && (
            <Alert severity="success">{actionData.success}</Alert>
          )}

          <Form method="post" action="/add-user">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="firstName">First Name</FormLabel>
                  <TextField
                    id="firstName"
                    name="firstName"
                    placeholder="John"
                    required
                    fullWidth
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="lastName">Last Name</FormLabel>
                  <TextField
                    id="lastName"
                    name="lastName"
                    placeholder="Doe"
                    required
                    fullWidth
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <TextField
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    required
                    fullWidth
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="username">Username</FormLabel>
                  <TextField
                    id="username"
                    name="username"
                    placeholder="johndoe"
                    required
                    fullWidth
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="org">Org</FormLabel>
                  <input
                    type="hidden"
                    name="orgId"
                    value={selectedInstitute?.id ?? ""}
                  />
                  <Autocomplete
                    id="org"
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
                        placeholder="Search institute by name"
                        required
                        error={Boolean(institutesError)}
                        helperText={
                          institutesError ||
                          "Choose an institute. The submitted value will be the institute id."
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
                        ? "Loading institutes..."
                        : "No institutes found"
                    }
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="orgType">Org Type</FormLabel>
                  <TextField
                    id="orgType"
                    name="orgType"
                    select
                    defaultValue=""
                    required
                    fullWidth
                  >
                    <MenuItem value="" disabled>
                      Select org type
                    </MenuItem>
                    {orgTypeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="roles">Roles</FormLabel>
                  <TextField
                    id="roles"
                    name="roles"
                    select
                    required
                    fullWidth
                    defaultValue={[]}
                    slotProps={{
                      select: {
                        multiple: true,
                      },
                    }}
                    helperText="You can select one or more roles."
                  >
                    {roleOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <TextField
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter a temporary password"
                    required
                    fullWidth
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
                    {isSubmitting ? "Creating User..." : "Create User"}
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
