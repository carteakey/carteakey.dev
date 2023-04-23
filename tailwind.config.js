/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{njk,md}"],
  darkMode: "class",
  theme: {
    fontFamily: {
      'cp': "'Courier Prime', monospace"
        },
    extend: {
      animation: {
        "spin-slow": "spin 7s linear infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
