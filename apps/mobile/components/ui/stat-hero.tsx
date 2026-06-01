import { Text, View } from "react-native";
import { Icon, type IconName } from "./icon";
import { colors } from "@/constants/Colors";

/**
 * The "balance card" of the app: a large, calm hero used to surface the one
 * number that matters on a screen (e.g. ELO rating). Borrowed straight from the
 * banking-app pattern: oversized figure, quiet label, supporting caption.
 */
export function StatHero({
  label,
  value,
  caption,
  icon,
}: {
  label: string;
  value: string | number;
  caption?: string;
  icon?: IconName;
}) {
  return (
    <View className="overflow-hidden rounded-3xl border border-joga-border bg-joga-card p-6">
      <View className="flex-row items-center justify-between">
        <Text className="font-semibold text-xs uppercase tracking-widest text-joga-muted">
          {label}
        </Text>
        {icon && (
          <View className="h-9 w-9 items-center justify-center rounded-full bg-joga-volt/15">
            <Icon name={icon} size={16} color={colors.volt} />
          </View>
        )}
      </View>

      <Text className="mt-3 font-display text-6xl tracking-tight text-joga-text">
        {value}
      </Text>

      {caption && (
        <Text className="mt-2 font-body text-sm leading-5 text-joga-muted">
          {caption}
        </Text>
      )}
    </View>
  );
}
