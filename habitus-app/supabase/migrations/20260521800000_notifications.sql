-- Bandeja in-app + preferencias de notificaciones (push/email por tipo)

CREATE TABLE IF NOT EXISTS public.habitus_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.habitus_profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  entity_id text,
  idempotency_key text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS habitus_notifications_idempotency_uq
  ON public.habitus_notifications (profile_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS habitus_notifications_profile_unread_idx
  ON public.habitus_notifications (profile_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS habitus_notifications_profile_created_idx
  ON public.habitus_notifications (profile_id, created_at DESC);

ALTER TABLE public.habitus_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS habitus_notifications_read ON public.habitus_notifications;
CREATE POLICY habitus_notifications_read ON public.habitus_notifications
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.habitus_is_admin());

DROP POLICY IF EXISTS habitus_notifications_update ON public.habitus_notifications;
CREATE POLICY habitus_notifications_update ON public.habitus_notifications
  FOR UPDATE TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Inserts solo vía service role (API serverless)
DROP POLICY IF EXISTS habitus_notifications_insert ON public.habitus_notifications;
CREATE POLICY habitus_notifications_insert ON public.habitus_notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.habitus_is_admin() AND profile_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.habitus_notification_preferences (
  profile_id uuid PRIMARY KEY REFERENCES public.habitus_profiles(id) ON DELETE CASCADE,
  push_enabled boolean NOT NULL DEFAULT true,
  email_enabled boolean NOT NULL DEFAULT true,
  email_messages boolean NOT NULL DEFAULT true,
  email_applications boolean NOT NULL DEFAULT true,
  email_groups boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.habitus_notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS habitus_notification_prefs_read ON public.habitus_notification_preferences;
CREATE POLICY habitus_notification_prefs_read ON public.habitus_notification_preferences
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.habitus_is_admin());

DROP POLICY IF EXISTS habitus_notification_prefs_upsert ON public.habitus_notification_preferences;
CREATE POLICY habitus_notification_prefs_upsert ON public.habitus_notification_preferences
  FOR ALL TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Realtime para badge in-app
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'habitus_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.habitus_notifications;
  END IF;
END $$;
