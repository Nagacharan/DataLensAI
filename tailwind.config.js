/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        coral: {
          400: '#FF7A59',
          500: '#FA5F38',
          600: '#E24822',
        },
        sage: {
          50: '#F4F7F4',
          100: '#E6EAE3',
          200: '#D7DFDC',
          300: '#CAD5D2',
          400: '#B2C1BD',
        },
        mint: {
          300: '#A7F3D0',
          400: '#6EE7B7',
          500: '#34D399',
        },
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#38a8f8',
          500: '#0e8ce9',
          600: '#026fc7',
          700: '#0358a1',
          800: '#074b85',
          900: '#0c3f6e',
          950: '#082849',
        },
        accent: {
          50: '#fdf4ff',
          100: '#fae8ff',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
        },
        slate: {
          850: '#151e2e',
          950: '#0b0f17',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 25px -5px rgba(14, 140, 233, 0.25)',
        'glow-accent': '0 0 25px -5px rgba(217, 70, 239, 0.25)',
      }
    },
  },
  plugins: [],
}
