import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Collapse,
  FormControl,
  FormLabel,
  Grid,
  MenuItem,
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
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useLoaderData } from "react-router-dom";
import { apiFetch } from "../../service/apiFetch";
import { useAuth } from "../../store/context/useAuth";
import type { User } from "../../types/authentication/authentication-types";

type DashboardMode = "provider" | "tenant";

type Option = {
  id: string;
  label: string;
};

type RoleOption = {
  value: string;
  label: string;
};

type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  username: string;
  orgId: string;
  orgType: string;
  roles: string[];
};

type UserManagementProps = {
  mode: DashboardMode;
};

const providerRoleOptions: RoleOption[] = [
  { value: "superAdmin", label: "Super Admin" },
  { value: "accountAdmin", label: "Account Admin" },
  { value: "accountManager", label: "Account Manager" },
  { value: "orgSuperAdmin", label: "Org Super Admin" },
  { value: "courseAdmin", label: "Course Admin" },
  { value: "courseManager", label: "Course Manager" },
  { value: "courseViewer", label: "Course Viewer" },
];

const tenantRoleOptions: RoleOption[] = [
  { value: "orgSuperAdmin", label: "Org Super Admin" },
  { value: "courseAdmin", label: "Course Admin" },
  { value: "courseManager", label: "Course Manager" },
  { value: "courseViewer", label: "Course Viewer" },
];

const orgTypeOptions = [
  { value: "provider", label: "Provider" },
  { value: "tenant", label: "Tenant" },
];

const emptyForm = {
  id: "",
  firstName: "",
  lastName: "",
  email: "",
  username: "",
  orgType: "",
  password: "",
};

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const result = await response.json();
    if (typeof result?.message === "string") return result.message;
    if (typeof result?.error === "string") return result.error;
  } catch {
    const text = await response.text();
    if (text) return text;
  }

  return fallback;
}

function mapUserRow(user: {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  orgId?: string;
  orgType?: string;
  roles?: string[];
}): UserRow | null {
  const id = user._id || user.id;
  if (!id || !user.email) return null;

  const firstName = user.firstName || "";
  const lastName = user.lastName || "";

  return {
    id,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim() || user.email,
    email: user.email,
    username: user.username || "",
    orgId: user.orgId || "",
    orgType: user.orgType || "N/A",
    roles: Array.isArray(user.roles) ? user.roles : [],
  };
}

export default function UserManagement({ mode }: UserManagementProps) {
  const { user } = useAuth();
  const loaderUser = useLoaderData() as User | undefined;
  const currentUser = user ?? loaderUser;
  const isProviderMode = mode === "provider";
  const roleOptions = isProviderMode ? providerRoleOptions : tenantRoleOptions;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [institutes, setInstitutes] = useState<Option[]>([]);
  const [selectedInstitute, setSelectedInstitute] = useState<Option | null>(
    null,
  );
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoadingInstitutes, setIsLoadingInstitutes] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [institutesError, setInstitutesError] = useState<string | null>(null);

  const effectiveOrgId = isProviderMode
    ? selectedInstitute?.id
    : currentUser?.orgId;

  const formTitle = editingUser ? "Edit User" : "Add New User";
  const submitLabel = editingUser ? "Update User" : "Submit";

  const selectedRoleLabels = useMemo(() => {
    const labelByRole = new Map(
      roleOptions.map((option) => [option.value, option.label]),
    );
    return selectedRoles.map((role) => labelByRole.get(role) || role);
  }, [roleOptions, selectedRoles]);

  useEffect(() => {
    if (!isProviderMode) return;

    let isMounted = true;

    async function loadInstitutes() {
      try {
        setIsLoadingInstitutes(true);
        setInstitutesError(null);

        const response = await apiFetch("/institutes?limit=100");
        if (!response.ok) throw new Error("Unable to load organizations.");

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
      } catch (nextError) {
        if (isMounted) {
          setInstitutes([]);
          setInstitutesError(
            nextError instanceof Error
              ? nextError.message
              : "Unable to load organizations.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingInstitutes(false);
        }
      }
    }

    void loadInstitutes();

    return () => {
      isMounted = false;
    };
  }, [isProviderMode]);

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      if (!effectiveOrgId) {
        setUsers([]);
        setIsLoadingUsers(false);
        return;
      }

      try {
        setIsLoadingUsers(true);
        setError(null);

        const response = await apiFetch(
          `/users?orgId=${effectiveOrgId}&limit=100`,
        );
        if (!response.ok) throw new Error("Unable to load users.");

        const result = await response.json();
        const rows = Array.isArray(result?.data)
          ? result.data.map(mapUserRow).filter(Boolean)
          : [];

        if (isMounted) {
          setUsers(rows as UserRow[]);
        }
      } catch (nextError) {
        if (isMounted) {
          setUsers([]);
          setError(
            nextError instanceof Error
              ? nextError.message
              : "Unable to load users.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingUsers(false);
        }
      }
    }

    void loadUsers();

    return () => {
      isMounted = false;
    };
  }, [effectiveOrgId]);

  function resetForm() {
    setForm(emptyForm);
    setSelectedRoles([]);
    setEditingUser(null);
    if (!isProviderMode) {
      setSelectedInstitute(null);
    }
  }

  function openCreateForm() {
    resetForm();
    setMessage(null);
    setError(null);
    setIsFormOpen(true);
  }

  function openEditForm(nextUser: UserRow) {
    setEditingUser(nextUser);
    setForm({
      id: nextUser.id,
      firstName: nextUser.firstName,
      lastName: nextUser.lastName,
      email: nextUser.email,
      username: nextUser.username,
      orgType: nextUser.orgType === "N/A" ? "" : nextUser.orgType,
      password: "",
    });
    setSelectedRoles(nextUser.roles);
    setMessage(null);
    setError(null);

    if (isProviderMode) {
      const institute = institutes.find(
        (option) => option.id === nextUser.orgId,
      );
      setSelectedInstitute(institute || selectedInstitute);
    }

    setIsFormOpen(true);
  }

  function closeForm() {
    resetForm();
    setIsFormOpen(false);
  }

  async function reloadUsers() {
    if (!effectiveOrgId) return;
    const response = await apiFetch(`/users?orgId=${effectiveOrgId}&limit=100`);
    if (!response.ok) throw new Error("Unable to refresh users.");
    const result = await response.json();
    const rows = Array.isArray(result?.data)
      ? result.data.map(mapUserRow).filter(Boolean)
      : [];
    setUsers(rows as UserRow[]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const orgId = isProviderMode ? selectedInstitute?.id : currentUser?.orgId;

      if (!orgId || selectedRoles.length === 0) {
        throw new Error(
          "Please complete all required fields before submitting.",
        );
      }

      if (!editingUser && !form.password) {
        throw new Error(
          "Please complete all required fields before submitting.",
        );
      }

      const payload = isProviderMode
        ? {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            orgId,
            orgType: form.orgType,
            username: form.username,
            password: form.password || undefined,
            roles: selectedRoles,
          }
        : {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            password: form.password || undefined,
            roles: selectedRoles,
          };

      const response = editingUser
        ? await apiFetch("/users/update", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              _id: editingUser.id,
              ...payload,
              orgId,
              roles: selectedRoles,
            }),
          })
        : await apiFetch("/users/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(payload),
          });

      if (!response.ok) {
        throw new Error(
          await readErrorMessage(
            response,
            editingUser ? "Unable to update user." : "Unable to create user.",
          ),
        );
      }

      await reloadUsers();
      setMessage(
        editingUser
          ? "User updated successfully."
          : "User created successfully.",
      );
      closeForm();
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : editingUser
            ? "Unable to update user."
            : "Unable to create user.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteUser(userId: string) {
    try {
      setDeletingUserId(userId);
      setError(null);
      setMessage(null);

      const response = await apiFetch("/users/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ _id: userId }),
      });

      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Unable to delete user."),
        );
      }

      setUsers((currentUsers) =>
        currentUsers.filter((nextUser) => nextUser.id !== userId),
      );
      setMessage("User deleted successfully.");
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to delete user.",
      );
    } finally {
      setDeletingUserId(null);
    }
  }

  return (
    <Card
      variant="outlined"
      sx={{
        width: "100%",
        maxWidth: 1180,
        borderRadius: 1,
        boxShadow: 3,
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Stack spacing={2.5}>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Users
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage user accounts and role assignments.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={() => {
                if (isFormOpen && !editingUser) {
                  closeForm();
                  return;
                }
                openCreateForm();
              }}
              sx={{ alignSelf: "flex-start", whiteSpace: "nowrap" }}
            >
              Add User
            </Button>
          </Box>

          {message && <Alert severity="success">{message}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}

          {isProviderMode && (
            <FormControl fullWidth>
              <FormLabel htmlFor="users-org">Organization</FormLabel>
              <Autocomplete
                id="users-org"
                options={institutes}
                value={selectedInstitute}
                onChange={(_, value) => {
                  setSelectedInstitute(value);
                  if (!editingUser) {
                    setUsers([]);
                  }
                }}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                loading={isLoadingInstitutes}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search organization by name"
                    error={Boolean(institutesError)}
                    helperText={
                      institutesError ||
                      "Choose the organization to list users."
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
              />
            </FormControl>
          )}

          <Collapse in={isFormOpen} unmountOnExit>
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                p: { xs: 2, md: 3 },
                mb: 1,
              }}
            >
              <Stack spacing={2}>
                <Typography variant="h6">{formTitle}</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth>
                      <FormLabel htmlFor="firstName">First Name</FormLabel>
                      <TextField
                        id="firstName"
                        value={form.firstName}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            firstName: event.target.value,
                          }))
                        }
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
                        value={form.lastName}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            lastName: event.target.value,
                          }))
                        }
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
                        type="email"
                        value={form.email}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            email: event.target.value,
                          }))
                        }
                        required
                        fullWidth
                      />
                    </FormControl>
                  </Grid>

                  {isProviderMode && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth>
                        <FormLabel htmlFor="username">Username</FormLabel>
                        <TextField
                          id="username"
                          value={form.username}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              username: event.target.value,
                            }))
                          }
                          required
                          fullWidth
                        />
                      </FormControl>
                    </Grid>
                  )}

                  {isProviderMode && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth>
                        <FormLabel htmlFor="form-org">Org</FormLabel>
                        <Autocomplete
                          id="form-org"
                          options={institutes}
                          value={selectedInstitute}
                          onChange={(_, value) => {
                            setSelectedInstitute(value);
                          }}
                          getOptionLabel={(option) => option.label}
                          isOptionEqualToValue={(option, value) =>
                            option.id === value.id
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Search institute by name"
                              required
                            />
                          )}
                        />
                      </FormControl>
                    </Grid>
                  )}

                  {isProviderMode && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth>
                        <FormLabel htmlFor="orgType">Org Type</FormLabel>
                        <TextField
                          id="orgType"
                          select
                          value={form.orgType}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              orgType: event.target.value,
                            }))
                          }
                          required
                          fullWidth
                        >
                          {orgTypeOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </FormControl>
                    </Grid>
                  )}

                  <Grid size={{ xs: 12, md: isProviderMode ? 6 : 12 }}>
                    <FormControl fullWidth>
                      <FormLabel htmlFor="roles">Roles</FormLabel>
                      <TextField
                        id="roles"
                        select
                        required
                        fullWidth
                        value={selectedRoles}
                        onChange={(event) => {
                          const value = event.target.value;
                          setSelectedRoles(
                            typeof value === "string"
                              ? value.split(",")
                              : value,
                          );
                        }}
                        slotProps={{
                          select: {
                            multiple: true,
                          },
                        }}
                      >
                        {roleOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth>
                      <FormLabel htmlFor="password">Password</FormLabel>
                      <TextField
                        id="password"
                        type="password"
                        value={form.password}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            password: event.target.value,
                          }))
                        }
                        required={!editingUser}
                        placeholder={
                          editingUser
                            ? "Leave blank to keep current password"
                            : "Enter a temporary password"
                        }
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
                      <Button variant="text" onClick={closeForm}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving..." : submitLabel}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Stack>
            </Box>
          </Collapse>

          <Typography variant="h6">All User</Typography>

          <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell>User Name</TableCell>
                  <TableCell>Emails</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!effectiveOrgId ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      {isProviderMode
                        ? "Select an organization to view users."
                        : "Unable to determine your organization."}
                    </TableCell>
                  </TableRow>
                ) : isLoadingUsers ? (
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
                          Loading users...
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((nextUser) => (
                    <TableRow key={nextUser.id} hover>
                      <TableCell>{nextUser.name}</TableCell>
                      <TableCell>{nextUser.email}</TableCell>
                      <TableCell>
                        {nextUser.roles.length > 0
                          ? nextUser.roles.join(", ")
                          : "N/A"}
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
                            onClick={() => openEditForm(nextUser)}
                          >
                            Edit
                          </Button>
                          <Button
                            color="error"
                            variant="outlined"
                            startIcon={<DeleteOutlineIcon />}
                            onClick={() => {
                              void handleDeleteUser(nextUser.id);
                            }}
                            disabled={deletingUserId === nextUser.id}
                          >
                            {deletingUserId === nextUser.id
                              ? "Deleting..."
                              : "Delete"}
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {selectedRoleLabels.length > 0 && isFormOpen && (
            <Typography variant="caption" color="text.secondary">
              Selected roles: {selectedRoleLabels.join(", ")}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
