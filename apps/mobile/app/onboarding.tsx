import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Button, Icon, type IconName, Screen } from "@/components/ui";
import { colors } from "@/constants/Colors";

interface SkillLevel {
  id: string;
  title: string;
  subtitle: string;
  icon: IconName;
}

const SKILL_LEVELS: SkillLevel[] = [
  {
    id: "beginner",
    title: "Beginner",
    subtitle: "Just getting started and learning the basics.",
    icon: "play",
  },
  {
    id: "intermediate",
    title: "Intermediate",
    subtitle: "Comfortable on the ball. A regular player.",
    icon: "trending-up",
  },
  {
    id: "advanced",
    title: "Advanced",
    subtitle: "Strong technical skills with a competitive edge.",
    icon: "zap",
  },
  {
    id: "expert",
    title: "Expert",
    subtitle: "Elite level. Top of the table.",
    icon: "award",
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
      className={`mb-3 flex-row items-center rounded-2xl border bg-joga-card p-4 ${
        selected ? "border-joga-volt" : "border-joga-hairline"
      } active:opacity-80`}
      accessibilityRole="button"
      accessibilityLabel={`Select ${level.title} skill level`}
      accessibilityState={{ selected }}
    >
      <View
        className={`mr-4 h-11 w-11 items-center justify-center rounded-2xl ${
          selected ? "bg-joga-volt/15" : "bg-joga-elevated"
        }`}
      >
        <Icon
          name={level.icon}
          size={20}
          color={selected ? colors.volt : colors.muted}
        />
      </View>
      <View className="flex-1">
        <Text
          className={`font-heading text-lg tracking-tight ${
            selected ? "text-joga-volt" : "text-joga-text"
          }`}
        >
          {level.title}
        </Text>
        <Text className="mt-0.5 font-body text-sm text-joga-muted">
          {level.subtitle}
        </Text>
      </View>
      {selected && (
        <View className="h-6 w-6 items-center justify-center rounded-full bg-joga-volt">
          <Icon name="check" size={14} color={colors.onAccent} />
        </View>
      )}
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  return (
    <Screen edges={["top", "bottom"]}>
      <View className="flex-1 px-5 pt-6">
        <Text className="mb-6 text-center font-display text-sm uppercase tracking-[4px] text-joga-volt">
          Joga
        </Text>

        <Text className="mb-2 font-heading text-3xl tracking-tight text-joga-text">
          Set your level
        </Text>
        <Text className="mb-8 font-body text-base leading-6 text-joga-muted">
          We use this to match you with the right players and games.
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

        <View className="pb-2 pt-4">
          <Button
            label="Continue"
            icon="arrow-right"
            disabled={!selectedLevel}
            onPress={() => router.replace("/(tabs)")}
            accessibilityLabel="Continue to app"
          />
        </View>
      </View>
    </Screen>
  );
}
