import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/marketing-page/MarketingPage";
import SignIn from "./pages/sign-in/SignIn";
import SignUp from "./pages/sign-up/SignUp";
import App from "./App";
import { signInAction } from "./helper/actions/signInAction.ts";
import signUpAction from "./helper/actions/signUpAction.ts";
import Dashboard from "./pages/dashboard/Dashboard.tsx";
import {
  requireOrgCourseCreatorLoader,
  requireOrgSuperAdminLoader,
  requireProviderLoader,
  requireTenantDashboardLoader,
} from "./helper/loaders/authLoader.ts";
import AuthLayout from "./layouts/AuthLayout.tsx";
import DashboardLayout from "./pages/dashboard/DashboardLayout.tsx";
import ProviderDashboard from "./pages/provider-dashboard/ProviderDashboard.tsx";
import ProviderDashboardLayout from "./pages/provider-dashboard/ProviderDashboardLayout.tsx";
import AddUser from "./pages/provider-dashboard/views/add-user/AddUser.tsx";
import { registerUserAction } from "./helper/actions/registerUserAction.ts";
import AddOrg from "./pages/provider-dashboard/views/add-org/AddOrg.tsx";
import { createInstituteAction } from "./helper/actions/createInstituteAction.ts";
import AddCourse from "./pages/provider-dashboard/views/add-course/AddCourse.tsx";
import { createCourseAction } from "./helper/actions/createCourseAction.ts";
import Users from "./pages/provider-dashboard/views/users/Users.tsx";
import DashboardAddUser from "./pages/dashboard/views/add-user/AddUser.tsx";
import { registerOrgUserAction } from "./helper/actions/registerOrgUserAction.ts";
import DashboardAddCourse from "./pages/dashboard/views/add-course/AddCourse.tsx";
import { createOrgCourseAction } from "./helper/actions/createOrgCourseAction.ts";
import AddCourseMaterial from "./pages/dashboard/views/add-course-material/AddCourseMaterial.tsx";
import { createCourseMaterialAction } from "./helper/actions/createCourseMaterialAction.ts";
import AddEnrollment from "./pages/dashboard/views/add-enrollment/AddEnrollment.tsx";
import { createEnrollmentAction } from "./helper/actions/createEnrollmentAction.ts";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [{ index: true, element: <Home /> }],
  },
  {
    element: <DashboardLayout />,
    loader: requireTenantDashboardLoader,
    children: [
      {
        path: "/dashboard",
        element: <Dashboard />,
        loader: requireTenantDashboardLoader,
      },
      {
        path: "/dashboard/add-user",
        element: <DashboardAddUser />,
        action: registerOrgUserAction,
        loader: requireOrgSuperAdminLoader,
      },
      {
        path: "/dashboard/add-course",
        element: <DashboardAddCourse />,
        action: createOrgCourseAction,
        loader: requireOrgCourseCreatorLoader,
      },
      {
        path: "/dashboard/add-course-material",
        element: <AddCourseMaterial />,
        action: createCourseMaterialAction,
        loader: requireOrgCourseCreatorLoader,
      },
      {
        path: "/dashboard/add-enrollment",
        element: <AddEnrollment />,
        action: createEnrollmentAction,
        loader: requireOrgCourseCreatorLoader,
      },
    ],
  },
  {
    element: <ProviderDashboardLayout />,
    loader: requireProviderLoader,
    children: [
      {
        path: "/provider-dashboard",
        element: <ProviderDashboard />,
        loader: requireProviderLoader,
      },
      {
        path: "/add-user",
        element: <AddUser />,
        action: registerUserAction,
        loader: requireProviderLoader,
      },
      {
        path: "/add-org",
        element: <AddOrg />,
        action: createInstituteAction,
        loader: requireProviderLoader,
      },
      {
        path: "/add-course",
        element: <AddCourse />,
        action: createCourseAction,
        loader: requireProviderLoader,
      },
      {
        path: "/users",
        element: <Users />,
        loader: requireProviderLoader,
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
