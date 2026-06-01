import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMyMatches } from "@/hooks/use-matches";
import { splitMyMatches } from "@/lib/venue-slots";
import { MatchCard } from "@/components/match-card";
import { colors } from "@/constants/Colors";

export default function HistoryScreen() {
  const { data, isLoading, error } = useMyMatches();
  const history = data ? splitMyMatches(data).history : [];

  return (
    <SafeAreaView className="flex-1 bg-joga-dark" edges={["top"]}>
      <View className="px-4 pb-4 pt-2">
        <Text className="text-3xl font-extrabold text-joga-text">History</Text>
        <Text className="mt-1 text-sm text-joga-muted">
          Your completed and cancelled matches
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.volt} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-base text-joga-muted">
            Could not load history. Make sure the API is running.
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MatchCard match={item} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-8 pt-16">
              <Text className="text-center text-base text-joga-muted">
                No past matches yet. Completed games will show up here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
