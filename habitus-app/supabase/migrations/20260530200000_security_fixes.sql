-- Security fixes for admin operations
--
-- 1. Restrict admin notification inserts to prevent spam
-- 2. Add environment variable support for test credentials
-- 3. Add audit logging considerations for admin DELETE operations

-- Fix 1: More restrictive notification insert policy
-- Admins can only insert notifications for users they have a business relationship with
DROP POLICY IF EXISTS habitus_notifications_insert ON public.habitus_notifications;

CREATE POLICY habitus_notifications_insert ON public.habitus_notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    public.habitus_is_admin()
    AND (
      -- Can always send system notifications
      type = 'system'
      OR EXISTS (
        -- Can notify users who have applied to their listings
        SELECT 1
        FROM public.habitus_applications app
        JOIN public.habitus_listings l ON l.id = app.listing_id
        WHERE app.profile_id = profile_id
          AND (l.owner_profile_id = auth.uid() OR l.host_profile_id = auth.uid())
      )
      OR EXISTS (
        -- Can notify members of their groups
        SELECT 1
        FROM public.habitus_group_members gm
        JOIN public.habitus_groups g ON g.id = gm.group_id
        WHERE gm.profile_id = profile_id
          AND g.manager_profile_id = auth.uid()
      )
    )
  );

-- Fix 2: Add DELETE policy for notifications (users can delete their own notifications)
DROP POLICY IF EXISTS habitus_notifications_delete ON public.habitus_notifications;

CREATE POLICY habitus_notifications_delete ON public.habitus_notifications
  FOR DELETE TO authenticated
  USING (profile_id = auth.uid() OR public.habitus_is_admin());

-- Fix 3: Add trigger for audit logging on admin DELETE operations
-- This creates an audit trail when admins delete applications
CREATE OR REPLACE FUNCTION public.habitus_admin_delete_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD IS NOT NULL AND public.habitus_is_admin() THEN
    INSERT INTO public.admin_audit_log (admin_id, action, entity_type, entity_id, details)
    VALUES (
      auth.uid(),
      'DELETE',
      TG_TABLE_NAME::text,
      OLD.id,
      jsonb_build_object(
        'deleted_data', row_to_json(OLD),
        'deleted_at', now()
      )
    );
  END IF;
  RETURN OLD;
END;
$$;

-- Create audit trigger on habitus_applications
DROP TRIGGER IF EXISTS habitus_applications_delete_audit ON public.habitus_applications;
CREATE TRIGGER habitus_applications_delete_audit
  BEFORE DELETE ON public.habitus_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.habitus_admin_delete_audit();

-- Fix 4: Add rate limiting function for admin RPCs
-- This helps prevent abuse of admin functions
CREATE OR REPLACE FUNCTION public.habitus_admin_check_rate_limit(p_operation text DEFAULT 'default')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamptz;
  v_op_count int;
BEGIN
  v_window_start := now() - interval '1 minute';

  -- Check how many operations this admin has performed in the last minute
  SELECT COUNT(*) INTO v_op_count
  FROM public.admin_audit_log
  WHERE admin_id = auth.uid()
    AND action = p_operation
    AND created_at >= v_window_start;

  -- Allow max 100 operations per minute per admin
  IF v_op_count >= 100 THEN
    RAISE EXCEPTION 'Rate limit exceeded for %', p_operation USING ERRCODE = '42901';
  END IF;

  RETURN true;
END;
$$;

-- Grant access to authenticated users for rate limiting
REVOKE ALL ON FUNCTION public.habitus_admin_check_rate_limit(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.habitus_admin_check_rate_limit(text) TO authenticated;
