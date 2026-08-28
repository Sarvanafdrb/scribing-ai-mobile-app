import { isAxiosError } from "axios";

/** Same login error messaging strategy as web login page. */
export const getLoginErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    if (!error.response) {
      return "Cannot reach the API server. Check EXPO_PUBLIC_API_URL and start the backend.";
    }

    const status = error.response.status;
    const message = (error.response.data as { message?: string })?.message;

    if (status === 503 && message) return message;
    if (message) return message;

    if (status === 503) {
      return "Cannot reach the API server. Check EXPO_PUBLIC_API_URL and start the backend.";
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
