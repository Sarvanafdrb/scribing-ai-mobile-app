/**
 * Writes the PC's current Wi-Fi IPv4 into .env for Expo Go on a physical phone.
 * Run before npm start when login fails with "Cannot reach the API server".
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");

const pickLanIp = () => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    if (!/wi-?fi|wlan|wireless/i.test(name)) continue;
    for (const net of nets[name] || []) {
      if (net.family !== "IPv4" && net.family !== 4) continue;
      if (net.internal) continue;
      if (!net.address.startsWith("192.168.")) continue;
      return net.address;
    }
  }
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family !== "IPv4" && net.family !== 4) continue;
      if (net.internal) continue;
      if (!net.address.startsWith("192.168.")) continue;
      return net.address;
    }
  }
  return null;
};

const ip = pickLanIp();
const quiet = process.argv.includes("--quiet");

if (!ip) {
  console.error("Could not detect a 192.168.x.x LAN address. Connect to Wi-Fi first.");
  process.exit(1);
}

const apiUrl = `http://${ip}:5000/api`;
const uploadsUrl = `http://${ip}:5000`;

let content = fs.existsSync(envPath)
  ? fs.readFileSync(envPath, "utf8")
  : fs.readFileSync(path.join(__dirname, "..", ".env.example"), "utf8");

const setLine = (key, value) => {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  content = re.test(content)
    ? content.replace(re, line)
    : `${content.trim()}\n${line}\n`;
};

setLine("EXPO_PUBLIC_API_URL", apiUrl);
setLine("EXPO_PUBLIC_UPLOADS_BASE_URL", uploadsUrl);

fs.writeFileSync(envPath, content.endsWith("\n") ? content : `${content}\n`);

if (quiet) {
  console.log(`API .env synced for phone login: ${apiUrl}`);
} else {
  console.log("\nUpdated .env for physical phone:");
  console.log(`  EXPO_PUBLIC_API_URL=${apiUrl}`);
  console.log(`  EXPO_PUBLIC_UPLOADS_BASE_URL=${uploadsUrl}`);
  console.log("\nRestart Expo (npm start) and try login again.\n");
}
