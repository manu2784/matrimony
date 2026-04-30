import type {} from "@mui/x-charts/themeAugmentation";
import type {} from "@mui/x-data-grid-pro/themeAugmentation";
import type {} from "@mui/x-tree-view/themeAugmentation";
import { alpha } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import AppNavbar from "./components/AppNavbar";
import Header from "./components/Header";
import SideMenu from "./components/SideMenu";
import AppTheme from "../shared-theme/AppTheme";
import {
  chartsCustomizations,
  treeViewCustomizations,
} from "./theme/customizations";
import { useAuth } from "../../store/context/useAuth";
import { useEffect } from "react";
import { useLoaderData, useNavigate, Outlet } from "react-router-dom";
import { type User } from "../../types/authentication/authentication-types";

const xThemeComponents = {
  ...chartsCustomizations,
  ...treeViewCustomizations,
};

export default function ProviderDashboardLayout(props: {
  disableCustomTheme?: boolean;
}) {
  const { auth, logout, user } = useAuth();
  const loaderUser = useLoaderData() as User;
  const navigate = useNavigate();
  const logUserOut = async () => {
    await logout();
    navigate("/sign-in");
  };
  const currentUser = user ?? loaderUser;
  const orgType = auth?.orgType ?? currentUser?.orgType ?? null;

  useEffect(() => {
    if (orgType !== "provider") {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, orgType]);

  if (orgType !== "provider") {
    return null;
  }

  return (
    <AppTheme {...props} themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: "flex" }}>
        {currentUser ? (
          <SideMenu logUserOut={logUserOut} user={currentUser} />
        ) : null}
        <AppNavbar />
        {/* Main content */}
        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : alpha(theme.palette.background.default, 1),
            overflow: "auto",
          })}
        >
          <Stack
            spacing={2}
            sx={{
              alignItems: "center",
              mx: 3,
              pb: 5,
              mt: { xs: 8, md: 0 },
            }}
          >
            <Header />
            <Outlet />
          </Stack>
        </Box>
      </Box>
    </AppTheme>
  );
}
