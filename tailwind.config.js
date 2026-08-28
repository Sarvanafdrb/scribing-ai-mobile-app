/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./App.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        secondary: "#0F766E",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        background: "#F8FAFC",
        card: "#FFFFFF",
        muted: "#64748B",
        border: "#E2E8F0",
        foreground: "#0F172A",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji",
        ],
      },
      borderRadius: {
        card: "16px",
        button: "12px",
        sheet: "24px",
      },
    },
  },
  plugins: [],
};
