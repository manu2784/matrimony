import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import HelpRoundedIcon from "@mui/icons-material/HelpRounded";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import PermMediaRoundedIcon from "@mui/icons-material/PermMediaRounded";
import HowToRegRoundedIcon from "@mui/icons-material/HowToRegRounded";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useAuth } from "../../../store/context/useAuth";

const mainListItems = [
  { text: "Home", icon: <HomeRoundedIcon />, to: "/dashboard" },
  { text: "Analytics", icon: <AnalyticsRoundedIcon />, to: "/dashboard" },
  { text: "Clients", icon: <PeopleRoundedIcon />, to: "/dashboard" },
  { text: "Tasks", icon: <AssignmentRoundedIcon />, to: "/dashboard" },
];

const secondaryListItems = [
  { text: "Settings", icon: <SettingsRoundedIcon /> },
  { text: "About", icon: <InfoRoundedIcon /> },
  { text: "Feedback", icon: <HelpRoundedIcon /> },
];

export default function MenuContent() {
  const location = useLocation();
  const { hasRole } = useAuth();
  const canCreateUsers = hasRole("orgSuperAdmin");
  const canCreateCourses = hasRole("orgSuperAdmin") || hasRole("courseAdmin");
  const visibleMainListItems = [
    ...mainListItems,
    ...(canCreateUsers
      ? [
          {
            text: "Add User",
            icon: <PersonAddAltIcon />,
            to: "/dashboard/add-user",
          },
        ]
      : []),
    ...(canCreateCourses
      ? [
          {
            text: "Add Course",
            icon: <SchoolRoundedIcon />,
            to: "/dashboard/add-course",
          },
          {
            text: "Add Material",
            icon: <PermMediaRoundedIcon />,
            to: "/dashboard/add-course-material",
          },
          {
            text: "Add Enrollment",
            icon: <HowToRegRoundedIcon />,
            to: "/dashboard/add-enrollment",
          },
        ]
      : []),
  ];

  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: "space-between" }}>
      <List dense>
        {visibleMainListItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: "block" }}>
            <ListItemButton
              component={RouterLink}
              to={item.to}
              selected={location.pathname === item.to}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <List dense>
        {secondaryListItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: "block" }}>
            <ListItemButton>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}
