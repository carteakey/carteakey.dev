/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{njk,md}"],
  darkMode: 'class',
  theme: {
    extend: {
    fontFamily: {
      plex: ['"IBM Plex Sans"']
    }
    }
  },
  plugins: [require("@tailwindcss/typography")],
};
