/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        nova: {
          midnight: '#1A1A1A',
          navy: '#B11116',
          blue: '#8E0E12',
          teal: '#18794E',
          sky: '#FFEDED',
          mint: '#E7F8EA',
          lime: '#DCB91C',
          gold: '#DCB91C',
          coral: '#EE4F53',
          cream: '#F5F5F5',
          ink: '#1A1A1A',
          slate: '#5D5D5D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 24px rgba(26, 26, 26, 0.08)',
        elevated: '0 16px 40px rgba(177, 17, 22, 0.12)',
      },
      borderRadius: {
        card: '1rem',
      },
    },
  },
  plugins: [],
};