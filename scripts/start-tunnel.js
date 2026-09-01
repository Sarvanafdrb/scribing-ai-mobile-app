const { spawn } = require("child_process");

console.log("Starting Expo in TUNNEL mode (works when phone cannot reach PC on Wi-Fi)...\n");

const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["expo", "start", "--tunnel", "--clear", "--port", "8081"],
  { stdio: ["inherit", "pipe", "pipe"], env: process.env, shell: process.platform === "win32" },
);

let printedUrl = false;

function tryPrintTunnelUrl() {
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
          console.log("\n========================================");
          console.log("  TUNNEL READY — use this in Expo Go:");
          console.log(`  exp://${host}`);
          console.log("========================================\n");
        }
      } catch {
        // ngrok not ready yet
      }
    });
  });
  req.on("error", () => {});
  req.setTimeout(2000, () => req.destroy());
}

child.stdout.on("data", (buf) => {
  const text = buf.toString();
  process.stdout.write(text);
  if (text.includes("Tunnel ready")) {
    setTimeout(tryPrintTunnelUrl, 1500);
  }
});

child.stderr.on("data", (buf) => process.stderr.write(buf));
child.on("close", (code) => process.exit(code ?? 1));
