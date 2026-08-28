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

```bash
npx expo start
```

Then press `a` (Android) or `i` (iOS).

## Consultation lifecycle (same as web)

```
Splash → Login → Home → Patient Details → Recording → Uploading
→ Processing → Transcript → AI Notes → Preview → Save → Completed
```

APIs, session statuses, upload algorithm, and polling match the web app.

## Tabs

- Home (encounter-based doctor queue)
- Patients (search, create, start consult)
- History
- Profile

## Also included

- Create / admit patient
- Voice edit on preview
- PDF share + print
- Reset password deep link (`scribingai://reset-password?token=...`)
