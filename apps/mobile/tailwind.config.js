/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        joga: {
          black: "#161618",
          dark: "#262628",
          card: "#2F2F33",
          elevated: "#3A3A3F",
          hairline: "#363639",
          border: "#45454B",
          muted: "#9C9CA2",
          text2: "#CACAD0",
          text: "#F7F7F8",
          white: "#FFFFFF",
          volt: "#C9F259",
          pink: "#FF6B6B",
          onaccent: "#18181A",
        },
      },
      fontFamily: {
        // Space Grotesk (matches the reference). The family name carries the
        // weight, so prefer these over font-bold/-semibold.
        display: ["SpaceGrotesk_700Bold"],
        heading: ["SpaceGrotesk_700Bold"],
        bold: ["SpaceGrotesk_700Bold"],
        semibold: ["SpaceGrotesk_600SemiBold"],
        medium: ["SpaceGrotesk_500Medium"],
        body: ["SpaceGrotesk_400Regular"],
      },
    },
  },
  plugins: [],
};
