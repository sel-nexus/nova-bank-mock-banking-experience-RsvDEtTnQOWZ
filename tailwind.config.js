/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        nova: {
          midnight: '#0B1F33',
          navy: '#123B5D',
          blue: '#1E5B8C',
          teal: '#0E7490',
          sky: '#DCEFF7',
          mint: '#D8F3EC',
          lime: '#B8E986',
          gold: '#F4C95D',
          coral: '#F28C7B',
          cream: '#F7F5EF',
          ink: '#102A43',
          slate: '#627D98',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 12px 32px rgba(11, 31, 51, 0.08)',
        elevated: '0 20px 48px rgba(11, 31, 51, 0.14)',
      },
      borderRadius: {
        card: '1rem',
      },
    },
  },
  plugins: [],
};