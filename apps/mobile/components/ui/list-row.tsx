import { Pressable, Text, View } from "react-native";
import { colors } from "@/constants/Colors";
import { Icon } from "./icon";

/**
 * Transaction-style list row: leading slot (icon/avatar/badge), a title +
 * optional subtitle, and a trailing slot or chevron. The workhorse layout of
 * banking apps and the backbone of the redesigned lists.
 */
export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  onPress,
  showChevron,
  accessibilityLabel,
}: {
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  accessibilityLabel?: string;
}) {
  const chevron = showChevron ?? Boolean(onPress);

  const body = (
    <View className="flex-row items-center gap-3 px-4 py-3.5">
      {leading}
      <View className="flex-1">
        <Text
          className="font-semibold text-base text-joga-text"
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text className="mt-0.5 font-body text-sm text-joga-muted" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing}
      {chevron && <Icon name="chevron-right" size={18} color={colors.muted} />}
    </View>
  );

  if (!onPress) {
    return (
      <View className="rounded-2xl border border-joga-hairline bg-joga-card">
        {body}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      className="rounded-2xl border border-joga-hairline bg-joga-card active:opacity-80"
    >
      {body}
    </Pressable>
  );
}
