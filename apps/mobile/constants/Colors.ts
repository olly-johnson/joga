export const colors = {
  black: "#0A0A0A",
  dark: "#121212",
  card: "#1A1A1A",
  border: "#2A2A2A",
  muted: "#6B6B6B",
  text: "#F5F5F5",
  volt: "#CCFF00",
  pink: "#FF2D78",
  cyan: "#00F0FF",
} as const;

export default {
  dark: {
    text: colors.text,
    background: colors.dark,
    tint: colors.volt,
    tabIconDefault: colors.muted,
    tabIconSelected: colors.volt,
  },
};
