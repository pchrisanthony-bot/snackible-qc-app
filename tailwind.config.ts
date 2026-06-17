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
        brand: {
          green: "#2D6A4F",
          "dark-green": "#1E4D39",
          "light-green": "#EAF3DE",
          "mid-green": "#C5DFAC",
          amber: "#FBAE25",
          "amber-light": "#FEF3D8",
          cream: "#FDF8F0",
        },
      },
      fontFamily: {
        raleway: ["Raleway", "sans-serif"],
        mulish: ["Mulish", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
