/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bch: {
          green: "#0AC18E",
          dark: "#055B43",
          light: "#E6FBF4",
        },
        cyber: {
          900: "#0b0f19",
          800: "#111827",
          700: "#1f2937",
          600: "#374151",
          accent: "#00FF66",
        }
      },
      fontFamily: {
        mono: ['Fira Code', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      }
    },
  },
  plugins: [],
}
