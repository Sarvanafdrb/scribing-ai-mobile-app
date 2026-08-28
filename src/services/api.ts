import axios from "axios";
import { router } from "expo-router";
import { API_URL } from "@/constants/config";
import { useAuthStore } from "@/store/auth.store";
import { useWorkspaceStore } from "@/store/workspace.store";

const PUBLIC_AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/register-org",
  "/auth/refresh-token",
  "/auth/forgot-password",
  "/auth/reset-password",
];

const getRequestPath = (url?: string) => {
  if (!url) return "";
  return url.replace(API_URL, "").split("?")[0];
};

const isPublicAuthRequest = (url?: string) => {
  const path = getRequestPath(url);
  return PUBLIC_AUTH_PATHS.some(
    (authPath) => path === authPath || path.endsWith(authPath),
  );
};

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
  timeout: 60000,
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    const workspaceId = useWorkspaceStore.getState().selectedWorkspace?.id;

    if (config.headers) {
      delete config.headers.Cookie;
      delete config.headers.cookie;
      delete config.headers["X-User"];
      delete config.headers["X-User-Data"];
      delete config.headers["X-Organization"];
    }

    if (token && !isPublicAuthRequest(config.url)) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers) {
      delete config.headers.Authorization;
    }

    if (workspaceId) {
      config.headers["X-Workspace-Id"] = workspaceId;
    } else if (config.headers) {
      delete config.headers["X-Workspace-Id"];
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isPublicAuthRequest(originalRequest.url)) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;

        if (!refreshToken) {
          return Promise.reject(error);
        }

        const response = await axios.post(
          `${API_URL}/auth/refresh-token`,
          { refreshToken },
          { withCredentials: false },
        );

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data;

        const { user } = useAuthStore.getState();
        useAuthStore.getState().setAuth(user, accessToken, newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        router.replace("/(auth)/login");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
