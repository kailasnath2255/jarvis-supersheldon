import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ss: {
          orange: {
            50: "#FFF1E6",
            100: "#FFE0C7",
            200: "#FFC089",
            300: "#FFA14B",
            400: "#FF8526",
            500: "#FF6B1F",
            600: "#E85A12",
            700: "#C24808",
            800: "#8F3505",
            900: "#5C2203",
          },
          ink: {
            100: "#F2F4F7",
            200: "#E5E8EE",
            300: "#C4C9D2",
            400: "#8A91A1",
            500: "#5B6271",
            700: "#2A2E36",
            900: "#0F1115",
          },
          bg: {
            0: "#FFFFFF",
            50: "#FFF8F2",
          },
          success: "#16A34A",
          warning: "#F59E0B",
          error: "#DC2626",
          info: "#2563EB",
        },
      },
      fontFamily: {
        display: [
          '"Plus Jakarta Sans"',
          "Inter",
          "system-ui",
          "sans-serif",
        ],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
      },
      boxShadow: {
        ss: "0 4px 12px rgba(15,17,21,.06)",
        "ss-brand": "0 8px 24px rgba(255,107,31,.25)",
      },
    },
  },
  plugins: [],
};

export default config;
