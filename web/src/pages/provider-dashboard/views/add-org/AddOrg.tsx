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
import type { CreateInstituteActionData } from "../../../../helper/actions/createInstituteAction";
import { apiFetch } from "../../../../service/apiFetch";

const statusOptions = [
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

type UserOption = {
  id: string;
  label: string;
};

export default function AddOrg() {
  const actionData = useActionData() as CreateInstituteActionData | undefined;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [accountManagers, setAccountManagers] = useState<UserOption[]>([]);
  const [selectedAccountManager, setSelectedAccountManager] =
    useState<UserOption | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAccountManagers() {
      try {
        setIsLoadingUsers(true);
        setUsersError(null);

        const response = await apiFetch("/users?limit=100");

        if (!response.ok) {
          throw new Error("Unable to load account managers.");
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
                  orgType?: string;
                }) => user?._id && user?.email && user?.orgType === "provider",
              )
              .map(
                (user: {
                  _id: string;
                  firstName?: string;
                  lastName?: string;
                  email: string;
                }) => {
                  const fullName = [user.firstName, user.lastName]
                    .filter(Boolean)
                    .join(" ")
                    .trim();

                  return {
                    id: user._id,
                    label: fullName
                      ? `${fullName} (${user.email})`
                      : user.email,
                  };
                },
              )
          : [];

        if (isMounted) {
          setAccountManagers(options);
        }
      } catch (error) {
        if (isMounted) {
          setAccountManagers([]);
          setUsersError(
            error instanceof Error
              ? error.message
              : "Unable to load account managers.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingUsers(false);
        }
      }
    }

    loadAccountManagers();

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
              Add Organization
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create a new organization and submit it through the route action.
            </Typography>
          </Box>

          {actionData?.error && (
            <Alert severity="error">{actionData.error}</Alert>
          )}
          {actionData?.success && (
            <Alert severity="success">{actionData.success}</Alert>
          )}

          <Form method="post" action="/add-org">
            <input
              type="hidden"
              name="accountManager"
              value={selectedAccountManager?.id ?? ""}
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="name">Organization Name</FormLabel>
                  <TextField
                    id="name"
                    name="name"
                    placeholder="Acme Institute"
                    required
                    fullWidth
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="accountManager">
                    Account Manager
                  </FormLabel>
                  <Autocomplete
                    id="accountManager"
                    options={accountManagers}
                    value={selectedAccountManager}
                    onChange={(_, value) => {
                      setSelectedAccountManager(value);
                    }}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    loading={isLoadingUsers}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select an account manager"
                        required
                        error={Boolean(usersError)}
                        helperText={
                          usersError ||
                          "Only users with org type provider are shown."
                        }
                        slotProps={{
                          input: {
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {isLoadingUsers ? (
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
                      isLoadingUsers
                        ? "Loading account managers..."
                        : "No provider users found"
                    }
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="isActive">Status</FormLabel>
                  <TextField
                    id="isActive"
                    name="isActive"
                    select
                    defaultValue="true"
                    required
                    fullWidth
                  >
                    {statusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="description">Description</FormLabel>
                  <TextField
                    id="description"
                    name="description"
                    placeholder="Add a short description for this organization"
                    multiline
                    minRows={4}
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
                    {isSubmitting
                      ? "Creating Organization..."
                      : "Create Organization"}
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
