// web/src/layouts/AuthLayout.tsx
import { Outlet } from "react-router-dom";
import AuthAppBar from "../components/AuthAppBar";

export default function AuthLayout() {
  return (
    <>
      <AuthAppBar />
      <Outlet />
    </>
  );
}
