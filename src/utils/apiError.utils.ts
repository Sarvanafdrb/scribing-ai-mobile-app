import axios from "axios";

export const MEDICINE_ALREADY_EXISTS_PATTERN =
  /already exists|duplicate medicine|same strength/i;

export function isMedicineDuplicateError(message: string): boolean {
  return MEDICINE_ALREADY_EXISTS_PATTERN.test(message);
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data) as { message?: string };
        if (parsed?.message) return parsed.message;
      } catch {
        if (data.trim()) return data.trim();
      }
    }
    if (data && typeof data === "object" && "message" in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) return message;
    }
  }

  if (error && typeof error === "object" && "response" in error) {
    const data = (error as { response?: { data?: { message?: string } } })
      .response?.data;
    if (data?.message) return data.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
