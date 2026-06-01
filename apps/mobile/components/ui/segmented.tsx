import { Pressable, Text, View } from "react-native";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

/**
 * Pill segmented control: the professional replacement for rows of bordered
 * "choice chips". The selected segment lifts on a volt surface.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View className="flex-row rounded-2xl border border-joga-border bg-joga-elevated p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={opt.label}
            className={`min-h-[42px] flex-1 items-center justify-center rounded-xl px-3 ${
              active ? "bg-joga-volt" : "active:opacity-70"
            }`}
          >
            <Text
              className={`font-semibold text-sm ${
                active ? "text-joga-onaccent" : "text-joga-muted"
              }`}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
