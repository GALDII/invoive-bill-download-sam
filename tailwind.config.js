/** @type {import('tailwindcss').Config} */
module.exports = {
  // This line tells Tailwind to scan all your .js files in the src folder
  // for class names to include in the final CSS build.
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
