import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { useRating } from "@/hooks/use-rating";
import { useMe } from "@/hooks/use-me";
import {
  Avatar,
  Button,
  Screen,
  ScreenHeader,
  StatHero,
} from "@/components/ui";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { data: rating, isLoading: ratingLoading } = useRating();
  const { data: me } = useMe();

  const displayName = me
    ? `${me.firstName} ${me.lastName}`.trim()
    : user?.email ?? "Player";

  return (
    <Screen edges={["top"]}>
      <ScreenHeader title="Profile" />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-7 mt-1 items-center">
          <Avatar name={displayName} size="lg" />
          <Text className="mt-4 font-heading text-2xl tracking-tight text-joga-text">
            {displayName}
          </Text>
          {user?.email && (
            <Text className="mt-1 font-body text-sm text-joga-muted">
              {user.email}
            </Text>
          )}
        </View>

        <StatHero
          label="ELO rating"
          value={ratingLoading ? "..." : rating?.rating ?? 1000}
          icon="trending-up"
          caption="New players start at 1000. Win ranked matches to climb the table."
        />

        <View className="mt-6 gap-3">
          <Button
            label="Set skill level"
            variant="secondary"
            icon="sliders"
            onPress={() => router.push("/onboarding")}
            accessibilityLabel="Set your skill level"
          />
          <Button
            label="Sign out"
            variant="danger"
            icon="log-out"
            onPress={signOut}
            accessibilityLabel="Sign out"
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
