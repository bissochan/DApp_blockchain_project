/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1E3A8A", // Blue for navbar and buttons
        secondary: "#F3F4F6", // Light gray for background
      },
    },
  },
  plugins: [],
};