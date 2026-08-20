/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cua: {
          maroon: '#6E0A1E',
          maroonDark: '#4A040E',
          maroonLight: '#8A0E28',
          navy: '#001A38',
          navyDark: '#001024',
          gold: '#D97706',
          goldLight: '#F59E0B',
          amber: '#F59E0B',
          emerald: '#10B981',
          slate: '#F4F6F9',
          border: '#E2E8F0'
        }
      },
      fontFamily: {
        sans: ['Poppins', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
