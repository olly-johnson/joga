import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { colors } from "@/constants/Colors";
import { Icon, type IconName } from "./icon";

type Variant = "primary" | "white" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

const CONTAINER: Record<Variant, string> = {
  primary: "bg-joga-volt active:opacity-90",
  white: "bg-joga-white active:opacity-90",
  secondary: "bg-joga-elevated active:opacity-80",
  ghost: "bg-transparent active:opacity-60",
  danger: "bg-joga-elevated active:opacity-70",
};

const LABEL: Record<Variant, string> = {
  primary: "text-joga-onaccent",
  white: "text-joga-onaccent",
  secondary: "text-joga-text",
  ghost: "text-joga-text",
  danger: "text-joga-pink",
};

const SPINNER: Record<Variant, string> = {
  primary: colors.onAccent,
  white: colors.onAccent,
  secondary: colors.text,
  ghost: colors.text,
  danger: colors.pink,
};

const HEIGHT: Record<Size, string> = {
  md: "min-h-[52px] py-3.5",
  lg: "min-h-[58px] py-4",
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  disabled = false,
  fullWidth = true,
  accessibilityLabel,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
}) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={[
        "flex-row items-center justify-center rounded-full px-6",
        HEIGHT[size],
        isDisabled ? "bg-joga-elevated opacity-60" : CONTAINER[variant],
        fullWidth ? "w-full" : "self-start",
      ].join(" ")}
    >
      {loading ? (
        <ActivityIndicator color={SPINNER[variant]} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon && (
            <Icon
              name={icon}
              size={18}
              color={isDisabled ? colors.muted : SPINNER[variant]}
            />
          )}
          <Text
            className={[
              "font-semibold text-base",
              isDisabled ? "text-joga-muted" : LABEL[variant],
            ].join(" ")}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
