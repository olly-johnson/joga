/**
 * Joga design tokens (single source of truth).
 *
 * Matched to the reference banking app: a warm charcoal base (not pure black),
 * raised charcoal surfaces, a soft lime accent, and white. Sampled directly
 * from the reference palette swatches (#2F2F2F / #3F3F3F / #C9F259 / #FFFFFF).
 *
 * Lime is the single primary accent (CTAs, selected state, branding). White is
 * used for high-emphasis pills/cards. Pink is reserved for destructive state.
 * Mirrored in tailwind.config.js under theme.extend.colors.joga.
 */
export const colors = {
  // Neutral ramp (dark -> light), warm charcoal family
  black: "#161618", // deepest: behind sheets, on-accent alt
  dark: "#262628", // app background
  card: "#2F2F33", // card / container surface (reference #2F2F2F)
  elevated: "#3A3A3F", // raised surface: inputs, segmented track, chips (#3F3F3F)
  hairline: "#363639", // faint dividers
  border: "#45454B", // card borders, stronger dividers

  // Text
  muted: "#9C9CA2", // secondary text (AA on charcoal), inactive icons
  text2: "#CACAD0", // secondary-emphasis text
  text: "#F7F7F8", // primary text

  // Accents
  white: "#FFFFFF", // high-emphasis pills / cards
  volt: "#C9F259", // primary accent: CTAs, selected state, branding (lime)
  pink: "#FF6B6B", // destructive state only
  onAccent: "#18181A", // text/icon on a lime or white surface
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
