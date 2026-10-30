/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F2A43',
        paper: '#EAF4F6',
        mist: '#EAF4F6',
        brand: '#137684',
        clockin: '#16845B',
        clockout: '#C2410C',
        tealtint: '#CFEBEF',
        bluetint: '#D9E3F1',
        peachtint: '#FDE3D2',
      },
    },
  },
  plugins: [],
};
