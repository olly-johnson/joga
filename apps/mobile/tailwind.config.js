/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        joga: {
          black: "#060608",
          dark: "#0B0B0D",
          card: "#141417",
          elevated: "#1C1C20",
          hairline: "#212126",
          border: "#2A2A30",
          muted: "#8C8C94",
          text2: "#B4B4BC",
          text: "#F4F4F5",
          volt: "#CCFF00",
          pink: "#FF3D71",
          cyan: "#00F0FF",
          onaccent: "#0A0A0A",
        },
      },
      fontFamily: {
        // Explicit Inter cuts. The family name carries the weight, so prefer
        // these over font-bold/-semibold on redesigned screens.
        display: ["Inter_900Black"],
        heading: ["Inter_800ExtraBold"],
        bold: ["Inter_700Bold"],
        semibold: ["Inter_600SemiBold"],
        medium: ["Inter_500Medium"],
        body: ["Inter_400Regular"],
      },
    },
  },
  plugins: [],
};
