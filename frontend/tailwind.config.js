/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        '3xl': '1920px',
        '4xl': '2560px',
      },
      colors: {
        primary: {
          50:  '#fff0f0',
          100: '#ffe0e0',
          200: '#ffbfbf',
          300: '#ff9090',
          400: '#f05555',
          500: '#E5312A',
          600: '#CC2A24',
          700: '#a82020',
          900: '#5a0a0a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
