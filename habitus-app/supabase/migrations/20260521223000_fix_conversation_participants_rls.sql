-- Evita recursión infinita al leer participantes de conversación.
-- La política anterior consultaba la misma tabla dentro de su propio USING.

CREATE OR REPLACE FUNCTION public.habitus_is_conversation_member(conv_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.habitus_conversation_participants
    WHERE conversation_id = conv_id
      AND profile_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.habitus_is_conversation_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_is_conversation_member(uuid) TO authenticated;

DROP POLICY IF EXISTS habitus_cp_read ON public.habitus_conversation_participants;
CREATE POLICY habitus_cp_read ON public.habitus_conversation_participants
  FOR SELECT
  USING (public.habitus_is_conversation_member(conversation_id));
