/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      // Custom breakpoints
      // Default (0px ~ 360px): Mobile
      // sm (361px ~ 599px): Tablet
      // md (600px ~): Desktop
      'sm': '361px',    // 360px 초과 ~ 600px 미만 (태블릿)
      'md': '600px',    // 600px 이상 (데스크톱)
    },
    extend: {
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'sans-serif'],
        pretendard: ['Pretendard Variable', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Text Styles (size + weight)
        '36b': ['36px', { lineHeight: '48px', fontWeight: '700' }],
        '32b': ['32px', { lineHeight: '44px', fontWeight: '700' }],
        '24b': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        '20b': ['20px', { lineHeight: '28px', fontWeight: '700' }],
        '18b': ['18px', { lineHeight: '24px', fontWeight: '700' }],
        '18m': ['18px', { lineHeight: '24px', fontWeight: '500' }],
        '16b': ['16px', { lineHeight: '22px', fontWeight: '700' }],
        '16m': ['16px', { lineHeight: '22px', fontWeight: '500' }],
        '14b': ['14px', { lineHeight: '20px', fontWeight: '600' }],
        '14m': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        '14r': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        '28b': ['28px', { lineHeight: '38px', fontWeight: '700' }],
        '18sb': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        '16sb': ['16px', { lineHeight: '22px', fontWeight: '600' }],
        '15sb': ['15px', { lineHeight: '20px', fontWeight: '600' }],
        '15m': ['15px', { lineHeight: '20px', fontWeight: '500' }],
        '13m': ['13px', { lineHeight: '18px', fontWeight: '500' }],
        '13r': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        '12b': ['12px', { lineHeight: '16px', fontWeight: '600' }],
        '12m': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        '12r': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        '11m': ['11px', { lineHeight: '16px', fontWeight: '500' }],
        '11r': ['11px', { lineHeight: '16px', fontWeight: '400' }],
        '10r': ['10px', { lineHeight: '14px', fontWeight: '400' }],
      },
      colors: {
        // Primary Colors
        primary: {
          black: '#000000',      // primary/black
          white: '#FFFFFF',      // primary/white
          500: '#2C9696',        // primary/500 (민트 색상)
        },
        // Gray Scale
        gray: {
          900: '#25272D',        // gray/900
          800: '#2B2F36',        // gray/800
          700: '#3B4049',        // gray/700
          600: '#515968',        // gray/600
          500: '#657085',        // gray/500
          400: '#7E89A0',        // gray/400
          300: '#97A2B9',        // gray/300
          200: '#B6BECE',        // gray/200
          100: '#D4D9E2',        // gray/100
          90: '#E3E7ED',         // gray/90
          75: '#EDEFF3',         // gray/75
          50: '#F3F4F7',         // gray/50
          25: '#F9FAFB',         // gray/25
        },
        // Mint Colors
        mint: {
          600: '#20797E',        // mint 600
          500: '#2C9696',        // mint 500 (primary)
          400: '#22BCB7',        // mint 400
          300: '#7AD7D4',        // mint 300
          50: '#D7F9F9',         // mint 50
          25: '#EDFDFC',         // mint 25
        },
        // Blue Colors
        blue: {
          600: '#007AF5',        // blue 600
          500: '#2E96FF',        // blue 500
          400: '#52A8FF',        // blue 400
          300: '#80BFFF',        // blue 300
          50: '#CFE7FF',         // blue 50
          25: '#EBF5FF',         // blue 25
        },
        // Red Colors
        red: {
          400: '#FF4747',        // red 400
          50: '#FFDBDB',         // red 50
          25: '#FFF3F3',         // red 25
        },
      },
    },
  },
  plugins: [],
}
