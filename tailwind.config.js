/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        background: 'var(--color-bg)',
        accent: 'var(--color-accent)',
        texte: 'var(--color-texte)',
        titreH1: 'var(--color-titreH1)',
        titreH2: 'var(--color-titreH2)',
        titreH3: 'var(--color-titreH3)',
        textButton: 'var(--color-text-button)',
      },
      backgroundImage: {
        'hero-pattern': "url('/images/bg.jpg')", // chemin vers ton image
        'custom-bg': 'var(--custom-bg-url)', // si tu veux lier dynamiquement
      },
      backgroundPosition: {
        'custom-mobile': '55% 0',
        'custom-desktop': '0 12%',
      },
    },
  },
  plugins: [],
};
