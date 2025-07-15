module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {      
        screens: {
          'landscape': { 'raw': '(min-aspect-ratio: 4/3)' }, 
          'portrait': { 'raw': '(max-aspect-ratio: 4/3)' },           
        },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}; 