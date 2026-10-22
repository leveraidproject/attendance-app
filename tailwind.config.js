/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F2A43',
        paper: '#F4F7FA',
        brand: '#1F6FEB',
        clockin: '#16845B',
        clockout: '#C2410C',
      },
    },
  },
  plugins: [],
};
