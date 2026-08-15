/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    '../index.html',
    '../guide/**/*.html',
    '../**/*.html',
    '!../_build/**',
    '!../node_modules/**',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0a0a0a',
        primary: {
          50:'#f0f5ff',100:'#dde8ff',200:'#c0d4ff',300:'#95b6ff',
          400:'#6492ff',500:'#2b70ef',600:'#2250df',700:'#1a40b5',
          800:'#13318d',900:'#0e266a',950:'#07194e'
        },
        wood: {
          50:'#fbf7f0', 100:'#f4ead5', 200:'#e8d3a8', 300:'#d8b478',
          400:'#c89052', 500:'#b27340', 600:'#925a32', 700:'#73452a',
          800:'#553224', 900:'#3a221a'
        }
      },
      fontFamily: {
        sans: ['Inter','"Noto Sans JP"','"Hiragino Sans"','"Hiragino Kaku Gothic ProN"','sans-serif'],
        serif: ['"Noto Serif JP"','"Hiragino Mincho ProN"','serif']
      }
    }
  },
  plugins: [],
}
