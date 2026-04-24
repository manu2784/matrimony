import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/marketing-page/MarketingPage";
import SignIn from "./pages/sign-in/SignIn";
import SignUp from "./pages/sign-up/SignUp";
import App from "./App";
import { signInAction } from "./helper/actions/signInAction.ts";
import signUpAction from "./helper/actions/signUpAction.ts";
import Dashboard from "./pages/dashboard/Dashboard.tsx";
import { requireAuthLoader } from "./helper/loaders/authLoader.ts";
import AuthLayout from "./layouts/AuthLayout.tsx";
import DashboardLayout from "./pages/dashboard/DashboardLayout.tsx";
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard.tsx";
import SADashboardLayout from "./pages/super-admin/DashboardLayout.tsx";
import AddUser from "./pages/super-admin/views/add-user/AddUser.tsx";
import { registerUserAction } from "./helper/actions/registerUserAction.ts";
import AddOrg from "./pages/super-admin/views/add-org/AddOrg.tsx";
import { createInstituteAction } from "./helper/actions/createInstituteAction.ts";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [{ index: true, element: <Home /> }],
  },
  {
    element: <DashboardLayout />,
    loader: requireAuthLoader,
    children: [
      { path: "/dashboard", element: <Dashboard />, loader: requireAuthLoader },
    ],
  },
  {
    element: <SADashboardLayout />,
    loader: requireAuthLoader,
    children: [
      { path: "/super-admin-dashboard", element: <SuperAdminDashboard /> },
      {
        path: "/add-user",
        element: <AddUser />,
        action: registerUserAction,
        loader: requireAuthLoader,
      },
      {
        path: "/add-org",
        element: <AddOrg />,
        action: createInstituteAction,
        loader: requireAuthLoader,
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "/sign-in", element: <SignIn />, action: signInAction },
      { path: "/sign-up", element: <SignUp />, action: signUpAction },
    ],
  },
]);
