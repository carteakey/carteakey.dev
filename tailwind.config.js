/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{njk,md}"],
  darkMode: 'class',
  theme: {
    extend: {
    fontFamily: {
    },
    animation: {
      'spin-slow': 'spin 7s linear infinite',
    }
    }
  },
  plugins: [require("@tailwindcss/typography")],
};
