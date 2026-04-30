import { redirect } from "react-router-dom";
import { apiFetch } from "../../service/apiFetch";
import type { AuthState } from "../../types/authentication/authentication-types";

async function loadAuthState(): Promise<AuthState> {
  const response = await apiFetch("/users/me");

  if (!response.ok) {
    throw new Error("Unable to load authenticated user");
  }

  return response.json() as Promise<AuthState>;
}

function getOrgType(authState: AuthState) {
  return authState.orgType ?? authState.user?.orgType ?? null;
}

function hasRole(authState: AuthState, role: string) {
  return authState.roles.includes(role);
}

export async function requireAuthLoader() {
  try {
    const authState = await loadAuthState();
    return authState.user;
  } catch (e) {
    //console.error("Authentication check failed:", e);
    throw redirect("/sign-in");
  }
}

export async function requireProviderLoader() {
  try {
    const authState = await loadAuthState();

    if (getOrgType(authState) !== "provider") {
      throw redirect("/dashboard");
    }

    return authState.user;
  } catch (e) {
    if (e instanceof Response) {
      throw e;
    }

    //console.error("Provider authorization check failed:", e);
    throw redirect("/sign-in");
  }
}

export async function requireTenantDashboardLoader() {
  try {
    const authState = await loadAuthState();

    if (getOrgType(authState) === "provider") {
      throw redirect("/provider-dashboard");
    }

    return authState.user;
  } catch (e) {
    if (e instanceof Response) {
      throw e;
    }

    //console.error("Tenant dashboard authorization check failed:", e);
    throw redirect("/sign-in");
  }
}

export async function requireOrgSuperAdminLoader() {
  try {
    const authState = await loadAuthState();

    if (getOrgType(authState) === "provider") {
      throw redirect("/provider-dashboard");
    }

    if (!hasRole(authState, "orgSuperAdmin")) {
      throw redirect("/dashboard");
    }

    return authState.user;
  } catch (e) {
    if (e instanceof Response) {
      throw e;
    }

    // console.error("Org super admin authorization check failed:", e);
    throw redirect("/sign-in");
  }
}

export async function requireOrgCourseCreatorLoader() {
  try {
    const authState = await loadAuthState();

    if (getOrgType(authState) === "provider") {
      throw redirect("/provider-dashboard");
    }

    if (
      !hasRole(authState, "orgSuperAdmin") &&
      !hasRole(authState, "courseAdmin")
    ) {
      throw redirect("/dashboard");
    }

    return authState.user;
  } catch (e) {
    if (e instanceof Response) {
      throw e;
    }

    //console.error("Course creator authorization check failed:", e);
    throw redirect("/sign-in");
  }
}
