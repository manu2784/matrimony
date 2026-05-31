import type { ComponentType } from "react";
import { createBrowserRouter, type ActionFunctionArgs } from "react-router-dom";
import App from "./App";
import {
  requireOrgCourseCreatorLoader,
  requireOrgEnrollmentManagerLoader,
  requireOrgSuperAdminLoader,
  requireProviderLoader,
  requireTenantDashboardLoader,
} from "./helper/loaders/authLoader.ts";

type ComponentModule = {
  default: ComponentType;
};

function lazyRoute(importComponent: () => Promise<ComponentModule>) {
  return async () => {
    const { default: Component } = await importComponent();
    return { Component };
  };
}

const signUpAction = async (args: ActionFunctionArgs) => {
  const { default: action } = await import("./helper/actions/signUpAction.ts");
  return action(args);
};

const createInstituteAction = async (args: ActionFunctionArgs) => {
  const { createInstituteAction: action } =
    await import("./helper/actions/createInstituteAction.ts");
  return action(args);
};

const createCourseAction = async (args: ActionFunctionArgs) => {
  const { createCourseAction: action } =
    await import("./helper/actions/createCourseAction.ts");
  return action(args);
};

const createOrgCourseAction = async (args: ActionFunctionArgs) => {
  const { createOrgCourseAction: action } =
    await import("./helper/actions/createOrgCourseAction.ts");
  return action(args);
};

const createCourseMaterialAction = async (args: ActionFunctionArgs) => {
  const { createCourseMaterialAction: action } =
    await import("./helper/actions/createCourseMaterialAction.ts");
  return action(args);
};

const createEnrollmentAction = async (args: ActionFunctionArgs) => {
  const { createEnrollmentAction: action } =
    await import("./helper/actions/createEnrollmentAction.ts");
  return action(args);
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        lazy: lazyRoute(() => import("./pages/marketing-page/MarketingPage")),
      },
    ],
  },
  {
    lazy: lazyRoute(() => import("./pages/dashboard/DashboardLayout")),
    loader: requireTenantDashboardLoader,
    children: [
      {
        path: "/dashboard",
        lazy: lazyRoute(() => import("./pages/dashboard/Dashboard")),
        loader: requireTenantDashboardLoader,
      },
      {
        path: "/dashboard/users",
        lazy: lazyRoute(
          () => import("./pages/dashboard/views/add-user/AddUser"),
        ),
        loader: requireOrgSuperAdminLoader,
      },
      {
        path: "/dashboard/add-user",
        lazy: lazyRoute(
          () => import("./pages/dashboard/views/add-user/AddUser"),
        ),
        loader: requireOrgSuperAdminLoader,
      },
      {
        path: "/dashboard/courses",
        lazy: lazyRoute(() => import("./pages/dashboard/views/course/Courses")),
        action: createOrgCourseAction,
        loader: requireOrgCourseCreatorLoader,
      },
      {
        path: "/dashboard/courses/:courseId",
        lazy: lazyRoute(
          () => import("./pages/dashboard/views/course/CourseDetails"),
        ),
        loader: requireOrgCourseCreatorLoader,
      },
      {
        path: "/dashboard/course-material",
        lazy: lazyRoute(
          () =>
            import("./pages/dashboard/views/course-material/CourseMaterial"),
        ),
        action: createCourseMaterialAction,
        loader: requireOrgCourseCreatorLoader,
      },
      {
        path: "/dashboard/enrollment",
        lazy: lazyRoute(
          () => import("./pages/dashboard/views/enrollment/Enrollment"),
        ),
        action: createEnrollmentAction,
        loader: requireOrgEnrollmentManagerLoader,
      },
    ],
  },
  {
    lazy: lazyRoute(
      () => import("./pages/provider-dashboard/ProviderDashboardLayout"),
    ),
    loader: requireProviderLoader,
    children: [
      {
        path: "/provider-dashboard",
        lazy: lazyRoute(
          () => import("./pages/provider-dashboard/ProviderDashboard"),
        ),
        loader: requireProviderLoader,
      },
      {
        path: "/add-user",
        lazy: lazyRoute(
          () => import("./pages/provider-dashboard/views/add-user/AddUser"),
        ),
        loader: requireProviderLoader,
      },
      {
        path: "/add-org",
        lazy: lazyRoute(
          () => import("./pages/provider-dashboard/views/add-org/AddOrg"),
        ),
        action: createInstituteAction,
        loader: requireProviderLoader,
      },
      {
        path: "/add-course",
        lazy: lazyRoute(
          () => import("./pages/provider-dashboard/views/add-course/AddCourse"),
        ),
        action: createCourseAction,
        loader: requireProviderLoader,
      },
      {
        path: "/users",
        lazy: lazyRoute(
          () => import("./pages/provider-dashboard/views/users/Users"),
        ),
        loader: requireProviderLoader,
      },
    ],
  },
  {
    lazy: lazyRoute(() => import("./layouts/AuthLayout")),
    children: [
      {
        path: "/sign-in",
        lazy: lazyRoute(() => import("./pages/sign-in/SignIn")),
      },
      {
        path: "/sign-up",
        lazy: lazyRoute(() => import("./pages/sign-up/SignUp")),
        action: signUpAction,
      },
    ],
  },
]);
