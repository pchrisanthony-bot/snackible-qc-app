import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "bg-base": "#003433",
        "bg-surface": "#004845",
        "bg-elevated": "#005a57",
        teal: "#06AA90",
        lime: "#B7C815",
        "amber-brand": "#FFC000",
        "red-brand": "#E84040",
      },
      fontFamily: { sans: ["Inter", "sans-serif"] },
    },
  },
  plugins: [],
} satisfies Config;
