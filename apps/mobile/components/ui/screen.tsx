import { Text, View } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

export function Screen({
  children,
  edges = ["top"],
  className = "",
}: {
  children: React.ReactNode;
  edges?: Edge[];
  className?: string;
}) {
  return (
    <SafeAreaView edges={edges} className={`flex-1 bg-joga-dark ${className}`}>
      {children}
    </SafeAreaView>
  );
}

/**
 * Large screen title block. One consistent header across every screen: the
 * single biggest contributor to the app feeling coherent.
 */
export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between px-5 pb-5 pt-2">
      <View className="flex-1">
        <Text className="font-heading text-[28px] leading-tight tracking-tight text-joga-text">
          {title}
        </Text>
        {subtitle && (
          <Text className="mt-1 font-body text-sm text-joga-muted">
            {subtitle}
          </Text>
        )}
      </View>
      {right}
    </View>
  );
}

/** Small uppercase section label used above grouped content. */
export function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="mb-3 font-semibold text-xs uppercase tracking-widest text-joga-muted">
      {children}
    </Text>
  );
}
