import { Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-context";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-joga-dark" edges={["top"]}>
      <View className="flex-1 items-center justify-center px-5">
        <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-joga-card">
          <Text className="text-4xl">{"\uD83E\uDDD1\u200D\u26BD"}</Text>
        </View>
        <Text className="mb-2 text-2xl font-bold text-joga-text">
          Your Profile
        </Text>
        {user?.email && (
          <Text className="mb-2 text-sm text-joga-muted">{user.email}</Text>
        )}
        <Text className="mb-8 text-center text-base text-joga-muted">
          Track your stats, ELO rating, and match history.
        </Text>
        <Pressable
          onPress={() => router.push("/onboarding")}
          className="mb-3 w-full items-center rounded-xl bg-joga-volt px-8 py-3.5 active:opacity-80"
          accessibilityRole="button"
          accessibilityLabel="Set your skill level"
        >
          <Text className="text-base font-bold text-joga-black">
            Set Skill Level
          </Text>
        </Pressable>
        <Pressable
          onPress={signOut}
          className="w-full items-center rounded-xl border border-joga-border px-8 py-3.5 active:opacity-80"
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Text className="text-base font-bold text-joga-pink">Sign Out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
