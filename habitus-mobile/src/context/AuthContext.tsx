import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  ensureProfileForAuthUser,
  fetchCompatQuiz,
  isQuizComplete,
  roleNeedsCompatQuiz,
  translateAuthError,
  type AccountRoleSlug,
  type Profile,
} from "@habitus/core";
import { consumePendingOAuthSignup } from "../lib/oauth";
import { supabase } from "../lib/supabase";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  quizComplete: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    name: string,
    accountRole: AccountRoleSlug,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateAccountRole: (role: AccountRoleSlug) => Promise<string | null>;
  finalizeOAuthSession: () => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("habitus_profiles")
    .select(
      "id, display_name, avatar_url, profile_score, role_title, account_role, bio_quote, is_discoverable, is_admin, birth_date, onboarding_completed_at",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    profileScore: data.profile_score,
    roleTitle: data.role_title,
    accountRole: data.account_role as AccountRoleSlug | null,
    bioQuote: data.bio_quote,
    isDiscoverable: data.is_discoverable ?? false,
    isAdmin: data.is_admin ?? false,
    birthDate: data.birth_date,
    onboardingCompletedAt: data.onboarding_completed_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizComplete, setQuizComplete] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!session?.user.id) {
      setProfile(null);
      setQuizComplete(true);
      return;
    }
    const p = await loadProfile(session.user.id);
    setProfile(p);
    if (!p?.accountRole || !roleNeedsCompatQuiz(p.accountRole)) {
      setQuizComplete(true);
    } else {
      const q = await fetchCompatQuiz(session.user.id);
      setQuizComplete(isQuizComplete(q, p.accountRole));
    }
  }, [session?.user.id]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user.id) refreshProfile();
    else {
      setProfile(null);
      setQuizComplete(true);
    }
  }, [session?.user.id, refreshProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? translateAuthError(error.message) : null };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name: string, accountRole: AccountRoleSlug) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name, account_role: accountRole } },
      });
      return { error: error ? translateAuthError(error.message) : null };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const finalizeOAuthSession = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) return { error: "No hay sesión activa." };
    const pending = await consumePendingOAuthSignup();
    const sync = await ensureProfileForAuthUser(
      data.session.user,
      pending.isSignUp ? (pending.accountRole as AccountRoleSlug | null) : undefined,
    );
    if (sync.error) return { error: sync.error };
    await refreshProfile();
    return { error: null };
  }, [refreshProfile]);

  const updateAccountRole = useCallback(
    async (role: AccountRoleSlug) => {
      if (!session?.user.id) return "No hay sesión activa.";
      const { error } = await supabase
        .from("habitus_profiles")
        .update({
          account_role: role,
          is_discoverable: role === "inquilino",
        })
        .eq("id", session.user.id);
      if (error) return error.message;
      await supabase.auth.updateUser({ data: { account_role: role } });
      await refreshProfile();
      return null;
    },
    [session?.user.id, refreshProfile],
  );

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      quizComplete,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      updateAccountRole,
      finalizeOAuthSession,
    }),
    [
      session,
      profile,
      loading,
      quizComplete,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      updateAccountRole,
      finalizeOAuthSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
