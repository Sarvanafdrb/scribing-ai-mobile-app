import { UPLOADS_BASE_URL, API_URL } from "@/constants/config";

export const getUploadsBaseUrl = (): string => {
  if (UPLOADS_BASE_URL) {
    return UPLOADS_BASE_URL.replace(/\/$/, "");
  }

  if (API_URL.startsWith("http://") || API_URL.startsWith("https://")) {
    return API_URL.replace(/\/api\/?$/, "");
  }

  return "http://localhost:5000";
};

export const resolveMediaUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = getUploadsBaseUrl();
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${base}${normalizedPath}`;
};
