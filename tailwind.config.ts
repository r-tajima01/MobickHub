import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // モックで使った配色
        bg: "#F7F6F2",
        ink: "#1F1E1B",
        muted: "#5F5E5A",
        line: "#ECEAE0",
        accent: "#378ADD",
        good: "#0F6E56",
        warn: "#854F0B",
        bad: "#993C1D",
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'Meiryo', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
