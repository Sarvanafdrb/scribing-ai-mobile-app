const path = require("path");
const os = require("os");
const { spawnSync, execSync } = require("child_process");

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

if (isWindowsPublicWifi()) {
  console.error("\nERROR: Wi-Fi is PUBLIC. LAN mode cannot work on your phone.");
  console.error("QR scan will show: Failed to download remote update\n");
  console.error("Use instead:\n  npm run start:phone\n");
  process.exit(1);
}

function getLanIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

const lanIp = getLanIp();
process.env.REACT_NATIVE_PACKAGER_HOSTNAME = lanIp;

console.log(`LAN IP: ${lanIp}`);
console.log(`Expo Go URL: exp://${lanIp}:8081`);
console.log("Using --offline (SDK 57 fix when not logged into Expo CLI)");
console.log("\nIf phone still shows 'Failed to download remote update':");
console.log("  1. On phone browser open: http://" + lanIp + ":8081/status");
console.log("     -> If it FAILS, your Wi-Fi blocks PC access. Use: npm run start:tunnel");
console.log("  2. Or run scripts/open-firewall.ps1 as Administrator\n");

const result = spawnSync(
  process.execPath,
  [expoCli, "start", "--offline", "--clear", "--port", "8081"],
  { stdio: "inherit", env: process.env, cwd: projectRoot, shell: false },
);

process.exit(result.status ?? 1);
