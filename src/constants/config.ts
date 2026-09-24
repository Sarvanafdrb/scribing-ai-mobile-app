import { Platform } from "react-native";

export const APP_NAME =
  process.env.EXPO_PUBLIC_APP_NAME || "Scribing AI";

const DEFAULT_API_URL = "http://localhost:5000/api";
const DEFAULT_UPLOADS_URL = "http://localhost:5000";
const LAN_HOST_RE = /^https?:\/\/192\.168\.\d+\.\d+(?::\d+)?/i;

const configuredApiUrl =
  process.env.EXPO_PUBLIC_API_URL?.trim() || DEFAULT_API_URL;
const configuredUploadsUrl =
  process.env.EXPO_PUBLIC_UPLOADS_BASE_URL?.trim() || DEFAULT_UPLOADS_URL;

/** Map a LAN base URL to localhost while preserving path/port suffixes. */
const toLocalhostUrl = (url: string, fallback: string) => {
  try {
    const parsed = new URL(url);
    return `http://localhost:${parsed.port || "5000"}${parsed.pathname}`;
  } catch {
    return fallback;
  }
};

/**
 * Expo web runs in the desktop browser. `.env` often uses a LAN IP for phones,
 * but Windows Firewall frequently blocks loopback to 192.168.x.x on the same PC.
 */
const resolveApiUrl = () => {
  if (Platform.OS !== "web") return configuredApiUrl;

  const webOverride = process.env.EXPO_PUBLIC_WEB_API_URL?.trim();
  if (webOverride) return webOverride;

  if (LAN_HOST_RE.test(configuredApiUrl)) {
    return toLocalhostUrl(configuredApiUrl, DEFAULT_API_URL);
  }

  return configuredApiUrl;
};

const resolveUploadsUrl = () => {
  if (Platform.OS !== "web") return configuredUploadsUrl;

  const webOverride = process.env.EXPO_PUBLIC_WEB_UPLOADS_BASE_URL?.trim();
  if (webOverride) return webOverride;

  if (LAN_HOST_RE.test(configuredUploadsUrl)) {
    return toLocalhostUrl(configuredUploadsUrl, DEFAULT_UPLOADS_URL);
  }

  return configuredUploadsUrl;
};

export const API_URL = resolveApiUrl();
export const UPLOADS_BASE_URL = resolveUploadsUrl();

if (__DEV__) {
  console.info("[config] API_URL:", API_URL);
}

export const PIPELINE_POLL_MS = 2000;
export const TOUCH_TARGET_MIN = 44;
