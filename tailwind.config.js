/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#4F8EF7', 600: '#3E78D6' },
        secondary: '#00A27A',
        surface: {
          0: '#0B0F14',
          1: '#11161E',
          2: '#161C26',
          3: '#1B2230',
        },
        on: { surface: '#D6DCE6', muted: '#9AA6B2', outline: '#2B3647' }
      },
      borderRadius: {
        card: '1.25rem',    // containers
        control: '0.75rem', // buttons/inputs
      },
      boxShadow: {
        e1: '0 1px 2px rgba(0,0,0,.25)',
        e2: '0 4px 12px rgba(0,0,0,.28)',
        e3: '0 10px 24px rgba(0,0,0,.3)',
      }
    }
  },
  plugins: [],
}
