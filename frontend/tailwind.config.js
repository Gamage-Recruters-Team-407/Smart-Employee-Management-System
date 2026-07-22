/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/**/**/*.{js,ts,jsx,tsx}",   // අමතරව
  ],
  safelist: [
    // Critical responsive classes for sidebar
    'lg:hidden',
    'lg:static',
    'lg:translate-x-0',
    '-translate-x-full',
    'translate-x-0',
    'lg:block',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}