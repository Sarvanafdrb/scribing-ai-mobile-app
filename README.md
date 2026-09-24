# Scribing AI Mobile App

Production-ready React Native (Expo) doctor app for the Scribing AI platform.

## Stack

- Expo SDK 57 + Expo Router
- TypeScript
- React Query + Zustand
- NativeWind (Tailwind)
- React Hook Form + Zod
- Expo AV / Secure Store / Image / FileSystem

## Setup

```bash
cd scribing-ai-mobile-app
npm install
cp .env.example .env
```

Update `.env`:

```bash
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:5000/api
EXPO_PUBLIC_UPLOADS_BASE_URL=http://YOUR_LAN_IP:5000
EXPO_PUBLIC_APP_NAME=Scribing AI
```

> Use your machine LAN IP (not `localhost`) when testing on a physical device.

## Run

**Physical phone (Expo Go):**

```bash
npm run start:lan
```

Scan the QR code. Do **not** use plain `npm start` — without `--lan`, the phone cannot reach Metro on your PC.

**Emulator on this PC:**

```bash
npm start
```

Then press `a` (Android) or `i` (iOS).

## Consultation lifecycle (same as web)

```
Splash → Login → Home → Patient Details → Recording → Uploading
→ Processing → Transcript → AI Notes → Preview → Save → Completed
```

APIs, session statuses, upload algorithm, and polling match the web app.

## Tabs (Doctor Workspace — aligned with web)

- **Consultations** — today's clinic queue, appointment check-in, **Brief** + **Open** (same flow as web `/doctor/consultations`)
- **Schedule** — today / week / upcoming appointments (read-only; check-in from Consultations)
- **Patients** — search, profile, start consult → pre-visit brief
- **History** — past sessions
- **Profile** — workspace switcher, settings

## Doctor Workspace flows (iOS & Android)

| Web | Mobile |
|-----|--------|
| `/doctor/consultations` | Consultations tab |
| Pre-visit brief | `/consultation/:id/brief` |
| Workspace session | `/consultation/:id/*` (record → notes → preview) |
| Save + disposition | Preview → **Save Consultation** sheet (home / follow-up / IP rounds) |
| `/doctor/schedule` | Schedule tab |
| `/doctor/patients/:id` | `/patient/:id` + history |
| Appointment check-in | Consultations → **Check in** |

Permissions match web: `SESSION_VIEW` + `RECORDING_CREATE` (`canAccessDoctorWorkspace`).

## Also included

- Create / admit patient
- Voice edit on preview
- PDF share + print
- **SMS to patient** (after consultation completed — same API as web)
- **Workspace switcher** on Profile (when multiple workspaces)
- Reset password deep link (`scribingai://reset-password?token=...`)

## SMS (matches web)

After a consultation is marked **completed**, doctors can send a patient SMS from:

- **Completed** screen
- **Preview** screen (when reopening a completed consultation)

Uses `POST /sessions/:id/sms` and shows latest delivery status.

## Run the mobile app (step by step)

### 1. Prerequisites

- Node.js 18+
- [Expo Go](https://expo.dev/go) on your phone **or** Android Studio / Xcode emulator
- Backend API running (`scribing-ai-api` on port `5000`)

### 2. Install & configure

```bash
cd scribing-ai-mobile-app
npm install
cp .env.example .env
```

Edit `.env` — use your PC **LAN IP**, not `localhost`, for physical devices:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.10:5000/api
EXPO_PUBLIC_UPLOADS_BASE_URL=http://192.168.1.10:5000
EXPO_PUBLIC_APP_NAME=Scribing AI
```

Find LAN IP:

- Windows: `ipconfig` → IPv4 Address
- Mac: System Settings → Network

### 3. Start Expo

**Phone (Expo Go) — use this command:**

```bash
npm run start:lan
```

This uses `--offline` mode (required for SDK 57 when not logged into Expo CLI) and prints your `exp://` URL.

**If LAN still fails:**

```bash
npm run start:tunnel
```

Then:

| Target | Action |
|--------|--------|
| **Android phone** | Scan QR with Expo Go |
| **Android emulator** | Press `a` |
| **iPhone simulator** | Press `i` (macOS only) |
| **Web preview** | Press `w` |

### 4. Troubleshooting

#### `Failed to download remote update` / `java.io.IOException` (Expo Go)

**Most common cause on SDK 57:** Expo CLI is **not logged in**, which breaks the dev manifest handshake. Fix:

```bash
npm run start:lan
```

(`--offline` is applied automatically — do **not** use plain `npx expo start`.)

**Alternative:** log in once, then normal LAN works:

```bash
npx expo login
npm run start:lan
```

If your phone still cannot reach the PC (Wi‑Fi isolation, firewall):

1. **Expo Go SDK 57** — Play Store version is SDK 54 and will NOT work. See [Incompatible SDK version](#incompatible-sdk-version-expo-go) below.
2. **Same Wi‑Fi** — phone and PC on the same network (not mobile data, not guest Wi‑Fi).
3. **Windows Firewall** — run PowerShell **as Administrator**:
   ```powershell
   netsh advfirewall firewall add rule name="Expo Metro 8081" dir=in action=allow protocol=TCP localport=8081
   ```
4. **Tunnel mode** (works even on different networks):
   ```bash
   npm run start:tunnel
   ```
5. **Manual URL in Expo Go** → “Enter URL manually”:
   ```text
   exp://192.168.18.71:8081
   ```
   (Replace with your PC IP from `ipconfig`.)
6. Turn off **VPN** on phone and PC.
7. Project is under **OneDrive** — pause OneDrive sync while running Expo, or copy project to e.g. `C:\dev\Titanium`.

#### `Incompatible SDK version` (Expo Go)

Your project uses **Expo SDK 57**. The **Google Play Store Expo Go is still SDK 54** — updating from the store does not help.

**You must sideload Expo Go 57:**

```bash
npm run expo-go:install
```

Then on your **phone**:

1. **Uninstall** Expo Go completely (Settings → Apps → Expo Go → Uninstall)
2. Open this link **on the phone browser** (not PC):
   https://github.com/expo/expo-go-releases/releases/download/Expo-Go-57.0.9/Expo-Go-57.0.9.apk
3. Allow **Install unknown apps** for your browser if prompted
4. Install the APK
5. **Do not** reinstall or update Expo Go from Play Store afterward
6. Open Expo Go → Profile — it should show **SDK 57**
7. Run `npm run start:tunnel` and connect again

**Your PC LAN IP (current):** `192.168.18.71`

- **Upload shows “Failed to fetch” / CORS on S3** → Normal in Expo **web** (browser blocks direct S3 PUT). The app automatically retries via **`POST …/recording/upload`** (API → storage). On a **phone** (Expo Go), direct S3 may still work; API fallback applies if it fails.
- **Network error / login fails** → Check `EXPO_PUBLIC_API_URL` uses LAN IP and backend allows CORS from Expo
- **Cannot connect** → Phone and PC must be on the same Wi‑Fi
- **SMS not sent** → Consultation must be `completed`; patient needs valid 10-digit Indian mobile

## Tamil quick guide (சுருக்கம்)

```bash
cd scribing-ai-mobile-app
npm install
cp .env.example .env
# .env la EXPO_PUBLIC_API_URL = http://YOUR_IP:5000/api
npm run start:lan
```

Phone-la Expo Go install pannitu QR scan pannunga. Backend (`scribing-ai-api`) run aagirukkanum.
