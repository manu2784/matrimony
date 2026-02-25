let accessToken: string | null = null;
let refreshPromise: Promise<void> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export function getAccessToken() {
  return accessToken;
}

async function refreshToken(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = fetch(API_BASE_URL + "/refresh", {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Refresh failed");
        const data = await res.json();
        setAccessToken(data.accessToken);
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiFetch(
  input: RequestInfo,
  init?: RequestInit
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
    await refreshToken();
  } catch {
    throw new Error("Session expired");
  }

  const newToken = getAccessToken();

  return fetch(input, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: newToken ? `Bearer ${newToken}` : "",
    },
    credentials: "include",
  });
}