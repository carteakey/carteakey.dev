/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{njk,md}"],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography")],
};
