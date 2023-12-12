/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["*.js", "!vendor.js", "!tailwind.config.js"],
  safelist: ["h-3", "w-3", "h-4", "w-4"], // icon.js
  theme: {
    extend: {},
  },
  plugins: [],
}
