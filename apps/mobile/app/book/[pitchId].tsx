import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useVenues } from "@/hooks/use-venues";
import { useCreateBooking } from "@/hooks/use-create-booking";
import type { Team, TeamSelectionMode } from "@/lib/types";
import { colors } from "@/constants/Colors";

function ChoiceChip<T extends string>({
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
      className={`flex-1 items-center rounded-xl border px-4 py-3 ${
        active
          ? "border-joga-volt bg-joga-volt/10"
          : "border-joga-border bg-joga-card"
      } ${disabled ? "opacity-40" : "active:opacity-80"}`}
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
    >
      <Text
        className={`text-sm font-bold ${
          active ? "text-joga-volt" : "text-joga-text"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function BookingScreen() {
  const { pitchId } = useLocalSearchParams<{ pitchId: string }>();
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

  const [matchType, setMatchType] = useState<"FRIENDLY" | "RANKED">("RANKED");
  const [mode, setMode] = useState<TeamSelectionMode>("SELECTED");
  const [bookerTeam, setBookerTeam] = useState<Team>("HOME");

  // Default start = next top-of-hour, 1h slot
  const { startISO, endISO, label } = useMemo(() => {
    const start = new Date();
    start.setHours(start.getHours() + 1, 0, 0, 0);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);
    const fmt = (d: Date) =>
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return {
      startISO: start.toISOString(),
      endISO: end.toISOString(),
      label: `${fmt(start)} – ${fmt(end)}, ${start.toLocaleDateString()}`,
    };
  }, []);

  function handleSubmit() {
    if (!pitch) return;
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
        onSuccess: (data) => {
          Alert.alert("Booked!", `${pitch.venue.name} is confirmed.`, [
            {
              text: "View match",
              onPress: () => router.replace(`/match/${data.match.id}`),
            },
          ]);
        },
        onError: (err: any) => {
          const msg =
            err?.response?.data?.message ?? err?.message ?? "Try again later.";
          Alert.alert("Booking failed", msg);
        },
      },
    );
  }

  if (!pitch) {
    return (
      <SafeAreaView className="flex-1 bg-joga-dark" edges={["top"]}>
        <Stack.Screen options={{ title: "Book pitch" }} />
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
          Slot
        </Text>
        <View className="mb-6 rounded-xl border border-joga-border bg-joga-card p-4">
          <Text className="text-base font-semibold text-joga-text">{label}</Text>
          <Text className="mt-1 text-xs text-joga-muted">
            (defaults to the next hour for the MVP)
          </Text>
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

        <Pressable
          onPress={handleSubmit}
          disabled={isPending}
          className={`mt-4 items-center rounded-xl py-4 ${
            isPending ? "bg-joga-border" : "bg-joga-volt active:opacity-80"
          }`}
          accessibilityRole="button"
          accessibilityLabel="Confirm booking"
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
