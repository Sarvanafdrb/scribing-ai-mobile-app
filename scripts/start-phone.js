const { spawn, execSync } = require("child_process");
const path = require("path");

const projectRoot = path.join(__dirname, "..");
const expoCli = path.join(projectRoot, "node_modules", "expo", "bin", "cli");

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

console.log("\n=== Scribing AI — Expo for physical phone (tunnel) ===\n");

if (publicWifi) {
  console.log("Wi-Fi is PUBLIC — tunnel is required for Expo Go.\n");
} else {
  console.log("Wi-Fi is Private. Using tunnel for Expo Go (reliable on Oppo/Android).\n");
  console.log("Login API uses your PC LAN IP via sync:lan (.env).\n");
}

try {
  execSync("node ./scripts/update-lan-env.js --quiet", {
    stdio: "inherit",
    cwd: projectRoot,
  });
} catch {
  console.warn("Could not update .env LAN IP — run: npm run sync:lan\n");
}

console.log("Starting Expo (tunnel). Wait for 'Tunnel ready', then use the exp.direct URL below.\n");
console.log("If you still see 'Starting LAN' or 'Networking has been disabled', stop Metro (Ctrl+C) and run npm start again.\n");

const expoArgs = ["start", "--tunnel", "--clear", "--port", "8081"];

const child = spawn(process.execPath, [expoCli, ...expoArgs], {
  cwd: projectRoot,
  stdio: ["inherit", "pipe", "pipe"],
  env: process.env,
  shell: false,
  windowsHide: true,
});

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
        const tunnel = tunnels.find(
          (t) => t.proto === "http" && t.public_url?.includes("exp.direct"),
        );
        if (tunnel?.public_url) {
          const host = tunnel.public_url.replace(/^https?:\/\//, "");
          printedUrl = true;
          console.log("\n╔══════════════════════════════════════════════════════╗");
          console.log("║  OPPO / Expo Go: Enter URL manually (paste below)   ║");
          console.log(`║  exp://${host}`);
          console.log("╚══════════════════════════════════════════════════════╝\n");
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
    setTimeout(printTunnelUrl, 10000);
  }
});

child.stderr.on("data", (buf) => process.stderr.write(buf));

child.on("error", (err) => {
  console.error("Failed to start Expo:", err.message);
  process.exit(1);
});

child.on("close", (code) => process.exit(code ?? 1));
