import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useVenues } from "@/hooks/use-venues";
import { useCreateBooking } from "@/hooks/use-create-booking";
import {
  bookingErrorMessage,
  composeSlot,
  formatSlotLabel,
  upcomingDates,
} from "@/lib/booking-slots";
import type { Team, TeamSelectionMode } from "@/lib/types";
import { colors } from "@/constants/Colors";
import {
  Button,
  Card,
  Icon,
  LoadingState,
  SectionLabel,
  SegmentedControl,
} from "@/components/ui";

const BOOKABLE_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

const HEADER_OPTIONS = {
  headerStyle: { backgroundColor: colors.dark },
  headerTintColor: colors.text,
  headerTitleStyle: { fontFamily: "SpaceGrotesk_700Bold" },
  headerShadowVisible: false,
} as const;

function Pill({
  active,
  onPress,
  label,
  accessibilityLabel,
}: {
  active: boolean;
  onPress: () => void;
  label: string;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`mr-2 min-h-[44px] items-center justify-center rounded-2xl border px-4 ${
        active ? "border-joga-volt bg-joga-volt" : "border-joga-hairline bg-joga-card"
      } active:opacity-80`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text
        className={`font-semibold text-sm ${
          active ? "text-joga-onaccent" : "text-joga-text"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function BookingScreen() {
  const { pitchId, day, hour: hourParam } = useLocalSearchParams<{
    pitchId: string;
    day?: string;
    hour?: string;
  }>();
  const router = useRouter();
  const { data: venues } = useVenues();
  const { mutate: book, isPending } = useCreateBooking();

  const pitch = useMemo(() => {
    if (!venues) return null;
    for (const v of venues) {
      const p = v.pitches.find((pp) => pp.id === pitchId);
      if (p) return { ...p, venue: v };
    }
    return null;
  }, [venues, pitchId]);

  const dates = useMemo(() => upcomingDates(new Date(), 7), []);
  const initialDay = Math.min(Math.max(Number(day) || 0, 0), 6);
  const initialHour = BOOKABLE_HOURS.includes(Number(hourParam))
    ? Number(hourParam)
    : 19;
  const [dateIndex, setDateIndex] = useState(initialDay);
  const [hour, setHour] = useState(initialHour);
  const [matchType, setMatchType] = useState<"FRIENDLY" | "RANKED">("RANKED");
  const [mode, setMode] = useState<TeamSelectionMode>("SELECTED");
  const [bookerTeam, setBookerTeam] = useState<Team>("HOME");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedDate = dates[dateIndex];
  const slotLabel = formatSlotLabel(selectedDate, hour);

  function handleSubmit() {
    if (!pitch) return;
    setErrorMessage(null);
    const { startISO, endISO } = composeSlot(selectedDate, hour);
    book(
      {
        pitchId: pitch.id,
        matchType,
        startTime: startISO,
        endTime: endISO,
        totalCost: 4500,
        teamSelectionMode: mode,
        bookerTeam: mode === "SELECTED" ? bookerTeam : undefined,
      },
      {
        onSuccess: (data) => router.replace(`/match/${data.match.id}`),
        onError: (err) => setErrorMessage(bookingErrorMessage(err)),
      },
    );
  }

  if (!pitch) {
    return (
      <SafeAreaView className="flex-1 bg-joga-dark" edges={["top"]}>
        <Stack.Screen options={{ ...HEADER_OPTIONS, title: "Book pitch" }} />
        <LoadingState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-joga-dark" edges={["top"]}>
      <Stack.Screen options={{ ...HEADER_OPTIONS, title: "Book pitch" }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        <Text className="font-heading text-2xl tracking-tight text-joga-text">
          {pitch.venue.name}
        </Text>
        <Text className="mb-6 mt-1 font-body text-sm text-joga-muted">
          {pitch.type === "FIVE_A_SIDE" ? "5-a-side" : "7-a-side"} · {pitch.surface}
        </Text>

        <SectionLabel>Date</SectionLabel>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-6 -mx-1 px-1"
        >
          {dates.map((d, i) => (
            <Pill
              key={d.toISOString()}
              active={i === dateIndex}
              onPress={() => {
                setDateIndex(i);
                setErrorMessage(null);
              }}
              label={d.toLocaleDateString([], { weekday: "short", day: "numeric" })}
              accessibilityLabel={d.toLocaleDateString([], {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            />
          ))}
        </ScrollView>

        <SectionLabel>Kick-off</SectionLabel>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-6 -mx-1 px-1"
        >
          {BOOKABLE_HOURS.map((h) => (
            <Pill
              key={h}
              active={h === hour}
              onPress={() => {
                setHour(h);
                setErrorMessage(null);
              }}
              label={`${String(h).padStart(2, "0")}:00`}
            />
          ))}
        </ScrollView>

        <SectionLabel>Match type</SectionLabel>
        <View className="mb-6">
          <SegmentedControl
            value={matchType}
            onChange={setMatchType}
            options={[
              { value: "FRIENDLY", label: "Friendly" },
              { value: "RANKED", label: "Ranked" },
            ]}
          />
        </View>

        <SectionLabel>Team selection</SectionLabel>
        <View className="mb-2">
          <SegmentedControl
            value={mode}
            onChange={setMode}
            options={[
              { value: "SELECTED", label: "Selected" },
              { value: "RANDOM", label: "Random" },
            ]}
          />
        </View>
        <Text className="mb-6 font-body text-xs leading-5 text-joga-muted">
          {mode === "SELECTED"
            ? "Each player picks their team when they join."
            : "Teams are picked at random once the roster fills up."}
        </Text>

        {mode === "SELECTED" && (
          <>
            <SectionLabel>Your team</SectionLabel>
            <View className="mb-6">
              <SegmentedControl
                value={bookerTeam}
                onChange={setBookerTeam}
                options={[
                  { value: "HOME", label: "Home" },
                  { value: "AWAY", label: "Away" },
                ]}
              />
            </View>
          </>
        )}

        <Card className="mb-6 p-5">
          <View className="flex-row items-center justify-between">
            <Text className="font-body text-sm text-joga-muted">Slot</Text>
            <Text className="font-semibold text-sm text-joga-text">{slotLabel}</Text>
          </View>
          <View className="my-3 h-px bg-joga-hairline" />
          <View className="flex-row items-center justify-between">
            <Text className="font-body text-sm text-joga-muted">Total</Text>
            <Text className="font-heading text-xl tracking-tight text-joga-volt">
              £45.00
            </Text>
          </View>
        </Card>

        {errorMessage && (
          <View
            className="mb-4 flex-row items-center gap-2 rounded-2xl border border-joga-pink/40 bg-joga-pink/10 px-4 py-3"
            accessibilityRole="alert"
          >
            <Icon name="alert-circle" size={16} color={colors.pink} />
            <Text className="flex-1 font-body text-sm text-joga-pink">
              {errorMessage}
            </Text>
          </View>
        )}

        <Button
          label="Confirm booking"
          loading={isPending}
          onPress={handleSubmit}
          accessibilityLabel="Confirm booking"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
