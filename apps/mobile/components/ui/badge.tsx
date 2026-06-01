import { Text, View } from "react-native";

type Tone = "neutral" | "primary" | "cyan" | "pink" | "outline";

const CONTAINER: Record<Tone, string> = {
  neutral: "bg-joga-elevated",
  primary: "bg-joga-volt/15",
  cyan: "bg-joga-cyan/15",
  pink: "bg-joga-pink/15",
  outline: "border border-joga-border",
};

const LABEL: Record<Tone, string> = {
  neutral: "text-joga-muted",
  primary: "text-joga-volt",
  cyan: "text-joga-cyan",
  pink: "text-joga-pink",
  outline: "text-joga-muted",
};

/**
 * Compact status / metadata pill. Tone maps to the restrained accent system:
 * primary = volt, cyan = away team, pink = live/destructive, neutral otherwise.
 */
export function Badge({
  label,
  tone = "neutral",
  uppercase = false,
}: {
  label: string;
  tone?: Tone;
  uppercase?: boolean;
}) {
  return (
    <View className={`self-start rounded-full px-3 py-1 ${CONTAINER[tone]}`}>
      <Text
        className={`font-semibold text-xs ${LABEL[tone]} ${
          uppercase ? "uppercase tracking-wide" : ""
        }`}
      >
        {label}
      </Text>
    </View>
  );
}
