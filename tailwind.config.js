/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        premiere: {
          darkest: '#141414',
          dark: '#1e1e1e',
          panel: '#252526',
          header: '#2d2d2d',
          border: '#3c3c3c',
          accent: '#0078d4',
          accentHover: '#1084d8',
          purple: '#9059ff',
          teal: '#00bfa5',
          gold: '#e5a00d',
          danger: '#f44336',
          success: '#4caf50'
        }
      }
    },
  },
  plugins: [],
}
