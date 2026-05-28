-- Rol embajador: programa de influencers/referidos (acceso solo por invitación/admin)
-- account_role es un enum de PG; hay que añadir el valor antes de usarlo.
ALTER TYPE habitus_account_role ADD VALUE IF NOT EXISTS 'embajador';

-- Demo: asignar rol embajador si el usuario de demo existe (no-op si no existe)
UPDATE public.habitus_profiles p
SET account_role = 'embajador', onboarding_completed_at = COALESCE(p.onboarding_completed_at, now())
FROM auth.users u
WHERE u.id = p.id
  AND u.email = 'demo-embajador@e2e.habitus.local';
