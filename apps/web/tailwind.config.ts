import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Warm editorial palette
        ivory: "#F0EEE6", // page background
        paper: "#FAF9F5", // raised surfaces / cards
        oat: "#E8E4D9", // subtle alternate background
        line: "#DEDAD0", // hairline borders
        ink: {
          DEFAULT: "#181818", // headings, primary text
          soft: "#3D3D3A", // body text
        },
        slate: "#262625", // dark sections
        muted: "#6E6D64", // secondary text
        coral: {
          DEFAULT: "#C96442", // primary accent
          dark: "#A84B2D",
          soft: "#F3E0D5", // tinted callout background
        },
        kraft: "#D4A27F", // warm secondary accent
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      boxShadow: {
        card: "0 1px 2px rgba(24, 24, 24, 0.04), 0 8px 24px rgba(24, 24, 24, 0.05)",
        lift: "0 2px 4px rgba(24, 24, 24, 0.05), 0 16px 40px rgba(24, 24, 24, 0.10)",
        glow: "0 0 80px rgba(201, 100, 66, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
