// web/src/layouts/AuthLayout.tsx
import { Outlet } from "react-router-dom";
import AppBar from "../components/AppBar";

export default function AuthLayout() {
    return (
        <>
            <AppBar />
            <Outlet />
        </>
    );
}
