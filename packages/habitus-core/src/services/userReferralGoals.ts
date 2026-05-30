import { getSupabase } from "../client";

/**
 * PROGRAMA DE REFERIDOS PARA USUARIOS COMUNES
 * Meta de 5 referidos cualificados para obtener recompensas
 * Diferente del sistema de embajadores/influencers
 */

export type ReferralGoalStatus = "active" | "achieved" | "rewarded";
export type ReferralRewardType = "premium_month" | "discount" | "cashback" | "none";

export type UserReferralGoal = {
  profileId: string;
  goalCount: number;
  currentCount: number;
  status: ReferralGoalStatus;
  remainingCount: number;
  achievedAt: string | null;
  rewardedAt: string | null;
  rewardType: ReferralRewardType | null;
  rewardValue: number;
  createdAt: string;
  updatedAt: string;
};

export type UserReferralStats = {
  profileId: string;
  goalCount: number;
  currentCount: number;
  status: ReferralGoalStatus;
  remainingCount: number;
  achievedAt: string | null;
  rewardedAt: string | null;
  progress: number; // 0-100
};

/**
 * Obtiene la meta de referidos de un usuario
 */
export async function fetchUserReferralGoal(profileId: string): Promise<UserReferralGoal | null> {
  const { data, error } = await getSupabase()
    .from("habitus_referral_goals")
    .select("*")
    .eq("profile_id", profileId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // No rows found
    throw error;
  }

  return {
    profileId: data.profile_id,
    goalCount: data.goal_count,
    currentCount: data.current_count,
    status: data.status,
    remainingCount: data.goal_count - data.current_count,
    achievedAt: data.achieved_at,
    rewardedAt: data.rewarded_at,
    rewardType: data.reward_type,
    rewardValue: Number(data.reward_value),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Obtiene estadísticas de referidos de un usuario (para mostrar en UI)
 */
export async function getUserReferralStats(profileId: string): Promise<UserReferralStats | null> {
  const { data, error } = await getSupabase()
    .rpc("get_user_referral_stats", { p_profile_id: profileId });

  if (error) throw error;
  if (!data || data.length === 0) return null;

  const row = data[0];
  const progress = row.goal_count > 0 ? Math.min(100, (row.current_count / row.goal_count) * 100) : 0;

  return {
    profileId: row.profile_id,
    goalCount: row.goal_count,
    currentCount: row.current_count,
    status: row.status,
    remainingCount: row.remaining_count,
    achievedAt: row.achieved_at,
    rewardedAt: row.rewarded_at,
    progress: Math.round(progress),
  };
}

/**
 * Actualiza manualmente el contador de referidos de un usuario
 */
export async function updateReferralGoal(profileId: string): Promise<{ achieved: boolean; goal: UserReferralGoal | null }> {
  const { data, error } = await getSupabase().rpc("update_referral_goal", {
    p_profile_id: profileId,
  });

  if (error) throw error;

  const achieved = data === true;
  const goal = await fetchUserReferralGoal(profileId);

  return { achieved, goal };
}

/**
 * Reclama la recompensa cuando se alcanza la meta de 5 referidos
 */
export async function claimReferralReward(profileId: string): Promise<{
  success: boolean;
  rewardType?: string;
  rewardValue?: number;
  message?: string;
  error?: string;
}> {
  const { data, error } = await getSupabase().rpc("claim_referral_reward", {
    p_profile_id: profileId,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  if (!data) {
    return {
      success: false,
      error: "No se pudo procesar la solicitud",
    };
  }

  // data devuelve un JSON build_object
  const result = typeof data === "string" ? JSON.parse(data) : data;

  if (result.error) {
    return {
      success: false,
      error: result.error,
    };
  }

  return {
    success: result.success,
    rewardType: result.reward_type,
    rewardValue: result.reward_value,
    message: result.message,
  };
}

/**
 * Obtiene todos los usuarios con meta de referidos (para admin)
 */
export async function fetchAllReferralGoals(): Promise<UserReferralGoal[]> {
  const { data, error } = await getSupabase()
    .from("habitus_referral_goals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    profileId: row.profile_id,
    goalCount: row.goal_count,
    currentCount: row.current_count,
    status: row.status,
    remainingCount: row.goal_count - row.current_count,
    achievedAt: row.achieved_at,
    rewardedAt: row.rewarded_at,
    rewardType: row.reward_type,
    rewardValue: Number(row.reward_value),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Crea o actualiza la meta de referidos de un usuario (admin)
 */
export async function setReferralGoal(
  profileId: string,
  goalCount: number = 5
): Promise<string | null> {
  const { data, error } = await getSupabase()
    .from("habitus_referral_goals")
    .upsert({
      profile_id: profileId,
      goal_count: goalCount,
    })
    .select()
    .single();

  if (error) return error.message;
  return null;
}
