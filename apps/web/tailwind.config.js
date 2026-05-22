/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#0f1622',
          700: '#2a3344',
          500: '#5b667a',
          400: '#8590a3',
          300: '#b4bccb',
        },
        line: {
          DEFAULT: '#e3e7ee',
          2: '#eef1f6',
        },
        'bg-soft': '#f6f8fb',
        'bg-soft-2': '#f0f3f8',
        accent: {
          blue: '#3ea3ff',
          orange: '#b86a2b',
          yellow: '#ffb829',
          red: '#ea4242',
        },
        // Backwards-compat brand-* mapped to new design system
        brand: {
          50: '#f6f8fb',
          100: '#eef1f6',
          200: '#e3e7ee',
          300: '#b4bccb',
          400: '#8590a3',
          500: '#3ea3ff',
          600: '#0f1622',
          700: '#0f1622',
          900: '#0f1622',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      boxShadow: {
        sm: '0 1px 2px rgba(15,22,34,.04), 0 1px 1px rgba(15,22,34,.03)',
        md: '0 6px 24px -8px rgba(15,22,34,.12), 0 2px 6px rgba(15,22,34,.05)',
        lg: '0 24px 60px -20px rgba(15,22,34,.20), 0 6px 18px rgba(15,22,34,.06)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
