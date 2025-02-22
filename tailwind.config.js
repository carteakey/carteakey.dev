/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{njk,md}"],
  darkMode: "class",
  theme: {
    fontFamily: {
      'serif': "'Inter', sans-serif", // i know this is not a serif font, but it's a good default
      'et-book': "et-book, serif"
        },
    extend: {
      animation: {
        "spin-slow": "spin 7s linear infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
