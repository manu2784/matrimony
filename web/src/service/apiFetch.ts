let accessToken: string | null = null;
let refreshPromise: Promise<void> | null = null;
const ACCESS_TOKEN_STORAGE_KEY = "accessToken";

function canUseSessionStorage() {
  return (
    typeof window !== "undefined" &&
    typeof window.sessionStorage !== "undefined"
  );
}

function readStoredAccessToken() {
  if (!canUseSessionStorage()) {
    return null;
  }

  return window.sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function setAccessToken(token: string | null) {
  accessToken = token;

  if (!canUseSessionStorage()) {
    return;
  }

  if (token) {
    window.sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
    return;
  }

  window.sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export function getAccessToken() {
  if (accessToken) {
    return accessToken;
  }

  const storedToken = readStoredAccessToken();

  if (storedToken) {
    accessToken = storedToken;
    return storedToken;
  }

  return null;
}

export async function readAccessTokenResponse(
  response: Response,
): Promise<string | null> {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await response.json();
    return typeof data?.accessToken === "string" ? data.accessToken : null;
  }

  const token = (await response.text()).trim();
  return token || null;
}

export async function refreshAccessToken(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = fetch(API_BASE_URL + "/refresh", {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Refresh failed");
        const token = await readAccessTokenResponse(res);
        setAccessToken(token);
      })
      .catch((error) => {
        setAccessToken(null);
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function restoreSession(): Promise<string | null> {
  const currentToken = getAccessToken();

  if (currentToken) {
    return currentToken;
  }

  try {
    await refreshAccessToken();
    return getAccessToken();
  } catch {
    setAccessToken(null);
    return null;
  }
}

export async function apiFetch(
  input: RequestInfo,
  init?: RequestInit,
): Promise<Response> {
  const token = getAccessToken();
  const url = API_BASE_URL + input.toString();

  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: token ? `Bearer ${token}` : "",
    },
    credentials: "include",
  });

  if (res.status !== 401) return res;

  // Attempt refresh
  try {
    await refreshAccessToken();
  } catch {
    throw new Error("Session expired");
  }

  const newToken = getAccessToken();

  return fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: newToken ? `Bearer ${newToken}` : "",
    },
    credentials: "include",
  });
}
