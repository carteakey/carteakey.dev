/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{njk,md}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      animation: {
        "spin-slow": "spin 7s linear infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
