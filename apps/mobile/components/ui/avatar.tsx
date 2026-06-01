import { Text, View } from "react-native";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SIZES = {
  sm: { box: "h-10 w-10", text: "text-sm" },
  md: { box: "h-12 w-12", text: "text-base" },
  lg: { box: "h-24 w-24", text: "text-3xl" },
} as const;

/**
 * Initials avatar. Replaces emoji placeholders with a clean, professional mark.
 */
export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: keyof typeof SIZES;
}) {
  const s = SIZES[size];
  return (
    <View
      className={`${s.box} items-center justify-center rounded-full border border-joga-border bg-joga-elevated`}
    >
      <Text className={`font-heading ${s.text} tracking-tight text-joga-volt`}>
        {initials(name)}
      </Text>
    </View>
  );
}
