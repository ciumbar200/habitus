import type { AccountRoleSlug } from "../types/models";
import type { CompatQuizAnswers } from "../types/compatibility";
import { isQuizComplete } from "./compatibility";
import { getSupabase } from "../client";

export async function fetchCompatQuiz(userId: string): Promise<CompatQuizAnswers> {
  const { data, error } = await getSupabase()
    .from("habitus_profiles")
    .select("compat_quiz")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  const raw = data?.compat_quiz;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as CompatQuizAnswers;
  }
  return {};
}

export async function saveCompatQuiz(
  userId: string,
  answers: CompatQuizAnswers,
  role: AccountRoleSlug,
): Promise<{ error: string | null }> {
  if (!isQuizComplete(answers, role)) {
    return { error: "Completa todas las preguntas del cuestionario." };
  }

  const { data: existing, error: readErr } = await getSupabase()
    .from("habitus_profiles")
    .select("profile_score")
    .eq("id", userId)
    .maybeSingle();

  if (readErr) return { error: readErr.message };

  const scoreWithQuiz = Math.min(100, Math.max(existing?.profile_score ?? 0, 45));

  const { error } = await getSupabase()
    .from("habitus_profiles")
    .update({
      compat_quiz: answers,
      profile_score: scoreWithQuiz,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) return { error: error.message };
  return { error: null };
}
