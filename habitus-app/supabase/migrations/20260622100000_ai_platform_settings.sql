-- Configuración IA editable desde admin (modelos + gateway; API key opcional en BD)

INSERT INTO public.habitus_platform_config (key, value)
VALUES (
  'ai_platform_settings',
  jsonb_build_object(
    'gatewayBaseUrl', 'https://ai-gateway.vercel.sh/v1',
    'defaultModel', 'openai/gpt-4o-mini',
    'matchModel', 'openai/gpt-4o-mini',
    'safetyModel', 'openai/gpt-4o-mini',
    'visionModel', 'openai/gpt-4o-mini'
  )
)
ON CONFLICT (key) DO NOTHING;
