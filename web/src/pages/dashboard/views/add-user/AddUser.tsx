import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Form, useActionData, useNavigation } from "react-router-dom";
import type { RegisterOrgUserActionData } from "../../../../helper/actions/registerOrgUserAction";

const roleOptions = [
  { value: "orgSuperAdmin", label: "Org Super Admin" },
  { value: "courseAdmin", label: "Course Admin" },
  { value: "courseManager", label: "Course Manager" },
  { value: "courseViewer", label: "Course Viewer" },
];

export default function AddUser() {
  const actionData = useActionData() as RegisterOrgUserActionData | undefined;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

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
              Create a user in your organization and assign organization roles.
            </Typography>
          </Box>

          {actionData?.error && (
            <Alert severity="error">{actionData.error}</Alert>
          )}
          {actionData?.success && (
            <Alert severity="success">{actionData.success}</Alert>
          )}

          <Form method="post" action="/dashboard/add-user">
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
