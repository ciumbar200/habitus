import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
let configured = false;

export function initHabitus(supabase: SupabaseClient, options?: { configured?: boolean }) {
  client = supabase;
  configured = options?.configured ?? true;
}

export function getSupabase(): SupabaseClient {
  if (!client) {
    throw new Error("Habitus: llama initHabitus() antes de usar servicios.");
  }
  return client;
}

export function isHabitusConfigured(): boolean {
  return configured;
}
