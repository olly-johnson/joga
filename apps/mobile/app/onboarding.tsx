import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";

interface SkillLevel {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
}

const SKILL_LEVELS: SkillLevel[] = [
  {
    id: "beginner",
    title: "Beginner",
    subtitle: "Just getting started. Learning the basics.",
    emoji: "\u26BD",
  },
  {
    id: "intermediate",
    title: "Intermediate",
    subtitle: "Comfortable on the ball. Regular player.",
    emoji: "\uD83D\uDD25",
  },
  {
    id: "advanced",
    title: "Advanced",
    subtitle: "Strong skills. Competitive edge.",
    emoji: "\uD83C\uDFC6",
  },
  {
    id: "expert",
    title: "Expert",
    subtitle: "Elite level. You run the cage.",
    emoji: "\uD83D\uDC51",
  },
];

function SkillCard({
  level,
  selected,
  onPress,
}: {
  level: SkillLevel;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`mb-3 flex-row items-center rounded-2xl border-2 p-5 ${
        selected
          ? "border-joga-volt bg-joga-volt/10"
          : "border-joga-border bg-joga-card"
      } active:opacity-80`}
      accessibilityRole="button"
      accessibilityLabel={`Select ${level.title} skill level`}
      accessibilityState={{ selected }}
    >
      <Text className="mr-4 text-3xl">{level.emoji}</Text>
      <View className="flex-1">
        <Text
          className={`text-lg font-bold ${
            selected ? "text-joga-volt" : "text-joga-text"
          }`}
        >
          {level.title}
        </Text>
        <Text className="mt-0.5 text-sm text-joga-muted">
          {level.subtitle}
        </Text>
      </View>
      {selected && (
        <View className="h-6 w-6 items-center justify-center rounded-full bg-joga-volt">
          <Text className="text-xs font-bold text-joga-black">
            {"\u2713"}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  return (
    <SafeAreaView className="flex-1 bg-joga-dark">
      <View className="flex-1 px-5 pt-8">
        <View className="mb-2">
          <Text className="text-center text-base font-bold uppercase tracking-widest text-joga-volt">
            Joga
          </Text>
        </View>

        <Text className="mb-2 text-center text-4xl font-extrabold text-joga-text">
          What's your level?
        </Text>
        <Text className="mb-8 text-center text-base text-joga-muted">
          We'll match you with the right players and games.
        </Text>

        <View className="flex-1">
          {SKILL_LEVELS.map((level) => (
            <SkillCard
              key={level.id}
              level={level}
              selected={selectedLevel === level.id}
              onPress={() => setSelectedLevel(level.id)}
            />
          ))}
        </View>

        <Pressable
          onPress={() => router.replace("/(tabs)")}
          disabled={!selectedLevel}
          className={`mb-8 items-center rounded-2xl py-4 ${
            selectedLevel ? "bg-joga-volt active:opacity-80" : "bg-joga-border"
          }`}
          accessibilityRole="button"
          accessibilityLabel="Continue to app"
          accessibilityState={{ disabled: !selectedLevel }}
        >
          <Text
            className={`text-lg font-bold ${
              selectedLevel ? "text-joga-black" : "text-joga-muted"
            }`}
          >
            Let's Go
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
