module.exports = {
  content: { relative: true, files: ['../../nakayamada/*.html', '../../nakayamada/*.php'] },
  theme: {
    extend: {
      colors: {
        sky: { 500: '#2D9CDB', 600: '#2588C2', 700: '#1B6FA3', 50: '#EBF5FB', 100: '#D6EBF8' },
        forest: { 500: '#27AE60', 600: '#219A52', 700: '#1B8244', 50: '#E8F5E9', 100: '#C8E6C9' },
        warm: { bg: '#FBF8F3', surface: '#FFFFFF', border: '#EDE5D8', ink: '#3E3A33', sub: '#8A8071' }
      },
      fontFamily: {
        sans: ['"Hiragino Maru Gothic ProN"', '"Hiragino Sans"', '"Noto Sans JP"', 'Meiryo', 'sans-serif']
      }
    }
  }
}
