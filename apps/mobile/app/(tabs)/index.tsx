import { FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useVenues } from "@/hooks/use-venues";
import type { Pitch, Venue } from "@/lib/types";
import { colors } from "@/constants/Colors";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  LoadingState,
  Screen,
  ScreenHeader,
} from "@/components/ui";

function summarisePitches(pitches: Pitch[]): string {
  if (pitches.length === 0) return "No pitches listed";
  const has5 = pitches.some((p) => p.type === "FIVE_A_SIDE");
  const has7 = pitches.some((p) => p.type === "SEVEN_A_SIDE");
  const sizes = [has5 && "5-a-side", has7 && "7-a-side"].filter(Boolean).join(" & ");
  const count = `${pitches.length} ${pitches.length === 1 ? "pitch" : "pitches"}`;
  return sizes ? `${count} · ${sizes}` : count;
}

function VenueCard({ venue }: { venue: Venue }) {
  const router = useRouter();
  const surfaces = Array.from(new Set(venue.pitches.map((p) => p.surface)));

  return (
    <Card className="mx-5 mb-4 p-5">
      <View className="mb-4 flex-row items-center gap-3.5">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-joga-volt/15">
          <Icon name="map-pin" size={20} color={colors.volt} />
        </View>
        <View className="flex-1">
          <Text className="font-heading text-lg leading-6 tracking-tight text-joga-text">
            {venue.name}
          </Text>
          <Text className="mt-0.5 font-body text-sm text-joga-muted">
            {summarisePitches(venue.pitches)}
          </Text>
        </View>
      </View>

      {surfaces.length > 0 && (
        <View className="mb-5 flex-row flex-wrap gap-2">
          {surfaces.map((s) => (
            <Badge key={s} label={s} tone="neutral" />
          ))}
        </View>
      )}

      <Button
        label="View slots & matches"
        icon="arrow-right"
        onPress={() => router.push(`/venue/${venue.id}`)}
        accessibilityLabel={`View slots and matches at ${venue.name}`}
      />
    </Card>
  );
}

export default function VenueFeedScreen() {
  const { data: venues, isLoading, error } = useVenues();

  return (
    <Screen edges={["top"]}>
      <ScreenHeader
        title="Pitches"
        subtitle="Book a slot or join a game near you"
      />

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message="Could not load venues. Make sure the API is running." />
      ) : (
        <FlatList
          data={venues}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VenueCard venue={item} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="map-pin"
              title="No venues yet"
              message="Seed the database to see pitches and open matches here."
            />
          }
        />
      )}
    </Screen>
  );
}
