-- Seed verification integration settings (Stripe keys optional; env fallback)
INSERT INTO public.habitus_platform_config (key, value, updated_at)
VALUES (
  'verification_integration_settings',
  jsonb_build_object(
    'stripeIdentitySuccessUrl', 'https://www.moonsharedliving.com/verificacion?stripe=complete',
    'retentionDays', 30
  ),
  now()
)
ON CONFLICT (key) DO NOTHING;
