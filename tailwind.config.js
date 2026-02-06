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
          pink: {
            DEFAULT: "#FCE4EC",
            dark: "#F48FB1",
            darker: "#EC407A",
          },
          blue: {
            DEFAULT: "#E3F2FD",
            dark: "#90CAF9",
            darker: "#42A5F5",
          },
          green: {
            DEFAULT: "#E8F5E9",
            dark: "#A5D6A7",
            darker: "#66BB6A",
          },
          yellow: {
            DEFAULT: "#FFF9C4",
            dark: "#FFF59D",
            darker: "#FFEE58",
          },
          lavender: {
            DEFAULT: "#F3E5F5",
            dark: "#CE93D8",
            darker: "#AB47BC",
          },
          mint: {
            DEFAULT: "#B2DFDB",
            dark: "#80CBC4",
            darker: "#4DB6AC",
          },
          peach: {
            DEFAULT: "#FFECB3",
            dark: "#FFE082",
            darker: "#FFCA28",
          },
        },
      },
      borderRadius: {
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}
