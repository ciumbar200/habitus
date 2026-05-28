import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { initHabitus, isHabitusConfigured } from "@habitus/core";

// Hardcoded Supabase credentials for iOS build
const url = "https://qectypyfbjlhabdmxigk.supabase.co";
const key = "sb_publishable_wg8kTpMZ3ZA2BhfSG04MLA_sTDXZbv4";

const client = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

initHabitus(client, { configured: true });

export const supabase = client;
export { isHabitusConfigured };
