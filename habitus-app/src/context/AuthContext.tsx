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
  fetchCompatQuiz,
  isQuizComplete,
  normalizeImageUrl,
  profileNeedsCompatQuiz,
  translateAuthError,
  type AccountRoleSlug,
  type Profile,
} from "@habitus/core";
import { redirectAfterAuth } from "../lib/returnTo";
import { supabase } from "../lib/supabase";

type AuthResult = { error: string | null; redirect?: string };

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileReady: boolean;
  quizComplete: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (
    email: string,
    password: string,
    name: string,
    accountRole: AccountRoleSlug,
  ) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  markQuizComplete: () => void;
  updateAccountRole: (role: AccountRoleSlug) => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("habitus_profiles")
    .select(
      "id, display_name, avatar_url, profile_score, role_title, account_role, bio_quote, is_discoverable, is_admin, birth_date, onboarding_completed_at, identity_status",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id,
    displayName: data.display_name,
    avatarUrl: normalizeImageUrl(data.avatar_url),
    profileScore: data.profile_score,
    roleTitle: data.role_title,
    accountRole: data.account_role as AccountRoleSlug | null,
    bioQuote: data.bio_quote,
    isDiscoverable: data.is_discoverable ?? false,
    isAdmin: data.is_admin ?? false,
    identityStatus: (data.identity_status ?? "none") as Profile["identityStatus"],
    birthDate: data.birth_date,
    onboardingCompletedAt: data.onboarding_completed_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileReady, setProfileReady] = useState(true);
  const [quizComplete, setQuizComplete] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!session?.user.id) {
      setProfile(null);
      setQuizComplete(true);
      setProfileReady(true);
      return;
    }
    try {
      const p = await loadProfile(session.user.id);
      setProfile(p);
      if (!p?.accountRole || !profileNeedsCompatQuiz(p)) {
        setQuizComplete(true);
      } else {
        const q = await fetchCompatQuiz(session.user.id);
        setQuizComplete(isQuizComplete(q, p.accountRole));
      }
    } catch (err) {
      console.error("Error al cargar perfil:", err);
      setProfile(null);
      setQuizComplete(true);
    } finally {
      setProfileReady(true);
    }
  }, [session?.user.id]);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
      })
      .catch((err) => {
        console.error("Error al leer sesión:", err);
        setSession(null);
      })
      .finally(() => setLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user.id) {
      setProfileReady(false);
      void refreshProfile();
    } else {
      setProfile(null);
      setQuizComplete(true);
      setProfileReady(true);
    }
  }, [session?.user.id, refreshProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: translateAuthError(error.message) };
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user.id) return { error: "No se pudo iniciar sesión." };
    setSession(data.session);
    const p = await loadProfile(data.session.user.id);
    setProfile(p);
    const quiz = await fetchCompatQuiz(data.session.user.id);
    if (p?.accountRole && profileNeedsCompatQuiz(p)) {
      setQuizComplete(isQuizComplete(quiz, p.accountRole));
    } else {
      setQuizComplete(true);
    }
    setProfileReady(true);
    return { error: null, redirect: redirectAfterAuth(p, quiz) };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name: string, accountRole: AccountRoleSlug) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            account_role: accountRole,
          },
        },
      });
      if (error) return { error: translateAuthError(error.message) };
      return { error: null, redirect: "/onboarding" };
    },
    [],
  );

  const markQuizComplete = useCallback(() => setQuizComplete(true), []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setQuizComplete(true);
  }, []);

  const updateAccountRole = useCallback(
    async (role: AccountRoleSlug) => {
      if (!session?.user.id) return "No hay sesión activa.";
      const isDiscoverable = role === "inquilino";
      const { error } = await supabase
        .from("habitus_profiles")
        .update({ account_role: role, is_discoverable: isDiscoverable })
        .eq("id", session.user.id);

      if (error) return error.message;

      await supabase.auth.updateUser({
        data: { account_role: role },
      });

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
      profileReady,
      quizComplete,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      markQuizComplete,
      updateAccountRole,
    }),
    [
      session,
      profile,
      loading,
      profileReady,
      quizComplete,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      markQuizComplete,
      updateAccountRole,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
