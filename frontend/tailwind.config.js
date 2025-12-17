/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          indigo: {
            pale: '#E0E7FF',
            light: '#6366F1',
            DEFAULT: '#4F46E5',
            dark: '#4338CA',
          },
          amber: {
            pale: '#FEF3C7',
            light: '#FCD34D',
            DEFAULT: '#F59E0B',
            dark: '#D97706',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'message': '16px',
        'card': '12px',
      },
    },
  },
  plugins: [],
}
