/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#404040',
        secondary: '#FDE200',
        'secondary-bg': '#d9d9d9',
      },
      fontFamily: {
        sans: ['Poppins-Regular'],
        'poppins-light': ['Poppins-Light'],
        'poppins-regular': ['Poppins-Regular'],
        'poppins-semibold': ['Poppins-SemiBold'],
        'poppins-bold': ['Poppins-Bold'],
        'inter-regular': ['Inter-Regular'],
      },
    },
  },
  plugins: [],
};
