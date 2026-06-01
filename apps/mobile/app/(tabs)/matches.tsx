import { FlatList } from "react-native";
import { useMyMatches } from "@/hooks/use-matches";
import { splitMyMatches } from "@/lib/venue-slots";
import { MatchCard } from "@/components/match-card";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
} from "@/components/ui";

export default function MatchesScreen() {
  const { data, isLoading, error } = useMyMatches();
  const active = data ? splitMyMatches(data).active : [];

  return (
    <Screen edges={["top"]}>
      <ScreenHeader
        title="Matches"
        subtitle="Games you have booked or joined"
      />

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message="Could not load your matches. Make sure the API is running." />
      ) : (
        <FlatList
          data={active}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MatchCard match={item} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="calendar"
              title="No upcoming matches"
              message="Pick a venue to book a slot or join an open game."
            />
          }
        />
      )}
    </Screen>
  );
}
