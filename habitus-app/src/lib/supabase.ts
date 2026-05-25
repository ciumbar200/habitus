import { createClient } from "@supabase/supabase-js";
import { initHabitus, getSupabase, isHabitusConfigured } from "@habitus/core";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.warn(
    "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY. Copia .env.example a .env.local",
  );
}

const client = createClient(url ?? "https://placeholder.supabase.co", key ?? "placeholder", {
  auth: {
    flowType: "pkce",
    // Solo intercambiamos el code en /auth/callback (evita carrera con StrictMode).
    detectSessionInUrl: false,
    persistSession: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    autoRefreshToken: true,
  },
});

initHabitus(client, { configured: Boolean(url && key) });

export const supabase = getSupabase();
export const isSupabaseConfigured = isHabitusConfigured;
