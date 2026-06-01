import { Pressable, View } from "react-native";

/**
 * Base surface. Refined-dark cards sit one step above the app background with a
 * hairline border instead of a heavy shadow.
 */
export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View
      className={`rounded-3xl border border-joga-hairline bg-joga-card ${className}`}
    >
      {children}
    </View>
  );
}

export function PressableCard({
  children,
  onPress,
  className = "",
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className={`rounded-3xl border border-joga-hairline bg-joga-card active:opacity-80 ${className}`}
    >
      {children}
    </Pressable>
  );
}
