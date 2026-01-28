import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/marketing-page/MarketingPage";
import SignIn from "./pages/sign-in/SignIn";
import SignUp from "./pages/sign-up/SignUp";
import App from "./App";
import { signInAction } from "./helper/actions/signInAction.ts";
import signUpAction from "./helper/actions/signUpAction.ts";
import Dashboard from "./pages/dashboard/Dashboard.tsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // layout
    children: [
      { index: true, element: <Home /> },
      { path: "/dashboard", element: <Dashboard /> },
    ],
  },
  { path: "/sign-in", element: <SignIn />, action: signInAction },
  { path: "/sign-up", element: <SignUp />, action: signUpAction },
]);
