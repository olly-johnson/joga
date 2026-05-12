/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        joga: {
          black: "#0A0A0A",
          dark: "#121212",
          card: "#1A1A1A",
          border: "#2A2A2A",
          muted: "#6B6B6B",
          text: "#F5F5F5",
          volt: "#CCFF00",
          pink: "#FF2D78",
          cyan: "#00F0FF",
        },
      },
      fontFamily: {
        display: ["Inter_900Black", "System"],
        heading: ["Inter_700Bold", "System"],
        body: ["Inter_400Regular", "System"],
      },
    },
  },
  plugins: [],
};
