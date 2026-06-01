import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
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

const BOOKABLE_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

function ChoiceChip({
  active,
  onPress,
  label,
  disabled = false,
}: {
  active: boolean;
  onPress: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`min-h-[44px] flex-1 items-center justify-center rounded-xl border px-4 py-3 ${
        active
          ? "border-joga-volt bg-joga-volt/10"
          : "border-joga-border bg-joga-card"
      } ${disabled ? "opacity-40" : "active:opacity-80"}`}
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
    >
      <Text
        className={`text-sm font-bold ${active ? "text-joga-volt" : "text-joga-text"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function PickerChip({
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
      className={`mr-2 min-h-[44px] items-center justify-center rounded-xl border px-4 py-3 ${
        active
          ? "border-joga-volt bg-joga-volt/10"
          : "border-joga-border bg-joga-card"
      } active:opacity-80`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text
        className={`text-sm font-bold ${active ? "text-joga-volt" : "text-joga-text"}`}
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
        <Stack.Screen options={{ headerShown: true, title: "Book pitch" }} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.volt} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-joga-dark" edges={["top"]}>
      <Stack.Screen options={{ title: "Book pitch" }} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Text className="mb-1 text-3xl font-extrabold text-joga-text">
          {pitch.venue.name}
        </Text>
        <Text className="mb-6 text-sm text-joga-muted">
          {pitch.type === "FIVE_A_SIDE" ? "5-a-side" : "7-a-side"} · {pitch.surface}
        </Text>

        <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-joga-muted">
          Date
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4 -mx-1 px-1"
        >
          {dates.map((d, i) => (
            <PickerChip
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

        <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-joga-muted">
          Kick-off
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-2 -mx-1 px-1"
        >
          {BOOKABLE_HOURS.map((h) => (
            <PickerChip
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
        <View className="mb-6 rounded-xl border border-joga-border bg-joga-card p-4">
          <Text className="text-base font-semibold text-joga-text">{slotLabel}</Text>
          <Text className="mt-1 text-xs text-joga-muted">1-hour slot</Text>
        </View>

        <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-joga-muted">
          Match type
        </Text>
        <View className="mb-6 flex-row gap-3">
          <ChoiceChip
            label="Friendly"
            active={matchType === "FRIENDLY"}
            onPress={() => setMatchType("FRIENDLY")}
          />
          <ChoiceChip
            label="Ranked"
            active={matchType === "RANKED"}
            onPress={() => setMatchType("RANKED")}
          />
        </View>

        <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-joga-muted">
          Team selection
        </Text>
        <View className="mb-2 flex-row gap-3">
          <ChoiceChip
            label="Selected"
            active={mode === "SELECTED"}
            onPress={() => setMode("SELECTED")}
          />
          <ChoiceChip
            label="Random"
            active={mode === "RANDOM"}
            onPress={() => setMode("RANDOM")}
          />
        </View>
        <Text className="mb-6 text-xs text-joga-muted">
          {mode === "SELECTED"
            ? "Each joiner picks their team when they join."
            : "Teams are picked at random when the roster fills up."}
        </Text>

        {mode === "SELECTED" && (
          <>
            <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-joga-muted">
              Your team
            </Text>
            <View className="mb-6 flex-row gap-3">
              <ChoiceChip
                label="Home"
                active={bookerTeam === "HOME"}
                onPress={() => setBookerTeam("HOME")}
              />
              <ChoiceChip
                label="Away"
                active={bookerTeam === "AWAY"}
                onPress={() => setBookerTeam("AWAY")}
              />
            </View>
          </>
        )}

        {errorMessage && (
          <View
            className="mb-4 rounded-xl border border-joga-pink bg-joga-pink/10 p-4"
            accessibilityRole="alert"
          >
            <Text className="text-sm font-semibold text-joga-pink">{errorMessage}</Text>
          </View>
        )}

        <Pressable
          onPress={handleSubmit}
          disabled={isPending}
          className={`mt-2 min-h-[48px] items-center justify-center rounded-xl py-4 ${
            isPending ? "bg-joga-border" : "bg-joga-volt active:opacity-80"
          }`}
          accessibilityRole="button"
          accessibilityLabel="Confirm booking"
          accessibilityState={{ disabled: isPending, busy: isPending }}
        >
          {isPending ? (
            <ActivityIndicator color={colors.volt} />
          ) : (
            <Text className="text-base font-bold text-joga-black">
              Confirm booking (£45.00 mocked)
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
