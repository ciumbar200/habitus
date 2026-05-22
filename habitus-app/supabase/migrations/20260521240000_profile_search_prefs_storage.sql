-- Preferencias de búsqueda en perfil + bucket de avatares

ALTER TABLE public.habitus_profiles
  ADD COLUMN IF NOT EXISTS search_prefs jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.habitus_profiles.search_prefs IS
  'Preferencias de búsqueda del inquilino: ciudad, presupuesto, entrada, tipo de habitación';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'habitus-avatars',
  'habitus-avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS habitus_avatars_public_read ON storage.objects;
CREATE POLICY habitus_avatars_public_read ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'habitus-avatars');

DROP POLICY IF EXISTS habitus_avatars_auth_insert ON storage.objects;
CREATE POLICY habitus_avatars_auth_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'habitus-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS habitus_avatars_auth_update ON storage.objects;
CREATE POLICY habitus_avatars_auth_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'habitus-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS habitus_avatars_auth_delete ON storage.objects;
CREATE POLICY habitus_avatars_auth_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'habitus-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
