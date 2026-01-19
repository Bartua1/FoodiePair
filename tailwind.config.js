/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAFAFA",
        pastel: {
          pink: "#FCE4EC",
          blue: "#E3F2FD",
          green: "#E8F5E9",
          yellow: "#FFF9C4",
          lavender: "#F3E5F5",
          mint: "#B2DFDB",
          peach: "#FFECB3",
        },
      },
      borderRadius: {
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}
