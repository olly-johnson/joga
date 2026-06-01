import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { api } from "./api";
import { shouldProvisionOnAuthChange } from "./auth-events";

/** Idempotently ensure the local User row exists for the current session. */
async function provisionUser() {
  try {
    await api.post("/auth/sync");
  } catch {
    // Best-effort; a later authenticated request will surface real failures.
  }
}

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.access_token) {
        api.defaults.headers.common.Authorization = `Bearer ${s.access_token}`;
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (s?.access_token) {
        api.defaults.headers.common.Authorization = `Bearer ${s.access_token}`;
        if (shouldProvisionOnAuthChange(event, true)) {
          void provisionUser();
        }
      } else {
        delete api.defaults.headers.common.Authorization;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(
    email: string,
    password: string,
  ): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return error?.message ?? null;
  }

  async function signUp(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<string | null> {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
      },
    });
    if (error) return error.message;

    try {
      await api.post("/auth/sync");
    } catch {
      // sync will happen on next authenticated request
    }
    return null;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
