/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,tsx,jsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          200: '#333',
          750: '#C0C1C1',
        },
      },
    },
  },
  plugins: [],
}
