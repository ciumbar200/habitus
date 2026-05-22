import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { initHabitus, isHabitusConfigured } from "@habitus/core";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const client = createClient(url ?? "https://placeholder.supabase.co", key ?? "placeholder", {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

initHabitus(client, { configured: Boolean(url && key) });

export const supabase = client;
export { isHabitusConfigured };
