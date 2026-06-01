import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { MatchSummary } from "@/lib/types";
import { capacityForPitchType } from "@/lib/venue-slots";
import { PressableCard } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { colors } from "@/constants/Colors";

function pitchLabel(type: MatchSummary["pitch"]["type"]): string {
  return type === "FIVE_A_SIDE" ? "5-a-side" : "7-a-side";
}

export function MatchCard({ match }: { match: MatchSummary }) {
  const router = useRouter();
  const total = match.participants.length;
  const cap = capacityForPitchType(match.pitch.type);
  const when = new Date(match.startTime);
  const isDone = match.status === "COMPLETED";
  const hasScore = match.homeScore !== null && match.awayScore !== null;

  const weekday = when.toLocaleDateString([], { weekday: "short" });
  const day = when.toLocaleDateString([], { day: "numeric" });
  const time = when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <PressableCard
      onPress={() => router.push(`/match/${match.id}`)}
      className="mx-5 mb-3 p-4"
      accessibilityLabel={`Open match at ${match.pitch.venue.name}`}
    >
      <View className="flex-row items-center gap-3.5">
        <View className="h-14 w-14 items-center justify-center rounded-2xl border border-joga-hairline bg-joga-elevated">
          <Text className="font-semibold text-[10px] uppercase tracking-wide text-joga-muted">
            {weekday}
          </Text>
          <Text className="font-heading text-xl leading-6 tracking-tight text-joga-text">
            {day}
          </Text>
        </View>

        <View className="flex-1">
          <Text className="font-semibold text-base text-joga-text" numberOfLines={1}>
            {match.pitch.venue.name}
          </Text>
          <Text className="mt-0.5 font-body text-sm text-joga-muted" numberOfLines={1}>
            {time} · {pitchLabel(match.pitch.type)} ·{" "}
            {match.matchType === "RANKED" ? "Ranked" : "Friendly"}
          </Text>
        </View>

        <View className="items-end">
          {isDone && hasScore ? (
            <Text className="font-heading text-lg tracking-tight text-joga-text">
              {match.homeScore}-{match.awayScore}
            </Text>
          ) : (
            <View className="flex-row items-center gap-1.5 rounded-full bg-joga-volt/15 px-2.5 py-1">
              <Icon name="users" size={12} color={colors.volt} />
              <Text className="font-semibold text-xs text-joga-volt">
                {total}/{cap}
              </Text>
            </View>
          )}
          <Text className="mt-1 font-medium text-[11px] uppercase tracking-wide text-joga-muted">
            {isDone ? "Completed" : match.status === "BOOKED" ? "Booked" : "Open"}
          </Text>
        </View>
      </View>
    </PressableCard>
  );
}
