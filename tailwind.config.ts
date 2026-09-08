import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-poppins)", "Poppins", "system-ui", "sans-serif"],
        poppins: ["var(--font-poppins)", "Poppins", "sans-serif"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#4f46e5",
          foreground: "#ffffff",
          hover: "#4338ca",
        },
        surface: {
          DEFAULT: "#0f172a",
          card: "#1e293b",
          border: "#334155",
          accent: "#1e1b4b",
        },
      },
    },
  },
  plugins: [],
};
export default config;
