import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors } from "@/constants/Colors";
import { useAuth } from "@/lib/auth-context";
import { Button, Icon, Screen } from "@/components/ui";

const INPUT_CLASS =
  "rounded-2xl border border-joga-border bg-joga-elevated px-4 py-4 font-body text-base text-joga-text";

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);

    const err = isSignUp
      ? await signUp(email, password, firstName, lastName)
      : await signIn(email, password);

    setLoading(false);
    if (err) setError(err);
  }

  return (
    <Screen edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <View className="mb-9 items-center">
            <View className="mb-5 h-16 w-16 items-center justify-center rounded-3xl bg-joga-volt">
              <Icon name="zap" size={28} color={colors.onAccent} />
            </View>
            <Text className="font-display text-sm uppercase tracking-[4px] text-joga-volt">
              Joga
            </Text>
            <Text className="mt-2 font-heading text-3xl tracking-tight text-joga-text">
              {isSignUp ? "Create account" : "Welcome back"}
            </Text>
            <Text className="mt-2 font-body text-sm text-joga-muted">
              {isSignUp
                ? "Set up your profile to start playing."
                : "Sign in to book and join matches."}
            </Text>
          </View>

          {isSignUp && (
            <View className="mb-4 w-full flex-row gap-4">
              <TextInput
                className={`min-w-0 flex-1 ${INPUT_CLASS}`}
                placeholder="First name"
                placeholderTextColor={colors.muted}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                autoComplete="given-name"
                accessibilityLabel="First name"
              />
              <TextInput
                className={`min-w-0 flex-1 ${INPUT_CLASS}`}
                placeholder="Last name"
                placeholderTextColor={colors.muted}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                autoComplete="family-name"
                accessibilityLabel="Last name"
              />
            </View>
          )}

          <TextInput
            className={`mb-4 ${INPUT_CLASS}`}
            placeholder="Email"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            accessibilityLabel="Email address"
          />

          <TextInput
            className={`mb-6 ${INPUT_CLASS}`}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={isSignUp ? "new-password" : "current-password"}
            accessibilityLabel="Password"
          />

          {error && (
            <View className="mb-4 flex-row items-center gap-2 rounded-2xl border border-joga-pink/40 bg-joga-pink/10 px-4 py-3">
              <Icon name="alert-circle" size={16} color={colors.pink} />
              <Text className="flex-1 font-body text-sm text-joga-pink">
                {error}
              </Text>
            </View>
          )}

          <Button
            label={isSignUp ? "Create account" : "Sign in"}
            loading={loading}
            onPress={handleSubmit}
            accessibilityLabel={isSignUp ? "Create account" : "Sign in"}
          />

          <Pressable
            onPress={() => {
              setIsSignUp((v) => !v);
              setError(null);
            }}
            className="mt-5 items-center py-2"
            accessibilityRole="button"
            accessibilityLabel={
              isSignUp ? "Switch to sign in" : "Switch to create account"
            }
          >
            <Text className="font-body text-sm text-joga-muted">
              {isSignUp
                ? "Already have an account? "
                : "Don’t have an account? "}
              <Text className="font-semibold text-joga-volt">
                {isSignUp ? "Sign in" : "Sign up"}
              </Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
