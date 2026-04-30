import Box from "@mui/material/Box";
import { Link as RouterLink } from "react-router-dom";
import logo from "../../../assets/logo.png";

export default function SelectContent() {
  return (
    <Box
      component={RouterLink}
      to="/"
      sx={{
        width: 215,
        height: 56,
        display: "flex",
        alignItems: "center",
        textDecoration: "none",
      }}
    >
      <Box
        component="img"
        src={logo}
        alt="ProTutor"
        sx={{
          display: "block",
          height: 52,
          maxWidth: "100%",
          objectFit: "contain",
        }}
      />
    </Box>
  );
}
