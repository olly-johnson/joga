import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMatch } from "@/hooks/use-matches";
import { useJoinMatch } from "@/hooks/use-join-match";
import { useCompleteMatch } from "@/hooks/use-complete-match";
import { useMe } from "@/hooks/use-me";
import type { MatchParticipant, Team } from "@/lib/types";
import { colors } from "@/constants/Colors";

function ParticipantRow({ p }: { p: MatchParticipant }) {
  const name = p.user
    ? `${p.user.firstName} ${p.user.lastName}`.trim()
    : "Player";
  return (
    <View className="flex-row items-center justify-between border-b border-joga-border/40 py-2">
      <Text className="text-sm text-joga-text">{name}</Text>
      {p.team ? (
        <Text
          className={`text-xs font-bold ${
            p.team === "HOME" ? "text-joga-volt" : "text-joga-cyan"
          }`}
        >
          {p.team}
        </Text>
      ) : (
        <Text className="text-xs italic text-joga-muted">pending</Text>
      )}
    </View>
  );
}

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: match, isLoading, error } = useMatch(id);
  const { data: me } = useMe();
  const join = useJoinMatch(id ?? "");
  const complete = useCompleteMatch(id ?? "");

  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");

  if (isLoading || !match) {
    return (
      <SafeAreaView className="flex-1 bg-joga-dark" edges={["top"]}>
        <Stack.Screen options={{ headerShown: true, title: "Match" }} />
        <View className="flex-1 items-center justify-center">
          {error ? (
            <Text className="px-8 text-center text-joga-muted">
              Could not load match.
            </Text>
          ) : (
            <ActivityIndicator color={colors.volt} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  const meParticipant = me
    ? match.participants.find((p) => p.userId === me.id)
    : undefined;
  const homeParticipants = match.participants.filter((p) => p.team === "HOME");
  const awayParticipants = match.participants.filter((p) => p.team === "AWAY");
  const unassigned = match.participants.filter((p) => p.team === null);
  const allAssigned = unassigned.length === 0 && match.participants.length > 0;
  const teamsReady = allAssigned && homeParticipants.length > 0 && awayParticipants.length > 0;

  function handleJoin(team?: Team) {
    join.mutate(
      { team },
      {
        onSuccess: () => Alert.alert("Joined", team ? `You're on ${team}.` : "You're in."),
        onError: (err: any) => {
          const msg =
            err?.response?.data?.message ?? err?.message ?? "Try again.";
          Alert.alert("Join failed", msg);
        },
      },
    );
  }

  function handleComplete() {
    const h = parseInt(homeScore, 10);
    const a = parseInt(awayScore, 10);
    if (Number.isNaN(h) || Number.isNaN(a) || h < 0 || a < 0) {
      Alert.alert("Invalid scores", "Both scores must be non-negative numbers.");
      return;
    }
    complete.mutate(
      { homeScore: h, awayScore: a },
      {
        onSuccess: () => Alert.alert("Result submitted", "Ratings updated."),
        onError: (err: any) => {
          const msg =
            err?.response?.data?.message ?? err?.message ?? "Try again.";
          Alert.alert("Could not submit result", msg);
        },
      },
    );
  }

  const isCompleted = match.status === "COMPLETED";
  const canJoin = !meParticipant && !isCompleted;

  return (
    <SafeAreaView className="flex-1 bg-joga-dark" edges={["top"]}>
      <Stack.Screen options={{ headerShown: true, title: "Match" }} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Text className="mb-1 text-3xl font-extrabold text-joga-text">
          {match.pitch.venue.name}
        </Text>
        <Text className="mb-4 text-sm text-joga-muted">
          {match.matchType} · {match.teamSelectionMode} · {match.participants.length}/
          {match.capacity}
        </Text>

        <View className="mb-4 flex-row items-center gap-2">
          <View
            className={`rounded-full px-3 py-1 ${
              isCompleted
                ? "bg-joga-pink/20"
                : match.status === "BOOKED"
                  ? "bg-joga-volt/20"
                  : "bg-joga-border"
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                isCompleted
                  ? "text-joga-pink"
                  : match.status === "BOOKED"
                    ? "text-joga-volt"
                    : "text-joga-text"
              }`}
            >
              {match.status}
            </Text>
          </View>
        </View>

        {isCompleted && (
          <View className="mb-6 rounded-2xl border border-joga-border bg-joga-card p-4">
            <Text className="mb-1 text-xs uppercase tracking-wider text-joga-muted">
              Final score
            </Text>
            <Text className="text-4xl font-extrabold text-joga-text">
              {match.homeScore} – {match.awayScore}
            </Text>
          </View>
        )}

        <View className="mb-6 flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-joga-border bg-joga-card p-3">
            <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-joga-volt">
              Home ({homeParticipants.length})
            </Text>
            {homeParticipants.length === 0 ? (
              <Text className="text-xs italic text-joga-muted">No players yet</Text>
            ) : (
              homeParticipants.map((p) => <ParticipantRow key={p.id} p={p} />)
            )}
          </View>
          <View className="flex-1 rounded-2xl border border-joga-border bg-joga-card p-3">
            <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-joga-cyan">
              Away ({awayParticipants.length})
            </Text>
            {awayParticipants.length === 0 ? (
              <Text className="text-xs italic text-joga-muted">No players yet</Text>
            ) : (
              awayParticipants.map((p) => <ParticipantRow key={p.id} p={p} />)
            )}
          </View>
        </View>

        {unassigned.length > 0 && (
          <View className="mb-6 rounded-2xl border border-joga-border bg-joga-card p-3">
            <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-joga-muted">
              Pending team assignment ({unassigned.length})
            </Text>
            {unassigned.map((p) => <ParticipantRow key={p.id} p={p} />)}
            <Text className="mt-2 text-xs italic text-joga-muted">
              Teams are randomised when the roster fills.
            </Text>
          </View>
        )}

        {canJoin && match.teamSelectionMode === "SELECTED" && (
          <>
            <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-joga-muted">
              Join a team
            </Text>
            <View className="mb-4 flex-row gap-3">
              <Pressable
                onPress={() => handleJoin("HOME")}
                disabled={join.isPending}
                className="flex-1 items-center rounded-xl border border-joga-volt bg-joga-volt/10 py-3 active:opacity-80"
                accessibilityRole="button"
              >
                <Text className="text-sm font-bold text-joga-volt">Join HOME</Text>
              </Pressable>
              <Pressable
                onPress={() => handleJoin("AWAY")}
                disabled={join.isPending}
                className="flex-1 items-center rounded-xl border border-joga-cyan bg-joga-cyan/10 py-3 active:opacity-80"
                accessibilityRole="button"
              >
                <Text className="text-sm font-bold text-joga-cyan">Join AWAY</Text>
              </Pressable>
            </View>
          </>
        )}

        {canJoin && match.teamSelectionMode === "RANDOM" && (
          <Pressable
            onPress={() => handleJoin()}
            disabled={join.isPending}
            className="mb-4 items-center rounded-xl bg-joga-volt py-3.5 active:opacity-80"
            accessibilityRole="button"
          >
            {join.isPending ? (
              <ActivityIndicator color={colors.black} />
            ) : (
              <Text className="text-base font-bold text-joga-black">
                Join match (random team)
              </Text>
            )}
          </Pressable>
        )}

        {meParticipant && !isCompleted && (
          <>
            <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-joga-muted">
              Submit result
            </Text>
            {!teamsReady && (
              <Text className="mb-2 text-xs italic text-joga-muted">
                Need at least 1 player on each team before submitting.
              </Text>
            )}
            <View className="mb-3 flex-row gap-3">
              <View className="flex-1 rounded-xl border border-joga-border bg-joga-card p-3">
                <Text className="mb-1 text-xs uppercase tracking-wider text-joga-volt">
                  Home
                </Text>
                <TextInput
                  value={homeScore}
                  onChangeText={setHomeScore}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                  className="text-3xl font-extrabold text-joga-text"
                  accessibilityLabel="Home score"
                />
              </View>
              <View className="flex-1 rounded-xl border border-joga-border bg-joga-card p-3">
                <Text className="mb-1 text-xs uppercase tracking-wider text-joga-cyan">
                  Away
                </Text>
                <TextInput
                  value={awayScore}
                  onChangeText={setAwayScore}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                  className="text-3xl font-extrabold text-joga-text"
                  accessibilityLabel="Away score"
                />
              </View>
            </View>
            <Pressable
              onPress={handleComplete}
              disabled={complete.isPending || !teamsReady}
              className={`items-center rounded-xl py-4 ${
                complete.isPending || !teamsReady
                  ? "bg-joga-border"
                  : "bg-joga-pink active:opacity-80"
              }`}
              accessibilityRole="button"
              accessibilityLabel="Submit result"
            >
              {complete.isPending ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text className="text-base font-bold text-joga-text">
                  Submit result
                </Text>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
