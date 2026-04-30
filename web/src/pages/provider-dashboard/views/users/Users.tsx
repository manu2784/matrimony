import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
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
import { useEffect, useState } from "react";
import { apiFetch } from "../../../../service/apiFetch";

type InstituteOption = {
  id: string;
  label: string;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  orgType: string;
};

export default function Users() {
  const [institutes, setInstitutes] = useState<InstituteOption[]>([]);
  const [selectedInstitute, setSelectedInstitute] =
    useState<InstituteOption | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoadingInstitutes, setIsLoadingInstitutes] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [institutesError, setInstitutesError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInstitutes() {
      try {
        setIsLoadingInstitutes(true);
        setInstitutesError(null);

        const response = await apiFetch("/institutes?limit=100");

        if (!response.ok) {
          throw new Error("Unable to load organizations.");
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
              : "Unable to load organizations.",
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

    async function loadUsers() {
      if (!selectedInstitute?.id) {
        setUsers([]);
        setUsersError(null);
        setIsLoadingUsers(false);
        return;
      }

      try {
        setIsLoadingUsers(true);
        setUsersError(null);

        const response = await apiFetch(
          `/users?orgId=${selectedInstitute.id}&limit=100`,
        );

        if (!response.ok) {
          throw new Error("Unable to load users.");
        }

        const result = await response.json();
        const rows = Array.isArray(result?.data)
          ? result.data
              .filter(
                (user: {
                  _id?: string;
                  email?: string;
                  firstName?: string;
                  lastName?: string;
                  orgType?: string;
                }) => Boolean(user?._id && user?.email),
              )
              .map(
                (user: {
                  _id: string;
                  email: string;
                  firstName?: string;
                  lastName?: string;
                  orgType?: string;
                }) => ({
                  id: user._id,
                  name:
                    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                    user.email,
                  email: user.email,
                  orgType: user.orgType || "N/A",
                }),
              )
          : [];

        if (isMounted) {
          setUsers(rows);
        }
      } catch (error) {
        if (isMounted) {
          setUsers([]);
          setUsersError(
            error instanceof Error ? error.message : "Unable to load users.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingUsers(false);
        }
      }
    }

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, [selectedInstitute]);

  async function handleDeleteUser(userId: string) {
    try {
      setDeletingUserId(userId);
      setUsersError(null);

      const response = await apiFetch("/users/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ _id: userId }),
      });

      if (!response.ok) {
        let errorMessage = "Unable to delete user.";

        try {
          const result = await response.json();
          if (typeof result?.message === "string") {
            errorMessage = result.message;
          }
        } catch {
          const text = await response.text();
          if (text) {
            errorMessage = text;
          }
        }

        throw new Error(errorMessage);
      }

      setUsers((currentUsers) =>
        currentUsers.filter((user) => user.id !== userId),
      );
    } catch (error) {
      setUsersError(
        error instanceof Error ? error.message : "Unable to delete user.",
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
        maxWidth: 1100,
        borderRadius: 1,
        boxShadow: 3,
      }}
    >
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Users
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Select an organization to view and manage its users.
            </Typography>
          </Box>

          {usersError && <Alert severity="error">{usersError}</Alert>}

          <FormControl fullWidth>
            <FormLabel htmlFor="users-org">Organization</FormLabel>
            <Autocomplete
              id="users-org"
              options={institutes}
              value={selectedInstitute}
              onChange={(_, value) => {
                setSelectedInstitute(value);
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
                    institutesError || "Choose the organization to list users."
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

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Org Type</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!selectedInstitute ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Select an organization to view users.
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
                      No users found for this organization.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell sx={{ textTransform: "capitalize" }}>
                        {user.orgType}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          color="error"
                          variant="outlined"
                          startIcon={<DeleteOutlineIcon />}
                          onClick={() => {
                            void handleDeleteUser(user.id);
                          }}
                          disabled={deletingUserId === user.id}
                        >
                          {deletingUserId === user.id
                            ? "Deleting..."
                            : "Delete"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </CardContent>
    </Card>
  );
}
