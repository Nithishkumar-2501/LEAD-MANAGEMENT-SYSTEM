import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-dm-sans)", "DM Sans", "system-ui", "sans-serif"],
      },
      colors: {
        // Awesomic zinc palette
        obsidian: "#09090b",
        graphite: "#18181b",
        "slate-a": "#27272a",
        iron: "#3f3f46",
        steel: "#52525b",
        fog: "#71717a",
        ash: "#a1a1aa",
        mist: "#d4d4d8",
        cloud: "#ececee",
        paper: "#f4f4f5",
        snow: "#ffffff",
        ember: "#ff5a00",
        "magenta-spark": "#fe45e2",
        // Keep functional colors for status indicators
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      borderRadius: {
        "card": "36px",
        "btn": "14px",
        "badge": "12px",
        "pill": "10000px",
        "icon": "40px",
      },
      boxShadow: {
        "subtle": "rgba(255,255,255,0.5) 0px 0.5px 0px 0px inset, rgba(117,123,133,0.4) 0px 9px 14px -5px inset, rgb(44,46,52) 0px 0px 0px 1.5px, rgba(0,0,0,0.14) 0px 4px 6px 0px",
        "subtle-2": "rgb(228,228,231) 0px 1px 0px 0px inset",
        "subtle-3": "rgb(255,255,255) 0px 0.5px 0px 0px inset",
        "md-a": "rgba(0,0,0,0.04) 0px 4px 12px 0px",
      },
      spacing: {
        "18": "4.5rem",
        "68": "17rem",
        "120": "30rem",
      },
      maxWidth: {
        "page": "1200px",
      },
    },
  },
  plugins: [],
};
export default config;
