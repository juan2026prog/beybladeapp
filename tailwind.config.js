/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        beyblade: {
          dark: '#050B14',
          darker: '#02050A',
          card: '#0E1726',
          electricCyan: '#00F0FF',
          electricRed: '#FF0055',
          gold: '#FFD700',
          silver: '#C0C0C0',
          bronze: '#CD7F32'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        esports: ['"Barlow Condensed"', 'sans-serif'],
        title: ['"Russo One"', 'sans-serif']
      },
      boxShadow: {
        'neon-cyan': '0 0 10px rgba(0, 240, 255, 0.5), 0 0 20px rgba(0, 240, 255, 0.2)',
        'neon-red': '0 0 10px rgba(255, 0, 85, 0.5), 0 0 20px rgba(255, 0, 85, 0.2)',
        'neon-gold': '0 0 10px rgba(255, 215, 0, 0.5)'
      },
      backgroundImage: {
        'electric-gradient': 'linear-gradient(135deg, #050B14 0%, #0E1726 100%)',
        'cyan-red-gradient': 'linear-gradient(90deg, #00F0FF 0%, #FF0055 100%)'
      }
    },
  },
  plugins: [],
}
