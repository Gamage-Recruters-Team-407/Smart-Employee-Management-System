/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/**/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'lg:hidden',
    'lg:static',
    'lg:translate-x-0',
    '-translate-x-full',
    'translate-x-0',
    'fixed',
    'lg:block',
    'hidden',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}