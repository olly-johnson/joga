import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMatches } from "@/hooks/use-matches";
import type { MatchSummary } from "@/lib/types";
import { colors } from "@/constants/Colors";

function capacityFor(type: MatchSummary["pitch"]["type"]) {
  return type === "FIVE_A_SIDE" ? 10 : 14;
}

function MatchCard({ match }: { match: MatchSummary }) {
  const router = useRouter();
  const total = match.participants.length;
  const cap = capacityFor(match.pitch.type);
  const when = new Date(match.startTime);

  return (
    <Pressable
      onPress={() => router.push(`/match/${match.id}`)}
      className="mx-4 mb-3 rounded-2xl border border-joga-border bg-joga-card p-4 active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel={`Open match at ${match.pitch.venue.name}`}
    >
      <View className="mb-2 flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-base font-bold text-joga-text">
            {match.pitch.venue.name}
          </Text>
          <Text className="text-xs text-joga-muted">
            {when.toLocaleString([], {
              weekday: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
        <View className="rounded-full bg-joga-volt/10 px-3 py-1">
          <Text className="text-xs font-bold text-joga-volt">
            {total}/{cap}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center gap-2">
        <View className="rounded-full border border-joga-border px-2 py-0.5">
          <Text className="text-[10px] font-bold uppercase text-joga-muted">
            {match.matchType}
          </Text>
        </View>
        <View className="rounded-full border border-joga-border px-2 py-0.5">
          <Text className="text-[10px] font-bold uppercase text-joga-muted">
            {match.teamSelectionMode}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function MatchesScreen() {
  const { data, isLoading, error } = useMatches();

  return (
    <SafeAreaView className="flex-1 bg-joga-dark" edges={["top"]}>
      <View className="px-4 pb-4 pt-2">
        <Text className="text-3xl font-extrabold text-joga-text">Open Matches</Text>
        <Text className="mt-1 text-sm text-joga-muted">
          Join a game or check your booked matches
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.volt} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-base text-joga-muted">
            Could not load matches. Make sure the API is running.
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MatchCard match={item} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-8 pt-16">
              <Text className="text-center text-base text-joga-muted">
                No matches yet. Book a pitch to start one.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
