/**
 * Joga design tokens (single source of truth).
 *
 * Direction: refined dark. One primary accent (volt) carries CTAs and active
 * state; everything else is a restrained neutral ramp. Pink is reserved for
 * destructive / live state, cyan only for the away team. Values are tuned so
 * secondary text clears WCAG AA on the near-black background.
 *
 * Mirrored in tailwind.config.js under theme.extend.colors.joga.
 */
export const colors = {
  // Neutral ramp (dark -> light)
  black: "#060608", // true black: tab bar, text-on-accent surfaces
  dark: "#0B0B0D", // app background
  card: "#141417", // card / container surface
  elevated: "#1C1C20", // raised surface: inputs, segmented control, chips
  hairline: "#212126", // faint dividers
  border: "#2A2A30", // card borders, stronger dividers

  // Text
  muted: "#8C8C94", // secondary text (AA on dark), inactive icons
  text2: "#B4B4BC", // secondary-emphasis text
  text: "#F4F4F5", // primary text

  // Accents
  volt: "#CCFF00", // primary: CTAs, selected state, branding
  pink: "#FF3D71", // destructive / live only
  cyan: "#00F0FF", // away team only
  onAccent: "#0A0A0A", // text/icon on a volt surface
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
