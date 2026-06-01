import { ActivityIndicator, Text, View } from "react-native";
import { colors } from "@/constants/Colors";
import { Icon, type IconName } from "./icon";

export function LoadingState() {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color={colors.volt} />
    </View>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center px-10">
      <View className="mb-4 h-12 w-12 items-center justify-center rounded-full bg-joga-pink/15">
        <Icon name="alert-circle" size={22} color={colors.pink} />
      </View>
      <Text className="text-center font-body text-base leading-6 text-joga-muted">
        {message}
      </Text>
    </View>
  );
}

export function EmptyState({
  icon = "inbox",
  title,
  message,
}: {
  icon?: IconName;
  title: string;
  message: string;
}) {
  return (
    <View className="flex-1 items-center justify-center px-10 pt-16">
      <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-joga-elevated">
        <Icon name={icon} size={24} color={colors.muted} />
      </View>
      <Text className="mb-1 text-center font-heading text-lg tracking-tight text-joga-text">
        {title}
      </Text>
      <Text className="text-center font-body text-sm leading-6 text-joga-muted">
        {message}
      </Text>
    </View>
  );
}
