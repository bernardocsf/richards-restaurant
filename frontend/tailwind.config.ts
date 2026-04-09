import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#090b09',
        ink: '#f3f8ea',
        champagne: '#d7ef39',
        mist: '#dbe8c4',
        olive: '#1f5f1f',
        wine: '#274827',
        borderSoft: 'rgba(117, 205, 42, 0.24)'
      },
      fontFamily: {
        heading: ['var(--font-playfair)', 'serif'],
        body: ['var(--font-inter)', 'sans-serif']
      },
      boxShadow: {
        luxe: '0 30px 60px rgba(0, 0, 0, 0.28)',
        soft: '0 18px 40px rgba(0, 0, 0, 0.16)'
      },
      backgroundImage: {
        'gold-fade': 'linear-gradient(135deg, rgba(215,239,57,0.18), rgba(215,239,57,0))',
        'mesh-dark': 'radial-gradient(circle at top left, rgba(215,239,57,0.16), transparent 35%), radial-gradient(circle at bottom right, rgba(31,95,31,0.22), transparent 30%)'
      }
    }
  },
  plugins: []
};

export default config;
