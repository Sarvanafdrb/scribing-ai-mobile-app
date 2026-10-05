const fs = require("fs");
const path = require("path");

/** Read .env so LAN IP is always in expo.extra (Expo Go + tunnel). */
const loadDotEnv = () => {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return {};

  const vars = {};
  for (const rawLine of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    vars[key] = value;
    if (!process.env[key]) process.env[key] = value;
  }
  return vars;
};

const env = loadDotEnv();
const appJson = require("./app.json");

const apiUrl =
  env.EXPO_PUBLIC_API_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  "http://localhost:5000/api";
const uploadsBaseUrl =
  env.EXPO_PUBLIC_UPLOADS_BASE_URL ||
  process.env.EXPO_PUBLIC_UPLOADS_BASE_URL ||
  "http://localhost:5000";
const appName =
  env.EXPO_PUBLIC_APP_NAME ||
  process.env.EXPO_PUBLIC_APP_NAME ||
  "Scribing AI";

module.exports = {
  expo: {
    ...appJson.expo,
    android: {
      ...appJson.expo.android,
      softwareKeyboardLayoutMode: "resize",
    },
    extra: {
      ...appJson.expo.extra,
      apiUrl,
      uploadsBaseUrl,
      appName,
    },
  },
};
