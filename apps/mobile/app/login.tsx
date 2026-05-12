import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/constants/Colors";
import { useAuth } from "@/lib/auth-context";

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
    <SafeAreaView className="flex-1 bg-joga-dark">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <Text className="mb-1 text-center text-base font-bold uppercase tracking-widest text-joga-volt">
            Joga
          </Text>
          <Text className="mb-8 text-center text-3xl font-extrabold text-joga-text">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </Text>

          {isSignUp && (
            <View className="mb-4 w-full flex-row gap-4">
              <TextInput
                className="min-w-0 flex-1 rounded-xl border border-joga-border bg-joga-card px-4 py-3.5 text-base text-joga-text"
                placeholder="First name"
                placeholderTextColor={colors.muted}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                autoComplete="given-name"
                accessibilityLabel="First name"
              />
              <TextInput
                className="min-w-0 flex-1 rounded-xl border border-joga-border bg-joga-card px-4 py-3.5 text-base text-joga-text"
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
            className="mb-4 rounded-xl border border-joga-border bg-joga-card px-4 py-3.5 text-base text-joga-text"
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
            className="mb-6 rounded-xl border border-joga-border bg-joga-card px-4 py-3.5 text-base text-joga-text"
            placeholder="Password"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={isSignUp ? "new-password" : "current-password"}
            accessibilityLabel="Password"
          />

          {error && (
            <Text className="mb-4 text-center text-sm text-joga-pink">
              {error}
            </Text>
          )}

          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className={`mb-4 items-center rounded-xl py-4 ${
              loading ? "bg-joga-border" : "bg-joga-volt active:opacity-80"
            }`}
            accessibilityRole="button"
            accessibilityLabel={isSignUp ? "Create account" : "Sign in"}
          >
            {loading ? (
              <ActivityIndicator color={colors.volt} />
            ) : (
              <Text className="text-base font-bold text-joga-black">
                {isSignUp ? "Sign Up" : "Sign In"}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              setIsSignUp((v) => !v);
              setError(null);
            }}
            className="items-center py-3"
            accessibilityRole="button"
            accessibilityLabel={
              isSignUp
                ? "Switch to sign in"
                : "Switch to create account"
            }
          >
            <Text className="text-sm text-joga-muted">
              {isSignUp
                ? "Already have an account? "
                : "Don\u2019t have an account? "}
              <Text className="font-bold text-joga-volt">
                {isSignUp ? "Sign In" : "Sign Up"}
              </Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
