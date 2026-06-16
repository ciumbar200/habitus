-- seed-moon-score-demo.sql
-- ----------------------------------------------------------------------------
-- Semilla de DEMO: crea 3 endosos entre inquilinos demo para que veas un Moon
-- Score "vivo" (endorsements>0) en un perfil. Pensado para pegasus en el Query
-- Editor de Supabase (service role, ignora RLS). El trigger recalcula solo.
--
-- Es re-ejecutable (guarda con NOT EXISTS). Para deshacer:
--   DELETE FROM habitus_roommate_endorsements WHERE comment LIKE 'Demo:%';
-- ----------------------------------------------------------------------------
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      ORDER BY
        (verification_badge = 'identity_verified' OR identity_status = 'verified') DESC,
        created_at
    ) AS rn
  FROM habitus_profiles
  WHERE account_role = 'inquilino'
),
target AS (SELECT id FROM ranked WHERE rn = 1),   -- el primero (prioriza verificado)
src    AS (SELECT id FROM ranked WHERE rn BETWEEN 2 AND 4)  -- hasta 3 endosantes
INSERT INTO habitus_roommate_endorsements
  (endorser_id, endorsee_id, cleanliness, respect, communication, payment, would_live_again, comment)
SELECT
  s.id, t.id,
  5, 5, 4, 5,       -- rating alto medio -> componente de rating cerca del tope
  true,
  'Demo: gran conviviente, limpio y respetuoso.'
FROM src s
CROSS JOIN target t
WHERE NOT EXISTS (
  SELECT 1 FROM habitus_roommate_endorsements e
  WHERE e.endorser_id = s.id AND e.endorsee_id = t.id
);

-- Ver el resultado:
SELECT display_name, identity_status, moon_score, moon_score_endorsements
FROM habitus_profiles
WHERE moon_score_endorsements > 0;
