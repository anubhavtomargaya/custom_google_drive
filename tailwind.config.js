/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Earthy, peaceful color palette
        earth: {
          50: '#f5f5f0',
          100: '#e6e4d9',
          200: '#d2cdb8',
          300: '#b8b093',
          400: '#9c9475',
          500: '#7d7559',
          600: '#625c47',
          700: '#4a4536',
          800: '#332f26',
          900: '#1f1c17',
        },
        sage: {
          50: '#f2f5f3',
          100: '#dfe7e2',
          200: '#c2d1c8',
          300: '#a0b5a8',
          400: '#7e9886',
          500: '#5d7a67',
          600: '#4a6152',
          700: '#3a4c41',
          800: '#293530',
          900: '#1a211e',
        },
        clay: {
          50: '#fbf7f4',
          100: '#f3e9e2',
          200: '#e7d3c5',
          300: '#d8b7a3',
          400: '#c79a7e',
          500: '#b17d5d',
          600: '#95664a',
          700: '#744f3a',
          800: '#533a2b',
          900: '#35251c',
        },
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 20px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
} 