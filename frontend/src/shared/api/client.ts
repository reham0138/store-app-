import axios from "axios";

export const TOKEN_STORAGE_KEY = "crown-anchor:session-token";

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // storage unavailable (private mode) — session just won't persist
  }
}

function redirectTo(path: string) {
  if (typeof window === "undefined") return;
  if (window.location.pathname === path) return;
  window.location.assign(path);
}

export const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/api`,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? "";

    // Don't hijack auth endpoints themselves (bad credentials ≠ expired session)
    const isAuthCall = url.includes("/auth/");

    if (status === 401 && !isAuthCall) {
      setAuthToken(null);
      try {
        localStorage.removeItem("crown-anchor:session");
      } catch {
        // ignore
      }
      redirectTo("/login");
    } else if (status === 403) {
      redirectTo("/forbidden");
    }

    return Promise.reject(error);
  },
);
