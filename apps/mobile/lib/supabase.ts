import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

// Placeholders keep `createClient` happy during static web render / screenshot
// builds when env vars aren't set. Real auth calls will fail loudly without
// proper credentials — which is the desired behaviour.
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

// AsyncStorage touches `window` at init time, which breaks Expo's static web
// render. On web, let Supabase fall back to its default (localStorage in the
// browser, in-memory during SSR). On native, persist via AsyncStorage.
const storage = Platform.OS === "web" ? undefined : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
