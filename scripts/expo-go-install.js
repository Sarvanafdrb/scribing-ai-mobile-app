#!/usr/bin/env node
/**
 * Prints steps to install Expo Go matching this project's SDK (57).
 * Play Store Expo Go is SDK 54 — it will NOT work with this project.
 */

const { execSync } = require("child_process");

console.log("\n=== Expo Go SDK 57 install (Android) ===\n");
console.log("Your project uses Expo SDK 57.");
console.log("Play Store Expo Go is SDK 54 — that causes 'Incompatible SDK version'.\n");

let apkUrl = "https://github.com/expo/expo-go-releases/releases/download/Expo-Go-57.0.9/Expo-Go-57.0.9.apk";
try {
  apkUrl = execSync("npx expo-go url android 57", { encoding: "utf8" })
    .split("\n")
    .find((l) => l.startsWith("Download Expo Go from "))
    ?.replace("Download Expo Go from ", "")
    .trim();
} catch {
  // use default
}

console.log("STEP 1 — On your phone:");
console.log("  Settings -> Apps -> Expo Go -> Uninstall");
console.log("  (Remove Play Store version completely)\n");

console.log("STEP 2 — Allow APK install:");
console.log("  Settings -> Security -> Install unknown apps");
console.log("  Enable for Chrome or your browser\n");

console.log("STEP 3 — Download and install SDK 57 Expo Go:");
console.log(`  ${apkUrl}\n`);
console.log("  Open this link ON YOUR PHONE browser, download APK, install.\n");

console.log("STEP 4 — Do NOT update Expo Go from Play Store after this.\n");

console.log("STEP 5 — Start dev server and connect:");
console.log("  npm run start:tunnel");
console.log("  Scan QR or enter the exp://....exp.direct URL in Expo Go\n");

console.log("Verify: Open Expo Go -> Profile -> should show SDK 57\n");
