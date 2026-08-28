export interface AccessTokenPayload {
  id?: string;
  email?: string;
  isSuperAdmin?: boolean;
  organizationId?: string;
  roleId?: string;
}

const base64UrlDecode = (value: string): string => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

  if (typeof globalThis.atob === "function") {
    return globalThis.atob(padded);
  }

  // React Native / Expo fallback
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let output = "";
  let buffer = 0;
  let bits = 0;

  for (const char of padded) {
    const index = chars.indexOf(char);
    if (index === -1 || char === "=") continue;
    buffer = (buffer << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }

  return output;
};

export const decodeAccessToken = (
  token: string | null | undefined,
): AccessTokenPayload | null => {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    return JSON.parse(base64UrlDecode(payload)) as AccessTokenPayload;
  } catch {
    return null;
  }
};
