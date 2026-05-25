import { getSupabase } from "../client";

export type MoonAccessConfig = {
  enabled: boolean;
  showPricing: boolean;
  userThreshold: number;
  priceEur: number;
};

export type SubscriptionStatus = "inactive" | "trialing" | "active" | "past_due" | "cancelled";

export type MoonSubscription = {
  profileId: string;
  plan: string;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
};

const DEFAULT_CONFIG: MoonAccessConfig = {
  enabled: false,
  showPricing: false,
  userThreshold: 1000,
  priceEur: 9,
};

async function readConfigKey(key: string): Promise<unknown> {
  const { data, error } = await getSupabase()
    .from("habitus_platform_config")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error || !data) return null;
  return data.value;
}

export async function fetchMoonAccessConfig(): Promise<MoonAccessConfig> {
  try {
    const [enabled, showPricing, threshold, price] = await Promise.all([
      readConfigKey("moon_access_enabled"),
      readConfigKey("moon_access_show_pricing"),
      readConfigKey("moon_access_user_threshold"),
      readConfigKey("moon_access_price_eur"),
    ]);
    return {
      enabled: enabled === true || enabled === "true",
      showPricing: showPricing === true || showPricing === "true",
      userThreshold: Number(threshold ?? DEFAULT_CONFIG.userThreshold),
      priceEur: Number(price ?? DEFAULT_CONFIG.priceEur),
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function fetchRegisteredUserCount(): Promise<number> {
  const { count, error } = await getSupabase()
    .from("habitus_profiles")
    .select("id", { count: "exact", head: true });
  if (error) return 0;
  return count ?? 0;
}

export async function fetchMoonAccessReadiness(): Promise<{
  userCount: number;
  threshold: number;
  readyToEnable: boolean;
  config: MoonAccessConfig;
}> {
  const [userCount, config] = await Promise.all([
    fetchRegisteredUserCount(),
    fetchMoonAccessConfig(),
  ]);
  return {
    userCount,
    threshold: config.userThreshold,
    readyToEnable: userCount >= config.userThreshold,
    config,
  };
}

export async function fetchMySubscription(profileId: string): Promise<MoonSubscription | null> {
  const { data, error } = await getSupabase()
    .from("habitus_subscriptions")
    .select("profile_id, plan, status, current_period_end")
    .eq("profile_id", profileId)
    .eq("plan", "moon_access")
    .maybeSingle();

  if (error || !data) return null;
  return {
    profileId: data.profile_id,
    plan: data.plan,
    status: data.status as SubscriptionStatus,
    currentPeriodEnd: data.current_period_end,
  };
}

export async function adminUpdateMoonAccessConfig(
  partial: Partial<MoonAccessConfig>,
): Promise<string | null> {
  const updates: { key: string; value: unknown }[] = [];
  if (partial.enabled !== undefined) updates.push({ key: "moon_access_enabled", value: partial.enabled });
  if (partial.showPricing !== undefined)
    updates.push({ key: "moon_access_show_pricing", value: partial.showPricing });
  if (partial.userThreshold !== undefined)
    updates.push({ key: "moon_access_user_threshold", value: partial.userThreshold });
  if (partial.priceEur !== undefined) updates.push({ key: "moon_access_price_eur", value: partial.priceEur });

  for (const u of updates) {
    const { error } = await getSupabase()
      .from("habitus_platform_config")
      .upsert({ key: u.key, value: u.value, updated_at: new Date().toISOString() });
    if (error) return error.message;
  }
  return null;
}
