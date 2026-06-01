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

export default function HistoryScreen() {
  const { data, isLoading, error } = useMyMatches();
  const history = data ? splitMyMatches(data).history : [];

  return (
    <Screen edges={["top"]}>
      <ScreenHeader
        title="History"
        subtitle="Your completed and cancelled matches"
      />

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message="Could not load history. Make sure the API is running." />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MatchCard match={item} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="clock"
              title="No past matches yet"
              message="Completed and cancelled games will appear here."
            />
          }
        />
      )}
    </Screen>
  );
}
