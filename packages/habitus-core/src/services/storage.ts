import { getSupabase } from "../client";

export type StorageBucket = "habitus-avatars" | "habitus-listings";

const MAX_SIZE_MB = 5;

export async function uploadImage(
  bucket: StorageBucket,
  userId: string,
  file: File,
): Promise<{ url: string | null; error: string | null }> {
  if (!file.type.startsWith("image/")) {
    return { url: null, error: "Solo se permiten imágenes (JPG, PNG, WebP)." };
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return { url: null, error: `La imagen no puede superar ${MAX_SIZE_MB} MB.` };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await getSupabase().storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) return { url: null, error: error.message };

  const { data } = getSupabase().storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
