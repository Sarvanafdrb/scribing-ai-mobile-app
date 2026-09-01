const { spawn, execSync } = require("child_process");
const os = require("os");

function isWindowsPublicWifi() {
  if (process.platform !== "win32") return false;
  try {
    const out = execSync(
      'powershell -NoProfile -Command "(Get-NetConnectionProfile | Select-Object -First 1).NetworkCategory"',
      { encoding: "utf8" },
    ).trim();
    return out === "Public";
  } catch {
    return false;
  }
}

const publicWifi = isWindowsPublicWifi();

console.log("\n=== Scribing AI — Expo for physical phone ===\n");

if (publicWifi) {
  console.log("WARNING: Your Wi-Fi is PUBLIC. LAN / QR with 192.168.x.x will NOT work.");
  console.log("Using TUNNEL mode automatically.\n");
  console.log("After server starts:");
  console.log("  1. Open Expo Go (SDK 57 APK, not Play Store)");
  console.log("  2. Tap 'Enter URL manually' (do NOT use Scan if it fails)");
  console.log("  3. Paste the exp://....exp.direct URL printed below\n");
} else {
  console.log("Wi-Fi looks Private. Tunnel mode still used for reliability.\n");
}

console.log("Starting tunnel...\n");

const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["expo", "start", "--tunnel", "--clear", "--port", "8081"],
  { stdio: ["inherit", "pipe", "pipe"], env: process.env, shell: process.platform === "win32" },
);

let printedUrl = false;

function printTunnelUrl() {
  if (printedUrl) return;
  const http = require("http");
  const req = http.get("http://127.0.0.1:4040/api/tunnels", (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      try {
        const tunnels = JSON.parse(data).tunnels ?? [];
        const tunnel = tunnels.find((t) => t.proto === "http" && t.public_url?.includes("exp.direct"));
        if (tunnel?.public_url) {
          const host = tunnel.public_url.replace(/^https?:\/\//, "");
          printedUrl = true;
          console.log("\n╔══════════════════════════════════════════════════════╗");
          console.log("║  COPY THIS INTO EXPO GO → Enter URL manually         ║");
          console.log(`║  exp://${host}`);
          console.log("╚══════════════════════════════════════════════════════╝");
          console.log("\nDo NOT use exp://192.168.x.x — that fails on Public Wi-Fi.\n");
        }
      } catch {
        /* ngrok not ready */
      }
    });
  });
  req.on("error", () => {});
  req.setTimeout(3000, () => req.destroy());
}

child.stdout.on("data", (buf) => {
  const text = buf.toString();
  process.stdout.write(text);
  if (text.includes("Tunnel ready")) {
    setTimeout(printTunnelUrl, 2000);
    setTimeout(printTunnelUrl, 5000);
  }
});

child.stderr.on("data", (buf) => process.stderr.write(buf));
child.on("close", (code) => process.exit(code ?? 1));
