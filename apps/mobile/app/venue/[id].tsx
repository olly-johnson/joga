import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useVenues } from "@/hooks/use-venues";
import { useMatches } from "@/hooks/use-matches";
import { useMe } from "@/hooks/use-me";
import { upcomingDates } from "@/lib/booking-slots";
import { buildSlotGrid, type SlotCell } from "@/lib/venue-slots";
import { colors } from "@/constants/Colors";
import { LoadingState, SectionLabel } from "@/components/ui";

const BOOKABLE_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

const HEADER_OPTIONS = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.dark },
  headerTintColor: colors.text,
  headerTitleStyle: { fontFamily: "SpaceGrotesk_700Bold" },
  headerShadowVisible: false,
} as const;

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <Text className="font-body text-xs text-joga-muted">{label}</Text>
    </View>
  );
}

function StatusCell({
  cell,
  onBook,
  onOpen,
}: {
  cell: SlotCell;
  onBook: (pitchId: string, hour: number) => void;
  onOpen: (matchId: string) => void;
}) {
  const { pitch, hour, status, match } = cell;
  const count = match?.participants.length ?? 0;
  const cap = pitch.type === "FIVE_A_SIDE" ? 10 : 14;

  const base =
    "flex-1 min-h-[60px] items-center justify-center rounded-2xl border px-2 py-2";

  if (status === "FREE") {
    return (
      <Pressable
        onPress={() => onBook(pitch.id, hour)}
        className={`${base} border-joga-volt/40 bg-joga-volt/10 active:opacity-80`}
        accessibilityRole="button"
        accessibilityLabel={`Book ${pitch.surface} at ${hh(hour)}`}
      >
        <Text className="font-semibold text-xs text-joga-volt">{pitch.surface}</Text>
        <Text className="mt-0.5 font-medium text-[10px] uppercase tracking-wide text-joga-volt">
          Book
        </Text>
      </Pressable>
    );
  }

  if (status === "JOINABLE") {
    return (
      <Pressable
        onPress={() => match && onOpen(match.id)}
        className={`${base} border-joga-white/30 bg-joga-white/10 active:opacity-80`}
        accessibilityRole="button"
        accessibilityLabel={`Join ${pitch.surface} at ${hh(hour)}`}
      >
        <Text className="font-semibold text-xs text-joga-white">{pitch.surface}</Text>
        <Text className="mt-0.5 font-medium text-[10px] uppercase tracking-wide text-joga-white">
          Join {count}/{cap}
        </Text>
      </Pressable>
    );
  }

  if (status === "JOINED") {
    return (
      <Pressable
        onPress={() => match && onOpen(match.id)}
        className={`${base} border-joga-volt/40 bg-joga-elevated active:opacity-80`}
        accessibilityRole="button"
        accessibilityLabel={`Your match ${pitch.surface} at ${hh(hour)}`}
      >
        <Text className="font-semibold text-xs text-joga-text">{pitch.surface}</Text>
        <Text className="mt-0.5 font-medium text-[10px] uppercase tracking-wide text-joga-volt">
          You’re in
        </Text>
      </Pressable>
    );
  }

  // FULL
  return (
    <View
      className={`${base} border-joga-hairline bg-joga-card opacity-50`}
      accessibilityLabel={`Full ${pitch.surface} at ${hh(hour)}`}
    >
      <Text className="font-semibold text-xs text-joga-muted">{pitch.surface}</Text>
      <Text className="mt-0.5 font-medium text-[10px] uppercase tracking-wide text-joga-muted">
        Full
      </Text>
    </View>
  );
}

export default function VenueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: venues, isLoading } = useVenues();
  const { data: matches } = useMatches();
  const { data: me } = useMe();

  const venue = useMemo(
    () => venues?.find((v) => v.id === id) ?? null,
    [venues, id],
  );

  const dates = useMemo(() => upcomingDates(new Date(), 7), []);
  const [dayOffset, setDayOffset] = useState(0);
  const selectedDate = dates[dayOffset];

  const grid = useMemo(() => {
    if (!venue) return [];
    return buildSlotGrid({
      pitches: venue.pitches,
      matches: matches ?? [],
      date: selectedDate,
      hours: BOOKABLE_HOURS,
      myUserId: me?.id,
    });
  }, [venue, matches, selectedDate, me?.id]);

  if (isLoading || !venue) {
    return (
      <SafeAreaView className="flex-1 bg-joga-dark" edges={["bottom"]}>
        <Stack.Screen options={{ ...HEADER_OPTIONS, title: "Venue" }} />
        <LoadingState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-joga-dark" edges={["bottom"]}>
      <Stack.Screen options={{ ...HEADER_OPTIONS, title: venue.name }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        <SectionLabel>Date</SectionLabel>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-6 -mx-1 px-1"
        >
          {dates.map((d, i) => {
            const active = i === dayOffset;
            return (
              <Pressable
                key={d.toISOString()}
                onPress={() => setDayOffset(i)}
                className={`mr-2 min-h-[58px] min-w-[58px] items-center justify-center rounded-2xl border px-3 ${
                  active
                    ? "border-joga-volt bg-joga-volt"
                    : "border-joga-hairline bg-joga-card"
                } active:opacity-80`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={d.toLocaleDateString([], {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              >
                <Text
                  className={`font-medium text-[10px] uppercase tracking-wide ${
                    active ? "text-joga-onaccent" : "text-joga-muted"
                  }`}
                >
                  {d.toLocaleDateString([], { weekday: "short" })}
                </Text>
                <Text
                  className={`font-heading text-lg tracking-tight ${
                    active ? "text-joga-onaccent" : "text-joga-text"
                  }`}
                >
                  {d.toLocaleDateString([], { day: "numeric" })}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <SectionLabel>Slots</SectionLabel>
        <View className="mb-4 flex-row flex-wrap gap-x-4 gap-y-2">
          <LegendDot color={colors.volt} label="Free to book" />
          <LegendDot color={colors.white} label="Open to join" />
          <LegendDot color={colors.muted} label="Full" />
        </View>

        {grid.map((row) => (
          <View key={row.hour} className="mb-2 flex-row items-center gap-3">
            <Text className="w-12 font-semibold text-sm text-joga-text">
              {hh(row.hour)}
            </Text>
            <View className="flex-1 flex-row gap-2">
              {row.cells.map((cell) => (
                <StatusCell
                  key={cell.pitch.id}
                  cell={cell}
                  onBook={(pitchId, hour) =>
                    router.push(`/book/${pitchId}?day=${dayOffset}&hour=${hour}`)
                  }
                  onOpen={(matchId) => router.push(`/match/${matchId}`)}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
