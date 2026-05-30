-- Debug: Check if tables and functions exist
-- This will help diagnose the 404 issue

DO $$
BEGIN
  -- Check if tables exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'habitus_rooms') THEN
    RAISE NOTICE 'habitus_rooms table does not exist';
  ELSE
    RAISE NOTICE 'habitus_rooms table exists';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'habitus_room_assignments') THEN
    RAISE NOTICE 'habitus_room_assignments table does not exist';
  ELSE
    RAISE NOTICE 'habitus_room_assignments table exists';
  END IF;

  -- Check if function exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'admin_get_rooms_with_assignments') THEN
    RAISE NOTICE 'admin_get_rooms_with_assignments function does not exist';
  ELSE
    RAISE NOTICE 'admin_get_rooms_with_assignments function exists';
  END IF;
END $$;
