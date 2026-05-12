import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useVenues } from "@/hooks/use-venues";
import type { Pitch, Venue } from "@/lib/types";
import { colors } from "@/constants/Colors";

function pitchLabel(type: Pitch["type"]): string {
  return type === "FIVE_A_SIDE" ? "5-a-side" : "7-a-side";
}

function VenueCard({ venue }: { venue: Venue }) {
  const router = useRouter();
  const pitch = venue.pitches[0];

  function handleBook() {
    if (!pitch) return;
    router.push(`/book/${pitch.id}`);
  }

  return (
    <View className="mx-4 mb-4 rounded-2xl border border-joga-border bg-joga-card p-4">
      <View className="mb-3 flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="mb-1 text-lg font-bold text-joga-text">
            {venue.name}
          </Text>
          <Text className="text-sm text-joga-muted">
            {venue.latitude.toFixed(2)}, {venue.longitude.toFixed(2)}
          </Text>
        </View>
        {pitch && (
          <View className="rounded-full bg-joga-volt/10 px-3 py-1">
            <Text className="text-xs font-bold text-joga-volt">
              {pitchLabel(pitch.type)}
            </Text>
          </View>
        )}
      </View>

      {pitch && (
        <View className="mb-4 flex-row items-center gap-4">
          <View className="flex-row items-center gap-1.5">
            <View className="h-2 w-2 rounded-full bg-joga-cyan" />
            <Text className="text-sm text-joga-muted">{pitch.surface}</Text>
          </View>
        </View>
      )}

      <Pressable
        onPress={handleBook}
        disabled={!pitch}
        className="items-center rounded-xl bg-joga-volt py-3.5 active:opacity-80"
        accessibilityRole="button"
        accessibilityLabel={`Book ${venue.name}`}
      >
        <Text className="text-base font-bold text-joga-black">Book Now</Text>
      </Pressable>
    </View>
  );
}

export default function VenueFeedScreen() {
  const { data: venues, isLoading, error } = useVenues();

  return (
    <SafeAreaView className="flex-1 bg-joga-dark" edges={["top"]}>
      <View className="px-4 pb-4 pt-2">
        <Text className="text-3xl font-extrabold text-joga-text">
          Nearby Pitches
        </Text>
        <Text className="mt-1 text-sm text-joga-muted">
          Find your next game
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.volt} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-base text-joga-muted">
            Could not load venues. Make sure the API is running.
          </Text>
        </View>
      ) : (
        <FlatList
          data={venues}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VenueCard venue={item} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-8 pt-16">
              <Text className="text-center text-base text-joga-muted">
                No venues yet. Seed the database to see pitches here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
