import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { useRating } from "@/hooks/use-rating";
import { useMe } from "@/hooks/use-me";
import { colors } from "@/constants/Colors";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { data: rating, isLoading: ratingLoading } = useRating();
  const { data: me } = useMe();

  const displayName = me
    ? `${me.firstName} ${me.lastName}`.trim()
    : user?.email ?? "Player";

  return (
    <SafeAreaView className="flex-1 bg-joga-dark" edges={["top"]}>
      <View className="flex-1 px-5 pt-8">
        <View className="mb-8 items-center">
          <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-joga-card">
            <Text className="text-4xl">{"🧑‍⚽"}</Text>
          </View>
          <Text className="mb-1 text-2xl font-bold text-joga-text">
            {displayName}
          </Text>
          {user?.email && (
            <Text className="text-sm text-joga-muted">{user.email}</Text>
          )}
        </View>

        <View className="mb-6 rounded-2xl border border-joga-border bg-joga-card p-5">
          <Text className="mb-1 text-xs font-bold uppercase tracking-wider text-joga-muted">
            ELO rating
          </Text>
          {ratingLoading ? (
            <ActivityIndicator color={colors.volt} />
          ) : (
            <Text className="text-5xl font-extrabold text-joga-volt">
              {rating?.rating ?? 1000}
            </Text>
          )}
          <Text className="mt-2 text-xs text-joga-muted">
            New players start at 1000. Win ranked matches to climb.
          </Text>
        </View>

        <View className="flex-1" />

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
          className="mb-6 w-full items-center rounded-xl border border-joga-border px-8 py-3.5 active:opacity-80"
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Text className="text-base font-bold text-joga-pink">Sign Out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
