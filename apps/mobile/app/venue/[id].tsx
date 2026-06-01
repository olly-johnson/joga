import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useVenues } from "@/hooks/use-venues";
import { useMatches } from "@/hooks/use-matches";
import { useMe } from "@/hooks/use-me";
import { upcomingDates } from "@/lib/booking-slots";
import { buildSlotGrid, type SlotCell } from "@/lib/venue-slots";
import { colors } from "@/constants/Colors";

const BOOKABLE_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

function StatusCell({
  cell,
  dayOffset,
  onBook,
  onOpen,
}: {
  cell: SlotCell;
  dayOffset: number;
  onBook: (pitchId: string, hour: number) => void;
  onOpen: (matchId: string) => void;
}) {
  const { pitch, hour, status, match } = cell;
  const count = match?.participants.length ?? 0;
  const cap = pitch.type === "FIVE_A_SIDE" ? 10 : 14;

  const base =
    "flex-1 min-h-[56px] items-center justify-center rounded-xl border px-2 py-2";

  if (status === "FREE") {
    return (
      <Pressable
        onPress={() => onBook(pitch.id, hour)}
        className={`${base} border-joga-volt bg-joga-volt/10 active:opacity-80`}
        accessibilityRole="button"
        accessibilityLabel={`Book ${pitch.surface} at ${hh(hour)}`}
      >
        <Text className="text-xs font-bold text-joga-volt">{pitch.surface}</Text>
        <Text className="text-[10px] font-semibold uppercase text-joga-volt">Book</Text>
      </Pressable>
    );
  }

  if (status === "JOINABLE") {
    return (
      <Pressable
        onPress={() => match && onOpen(match.id)}
        className={`${base} border-joga-cyan bg-joga-cyan/10 active:opacity-80`}
        accessibilityRole="button"
        accessibilityLabel={`Join ${pitch.surface} at ${hh(hour)}`}
      >
        <Text className="text-xs font-bold text-joga-cyan">{pitch.surface}</Text>
        <Text className="text-[10px] font-semibold uppercase text-joga-cyan">
          Join {count}/{cap}
        </Text>
      </Pressable>
    );
  }

  if (status === "JOINED") {
    return (
      <Pressable
        onPress={() => match && onOpen(match.id)}
        className={`${base} border-joga-volt bg-joga-card active:opacity-80`}
        accessibilityRole="button"
        accessibilityLabel={`Your match ${pitch.surface} at ${hh(hour)}`}
      >
        <Text className="text-xs font-bold text-joga-text">{pitch.surface}</Text>
        <Text className="text-[10px] font-semibold uppercase text-joga-volt">
          You&apos;re in
        </Text>
      </Pressable>
    );
  }

  // FULL
  return (
    <View
      className={`${base} border-joga-border bg-joga-card opacity-60`}
      accessibilityLabel={`Full ${pitch.surface} at ${hh(hour)}`}
    >
      <Text className="text-xs font-bold text-joga-muted">{pitch.surface}</Text>
      <Text className="text-[10px] font-semibold uppercase text-joga-muted">
        Full {cap}/{cap}
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
        <Stack.Screen options={{ headerShown: true, title: "Venue" }} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.volt} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-joga-dark" edges={["bottom"]}>
      <Stack.Screen options={{ headerShown: true, title: venue.name }} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-joga-muted">
          Date
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-5 -mx-1 px-1"
        >
          {dates.map((d, i) => (
            <Pressable
              key={d.toISOString()}
              onPress={() => setDayOffset(i)}
              className={`mr-2 min-h-[44px] items-center justify-center rounded-xl border px-4 py-2 ${
                i === dayOffset
                  ? "border-joga-volt bg-joga-volt/10"
                  : "border-joga-border bg-joga-card"
              } active:opacity-80`}
              accessibilityRole="button"
              accessibilityState={{ selected: i === dayOffset }}
              accessibilityLabel={d.toLocaleDateString([], {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            >
              <Text
                className={`text-sm font-bold ${i === dayOffset ? "text-joga-volt" : "text-joga-text"}`}
              >
                {d.toLocaleDateString([], { weekday: "short", day: "numeric" })}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text className="mb-1 text-xs font-bold uppercase tracking-wider text-joga-muted">
          Slots
        </Text>
        <Text className="mb-3 text-xs text-joga-muted">
          Tap a free slot to book, or an open match to join.
        </Text>

        {grid.map((row) => (
          <View key={row.hour} className="mb-2 flex-row items-center gap-3">
            <Text className="w-14 text-sm font-bold text-joga-text">{hh(row.hour)}</Text>
            <View className="flex-1 flex-row gap-2">
              {row.cells.map((cell) => (
                <StatusCell
                  key={cell.pitch.id}
                  cell={cell}
                  dayOffset={dayOffset}
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
