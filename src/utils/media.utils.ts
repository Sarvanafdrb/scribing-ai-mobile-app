import { API_URL, UPLOADS_BASE_URL } from "@/constants/config";

export const getUploadsBaseUrl = (): string => {
  const uploads = UPLOADS_BASE_URL.replace(/\/$/, "");

  if (
    uploads === "http://localhost:5000" &&
    /^https?:\/\/192\.168\.\d+\.\d+(?::\d+)?/i.test(API_URL)
  ) {
    return API_URL.replace(/\/api\/?$/, "");
  }

  if (UPLOADS_BASE_URL) {
    return uploads;
  }

  if (API_URL.startsWith("http://") || API_URL.startsWith("https://")) {
    return API_URL.replace(/\/api\/?$/, "");
  }

  return "http://localhost:5000";
};

export const resolveMediaUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith("s3://")) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = getUploadsBaseUrl();
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${base}${normalizedPath}`;
};
