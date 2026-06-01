import { useState } from "react";
import {
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
import {
  Badge,
  Button,
  Card,
  ErrorState,
  LoadingState,
  SectionLabel,
} from "@/components/ui";

const HEADER_OPTIONS = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.dark },
  headerTintColor: colors.text,
  headerTitleStyle: { fontFamily: "SpaceGrotesk_700Bold" },
  headerShadowVisible: false,
} as const;

function ParticipantRow({ p }: { p: MatchParticipant }) {
  const name = p.user
    ? `${p.user.firstName} ${p.user.lastName}`.trim()
    : "Player";
  return (
    <View className="flex-row items-center justify-between border-b border-joga-hairline py-2.5">
      <Text className="font-body text-sm text-joga-text" numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

function TeamColumn({
  label,
  accent,
  participants,
}: {
  label: string;
  accent: "volt" | "white";
  participants: MatchParticipant[];
}) {
  return (
    <Card className="flex-1 p-4">
      <Text
        className={`mb-2 font-semibold text-xs uppercase tracking-wide ${
          accent === "volt" ? "text-joga-volt" : "text-joga-text"
        }`}
      >
        {label} ({participants.length})
      </Text>
      {participants.length === 0 ? (
        <Text className="font-body text-xs italic text-joga-muted">
          No players yet
        </Text>
      ) : (
        participants.map((p) => <ParticipantRow key={p.id} p={p} />)
      )}
    </Card>
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
        <Stack.Screen options={{ ...HEADER_OPTIONS, title: "Match" }} />
        {error ? (
          <ErrorState message="Could not load this match." />
        ) : (
          <LoadingState />
        )}
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
  const teamsReady =
    allAssigned && homeParticipants.length > 0 && awayParticipants.length > 0;

  function handleJoin(team?: Team) {
    join.mutate(
      { team },
      {
        onSuccess: () =>
          Alert.alert("Joined", team ? `You are on ${team}.` : "You are in."),
        onError: (err: any) => {
          const msg = err?.response?.data?.message ?? err?.message ?? "Try again.";
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
          const msg = err?.response?.data?.message ?? err?.message ?? "Try again.";
          Alert.alert("Could not submit result", msg);
        },
      },
    );
  }

  const isCompleted = match.status === "COMPLETED";
  const canJoin = !meParticipant && !isCompleted;

  return (
    <SafeAreaView className="flex-1 bg-joga-dark" edges={["top"]}>
      <Stack.Screen options={{ ...HEADER_OPTIONS, title: "Match" }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        {/* Hero */}
        <Card className="mb-6 p-6">
          <Text className="font-heading text-2xl tracking-tight text-joga-text">
            {match.pitch.venue.name}
          </Text>
          <View className="mt-3 flex-row flex-wrap items-center gap-2">
            <Badge
              label={match.matchType === "RANKED" ? "Ranked" : "Friendly"}
              tone={match.matchType === "RANKED" ? "primary" : "neutral"}
            />
            <Badge
              label={
                isCompleted
                  ? "Completed"
                  : match.status === "BOOKED"
                    ? "Booked"
                    : "Open"
              }
              tone={isCompleted ? "neutral" : "primary"}
            />
            <Badge
              label={`${match.participants.length}/${match.capacity} players`}
              tone="outline"
            />
          </View>

          {isCompleted && (
            <View className="mt-6 flex-row items-center justify-center gap-6">
              <View className="items-center">
                <Text className="font-display text-5xl tracking-tight text-joga-text">
                  {match.homeScore}
                </Text>
                <Text className="mt-1 font-semibold text-xs uppercase tracking-wide text-joga-volt">
                  Home
                </Text>
              </View>
              <Text className="font-heading text-2xl text-joga-muted">-</Text>
              <View className="items-center">
                <Text className="font-display text-5xl tracking-tight text-joga-text">
                  {match.awayScore}
                </Text>
                <Text className="mt-1 font-semibold text-xs uppercase tracking-wide text-joga-white">
                  Away
                </Text>
              </View>
            </View>
          )}
        </Card>

        {/* Teams */}
        <SectionLabel>Teams</SectionLabel>
        <View className="mb-6 flex-row gap-3">
          <TeamColumn label="Home" accent="volt" participants={homeParticipants} />
          <TeamColumn label="Away" accent="white" participants={awayParticipants} />
        </View>

        {unassigned.length > 0 && (
          <Card className="mb-6 p-4">
            <Text className="mb-2 font-semibold text-xs uppercase tracking-wide text-joga-muted">
              Awaiting team assignment ({unassigned.length})
            </Text>
            {unassigned.map((p) => (
              <ParticipantRow key={p.id} p={p} />
            ))}
            <Text className="mt-2 font-body text-xs italic text-joga-muted">
              Teams are assigned at random once the roster fills.
            </Text>
          </Card>
        )}

        {/* Join */}
        {canJoin && match.teamSelectionMode === "SELECTED" && (
          <>
            <SectionLabel>Join a team</SectionLabel>
            <View className="mb-6 flex-row gap-3">
              <Pressable
                onPress={() => handleJoin("HOME")}
                disabled={join.isPending}
                className="min-h-[50px] flex-1 items-center justify-center rounded-2xl border border-joga-volt/50 bg-joga-volt/10 active:opacity-80"
                accessibilityRole="button"
              >
                <Text className="font-heading text-base tracking-tight text-joga-volt">
                  Join Home
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleJoin("AWAY")}
                disabled={join.isPending}
                className="min-h-[50px] flex-1 items-center justify-center rounded-2xl border border-joga-white/40 bg-joga-white/10 active:opacity-80"
                accessibilityRole="button"
              >
                <Text className="font-heading text-base tracking-tight text-joga-white">
                  Join Away
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {canJoin && match.teamSelectionMode === "RANDOM" && (
          <View className="mb-6">
            <Button
              label="Join match"
              icon="user-plus"
              loading={join.isPending}
              onPress={() => handleJoin()}
            />
            <Text className="mt-2 text-center font-body text-xs text-joga-muted">
              You will be assigned a team at random.
            </Text>
          </View>
        )}

        {/* Submit result */}
        {meParticipant && !isCompleted && (
          <>
            <SectionLabel>Submit result</SectionLabel>
            {!teamsReady && (
              <Text className="mb-3 font-body text-xs italic text-joga-muted">
                Need at least one player on each team before submitting.
              </Text>
            )}
            <View className="mb-3 flex-row gap-3">
              <View className="flex-1 rounded-2xl border border-joga-hairline bg-joga-card p-4">
                <Text className="mb-1 font-semibold text-xs uppercase tracking-wide text-joga-volt">
                  Home
                </Text>
                <TextInput
                  value={homeScore}
                  onChangeText={setHomeScore}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                  className="font-display text-3xl text-joga-text"
                  accessibilityLabel="Home score"
                />
              </View>
              <View className="flex-1 rounded-2xl border border-joga-hairline bg-joga-card p-4">
                <Text className="mb-1 font-semibold text-xs uppercase tracking-wide text-joga-white">
                  Away
                </Text>
                <TextInput
                  value={awayScore}
                  onChangeText={setAwayScore}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                  className="font-display text-3xl text-joga-text"
                  accessibilityLabel="Away score"
                />
              </View>
            </View>
            <Button
              label="Submit result"
              loading={complete.isPending}
              disabled={!teamsReady}
              onPress={handleComplete}
              accessibilityLabel="Submit result"
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
