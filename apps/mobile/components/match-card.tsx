import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { MatchSummary } from "@/lib/types";
import { capacityForPitchType } from "@/lib/venue-slots";

export function MatchCard({ match }: { match: MatchSummary }) {
  const router = useRouter();
  const total = match.participants.length;
  const cap = capacityForPitchType(match.pitch.type);
  const when = new Date(match.startTime);
  const isDone = match.status === "COMPLETED";
  const hasScore = match.homeScore !== null && match.awayScore !== null;

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
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
        {isDone && hasScore ? (
          <View className="rounded-full bg-joga-volt/10 px-3 py-1">
            <Text className="text-xs font-bold text-joga-volt">
              {match.homeScore}–{match.awayScore}
            </Text>
          </View>
        ) : (
          <View className="rounded-full bg-joga-volt/10 px-3 py-1">
            <Text className="text-xs font-bold text-joga-volt">
              {total}/{cap}
            </Text>
          </View>
        )}
      </View>
      <View className="flex-row items-center gap-2">
        <View className="rounded-full border border-joga-border px-2 py-0.5">
          <Text className="text-[10px] font-bold uppercase text-joga-muted">
            {match.matchType}
          </Text>
        </View>
        <View className="rounded-full border border-joga-border px-2 py-0.5">
          <Text className="text-[10px] font-bold uppercase text-joga-muted">
            {match.status}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
