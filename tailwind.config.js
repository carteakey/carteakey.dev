/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{njk,md}"],
  darkMode: "class",
  theme: {
    fontFamily: {
      'serif': "'Roboto Slab', serif",
      'caveat': "Caveat, serif"
        },
    extend: {
      animation: {
        "spin-slow": "spin 7s linear infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
