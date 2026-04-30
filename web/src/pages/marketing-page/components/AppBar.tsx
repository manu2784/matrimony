import * as React from "react";
import { styled, alpha } from "@mui/material/styles";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import { AppBar as MuiBar } from "@mui/material";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Drawer from "@mui/material/Drawer";
import MenuIcon from "@mui/icons-material/Menu";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import logo from "../../../assets/logo.png";
import { useAuth } from "../../../store/context/useAuth";
// import ColorModeIconDropdown from '../../shared-theme/ColorModeIconDropdown';
// import Sitemark from "./SitemarkIcon";

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexShrink: 0,
  borderRadius: `calc(${theme.shape.borderRadius}px + 8px)`,
  backdropFilter: "blur(24px)",
  border: "1px solid",
  borderColor: (theme.vars || theme).palette.divider,
  backgroundColor: theme.vars
    ? `rgba(${theme.vars.palette.background.defaultChannel} / 0.4)`
    : alpha(theme.palette.background.default, 0.4),
  boxShadow: (theme.vars || theme).shadows[1],
  padding: "8px 12px",
}));

export default function AppBar() {
  const [open, setOpen] = React.useState(false);
  const [userMenuAnchor, setUserMenuAnchor] =
    React.useState<null | HTMLElement>(null);
  const { logout, orgType, user } = useAuth();
  const isUserMenuOpen = Boolean(userMenuAnchor);

  const userName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "";
  const initials =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";
  const dashboardPath =
    orgType === "provider" ? "/provider-dashboard" : "/dashboard";

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  const openUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const closeUserMenu = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = async () => {
    closeUserMenu();
    setOpen(false);
    await logout();
  };

  return (
    <MuiBar
      position="fixed"
      enableColorOnDark
      sx={{
        boxShadow: 0,
        bgcolor: "transparent",
        backgroundImage: "none",
        mt: "calc(var(--template-frame-height, 0px) + 28px)",
      }}
    >
      <Container maxWidth="lg">
        <StyledToolbar variant="dense" disableGutters>
          <Box
            sx={{ flexGrow: 1, display: "flex", alignItems: "center", px: 0 }}
          >
            {/* <Sitemark /> */}
            <Box>
              <img src={logo} alt="Logo" style={{ height: "60px" }} />
            </Box>
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                marginTop: "-13px",
                marginLeft: "15px",
              }}
            >
              <Button variant="text" color="info" size="small">
                Features
              </Button>
              <Button variant="text" color="info" size="small">
                Testimonials
              </Button>
              <Button variant="text" color="info" size="small">
                Highlights
              </Button>
              <Button variant="text" color="info" size="small">
                Pricing
              </Button>
              <Button
                variant="text"
                color="info"
                size="small"
                sx={{ minWidth: 0 }}
              >
                FAQ
              </Button>
              <Button
                variant="text"
                color="info"
                size="small"
                sx={{ minWidth: 0 }}
              >
                Blog
              </Button>
            </Box>
          </Box>
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              gap: 1,
              alignItems: "center",
            }}
          >
            {user ? (
              <>
                <Button
                  href={dashboardPath}
                  color="primary"
                  variant="text"
                  size="small"
                >
                  Dashboard
                </Button>
                <Button
                  color="primary"
                  variant="text"
                  size="small"
                  sx={{ maxWidth: 180, textTransform: "none" }}
                >
                  {userName}
                </Button>
                <IconButton
                  aria-label="Open user menu"
                  aria-controls={isUserMenuOpen ? "home-user-menu" : undefined}
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen ? "true" : undefined}
                  onClick={openUserMenu}
                  sx={{ p: 0.5 }}
                >
                  <Avatar sx={{ width: 34, height: 34, fontSize: 14 }}>
                    {initials}
                  </Avatar>
                </IconButton>
                <Menu
                  id="home-user-menu"
                  anchorEl={userMenuAnchor}
                  open={isUserMenuOpen}
                  onClose={closeUserMenu}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                >
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button
                  href="/sign-in"
                  color="primary"
                  variant="text"
                  size="small"
                >
                  Sign in
                </Button>
                <Button
                  href="sign-up"
                  color="primary"
                  variant="contained"
                  size="small"
                >
                  Sign up
                </Button>
              </>
            )}
            {/* <ColorModeIconDropdown /> */}
          </Box>
          <Box sx={{ display: { xs: "flex", md: "none" }, gap: 1 }}>
            {/* <ColorModeIconDropdown size="medium" /> */}
            <IconButton aria-label="Menu button" onClick={toggleDrawer(true)}>
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="top"
              open={open}
              onClose={toggleDrawer(false)}
              PaperProps={{
                sx: {
                  top: "var(--template-frame-height, 0px)",
                },
              }}
            >
              <Box sx={{ p: 2, backgroundColor: "background.default" }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <IconButton onClick={toggleDrawer(false)}>
                    <CloseRoundedIcon />
                  </IconButton>
                </Box>

                <MenuItem>Features</MenuItem>
                <MenuItem>Testimonials</MenuItem>
                <MenuItem>Highlights</MenuItem>
                <MenuItem>Pricing</MenuItem>
                <MenuItem>FAQ</MenuItem>
                <MenuItem>Blog</MenuItem>
                <Divider sx={{ my: 3 }} />
                {user ? (
                  <>
                    <MenuItem>
                      <Button href={dashboardPath} color="primary" fullWidth>
                        Dashboard
                      </Button>
                    </MenuItem>
                    <MenuItem>
                      <Button
                        color="primary"
                        variant="text"
                        fullWidth
                        sx={{ justifyContent: "space-between" }}
                        onClick={openUserMenu}
                      >
                        <span>{userName}</span>
                        <Avatar sx={{ width: 32, height: 32, fontSize: 13 }}>
                          {initials}
                        </Avatar>
                      </Button>
                    </MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem>
                      <Button
                        href="/sign-up"
                        color="primary"
                        variant="contained"
                        fullWidth
                      >
                        Sign up
                      </Button>
                    </MenuItem>
                    <MenuItem>
                      <Button
                        href="/sign-in"
                        color="primary"
                        variant="outlined"
                        fullWidth
                      >
                        Sign in
                      </Button>
                    </MenuItem>
                  </>
                )}
              </Box>
            </Drawer>
          </Box>
        </StyledToolbar>
      </Container>
    </MuiBar>
  );
}
