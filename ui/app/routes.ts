import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    
    index("./routes/marketing-page/MarketingPage.tsx"),
    route("/sign-in","./routes/sign-in/SignIn.tsx"),
    route("/sign-up","./routes/sign-up/SignUp.tsx")

] satisfies RouteConfig;
