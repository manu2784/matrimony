import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/marketing-page/MarketingPage";
import SignIn from "./pages/sign-in/SignIn";
import SignUp from "./pages/sign-up/SignUp";
import App from "./App";
import signUpAction from "./helper/actions/signUpAction.ts";
import Dashboard from "./pages/dashboard/Dashboard.tsx";
import {
  requireOrgCourseCreatorLoader,
  requireOrgEnrollmentManagerLoader,
  requireOrgSuperAdminLoader,
  requireProviderLoader,
  requireTenantDashboardLoader,
} from "./helper/loaders/authLoader.ts";
import AuthLayout from "./layouts/AuthLayout.tsx";
import DashboardLayout from "./pages/dashboard/DashboardLayout.tsx";
import ProviderDashboard from "./pages/provider-dashboard/ProviderDashboard.tsx";
import ProviderDashboardLayout from "./pages/provider-dashboard/ProviderDashboardLayout.tsx";
import AddUser from "./pages/provider-dashboard/views/add-user/AddUser.tsx";
import AddOrg from "./pages/provider-dashboard/views/add-org/AddOrg.tsx";
import { createInstituteAction } from "./helper/actions/createInstituteAction.ts";
import AddCourse from "./pages/provider-dashboard/views/add-course/AddCourse.tsx";
import { createCourseAction } from "./helper/actions/createCourseAction.ts";
import Users from "./pages/provider-dashboard/views/users/Users.tsx";
import DashboardAddUser from "./pages/dashboard/views/add-user/AddUser.tsx";
import Courses from "./pages/dashboard/views/course/Courses.tsx";
import CourseDetails from "./pages/dashboard/views/course/CourseDetails.tsx";
import { createOrgCourseAction } from "./helper/actions/createOrgCourseAction.ts";
import CourseMaterial from "./pages/dashboard/views/course-material/CourseMaterial.tsx";
import { createCourseMaterialAction } from "./helper/actions/createCourseMaterialAction.ts";
import Enrollment from "./pages/dashboard/views/enrollment/Enrollment.tsx";
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
        path: "/dashboard/users",
        element: <DashboardAddUser />,
        loader: requireOrgSuperAdminLoader,
      },
      {
        path: "/dashboard/add-user",
        element: <DashboardAddUser />,
        loader: requireOrgSuperAdminLoader,
      },
      {
        path: "/dashboard/courses",
        element: <Courses />,
        action: createOrgCourseAction,
        loader: requireOrgCourseCreatorLoader,
      },
      {
        path: "/dashboard/courses/:courseId",
        element: <CourseDetails />,
        loader: requireOrgCourseCreatorLoader,
      },
      {
        path: "/dashboard/course-material",
        element: <CourseMaterial />,
        action: createCourseMaterialAction,
        loader: requireOrgCourseCreatorLoader,
      },
      {
        path: "/dashboard/enrollment",
        element: <Enrollment />,
        action: createEnrollmentAction,
        loader: requireOrgEnrollmentManagerLoader,
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
      { path: "/sign-in", element: <SignIn /> },
      { path: "/sign-up", element: <SignUp />, action: signUpAction },
    ],
  },
]);
