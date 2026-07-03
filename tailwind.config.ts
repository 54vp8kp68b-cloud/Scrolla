import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core dark palette — feels like a video app, not a school site
        ink: {
          950: "#050508",
          900: "#0a0a0f",
          800: "#121218",
          700: "#1c1c24",
          600: "#2a2a34",
        },
        brand: {
          DEFAULT: "#7c5cff", // electric violet
          hover: "#8f73ff",
          glow: "#a78bfa",
        },
        accent: {
          DEFAULT: "#22d3ee", // cyan pop
          pink: "#f472b6",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out both",
        "fade-in": "fadeIn 0.4s ease-out both",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
