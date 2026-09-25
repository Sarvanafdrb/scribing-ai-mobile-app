import { isAxiosError } from "axios";
import { API_URL } from "@/constants/config";

const networkUnreachableMessage = () => {
  const base =
    "Cannot reach the API server. Check EXPO_PUBLIC_API_URL and start the backend.";
  if (!__DEV__) return base;

  const hint =
    "On your phone, open Safari/Chrome and visit the health URL (same host, no /api): " +
    `${API_URL.replace(/\/api\/?$/, "")}/health`;

  return `${base}\n\nApp is using:\n${API_URL}\n\n${hint}`;
};

/** Same login error messaging strategy as web login page. */
export const getLoginErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    if (!error.response) {
      const code = error.code ? ` (${error.code})` : "";
      return `${networkUnreachableMessage()}${code}`;
    }

    const status = error.response.status;
    const message = (error.response.data as { message?: string })?.message;

    if (status === 503 && message) return message;
    if (message) return message;

    if (status === 503) {
      return networkUnreachableMessage();
    }

    return "Invalid credentials";
  }

  if (
    error instanceof Error &&
    error.message !== "No refresh token available"
  ) {
    return error.message;
  }

  return "Invalid credentials";
};
