/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        lavande: '#f4f0fa',
        prune: '#7f5a83',
        rosepale: '#fcecef',
        bleulight: '#e6f0ff',
      },
      backgroundImage: {
        'hero-pattern': "url('/images/bg.jpg')", // chemin vers ton image
        'custom-bg': "var(--custom-bg-url)", // si tu veux lier dynamiquement
      },
    },
  },
  plugins: [],
};
