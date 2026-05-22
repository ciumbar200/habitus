-- Chat completo: reutiliza habitus_is_conversation_member y evita subconsultas recursivas
-- en conversaciones, mensajes e inserción de participantes.

-- Conversaciones: leer y actualizar (updated_at al enviar mensaje)
DROP POLICY IF EXISTS habitus_conv_read ON public.habitus_conversations;
CREATE POLICY habitus_conv_read ON public.habitus_conversations
  FOR SELECT TO authenticated
  USING (public.habitus_is_conversation_member(id));

DROP POLICY IF EXISTS habitus_conv_update ON public.habitus_conversations;
CREATE POLICY habitus_conv_update ON public.habitus_conversations
  FOR UPDATE TO authenticated
  USING (public.habitus_is_conversation_member(id))
  WITH CHECK (public.habitus_is_conversation_member(id));

-- Mensajes
DROP POLICY IF EXISTS habitus_msg_read ON public.habitus_messages;
CREATE POLICY habitus_msg_read ON public.habitus_messages
  FOR SELECT TO authenticated
  USING (public.habitus_is_conversation_member(conversation_id));

DROP POLICY IF EXISTS habitus_msg_insert ON public.habitus_messages;
CREATE POLICY habitus_msg_insert ON public.habitus_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.habitus_is_conversation_member(conversation_id)
  );

-- Insertar participante (el RPC habitus_create_conversation_with usa SECURITY DEFINER)
DROP POLICY IF EXISTS habitus_cp_insert ON public.habitus_conversation_participants;
CREATE POLICY habitus_cp_insert ON public.habitus_conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    profile_id = auth.uid()
    OR public.habitus_is_conversation_member(conversation_id)
  );

-- Ver perfil del otro usuario en un hilo de chat (aunque no sea discoverable)
CREATE OR REPLACE FUNCTION public.habitus_shares_conversation_with(other_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.habitus_conversation_participants cp1
    INNER JOIN public.habitus_conversation_participants cp2
      ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.profile_id = auth.uid()
      AND cp2.profile_id = other_id
  );
$$;

REVOKE ALL ON FUNCTION public.habitus_shares_conversation_with(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_shares_conversation_with(uuid) TO authenticated;

DROP POLICY IF EXISTS habitus_profiles_conversation ON public.habitus_profiles;
CREATE POLICY habitus_profiles_conversation ON public.habitus_profiles
  FOR SELECT TO authenticated
  USING (public.habitus_shares_conversation_with(id));

-- Realtime (idempotente)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.habitus_messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
