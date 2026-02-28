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

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "/dashboard", element: <Dashboard />, loader: requireAuthLoader },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "/sign-in", element: <SignIn />, action: signInAction },
      { path: "/sign-up", element: <SignUp />, action: signUpAction },
    ],
  }
]);
