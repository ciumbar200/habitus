# Variables para Vercel (Production + Preview)

Copia estas variables en **Vercel → habitus-habitus-app → Settings → Environment Variables**.
No las subas al repo.

| Variable | Valor |
|----------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | *(tu service role de Supabase)* |
| `VITE_SUPABASE_URL` | `https://qectypyfbjlhabdmxigk.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | *(tu publishable key)* |
| `VITE_SITE_URL` | `https://www.moonsharedliving.com` |
| `VITE_ONESIGNAL_APP_ID` | `8ab2d231-41db-49a5-9543-eac1df3986b4` |
| `ONESIGNAL_APP_ID` | `8ab2d231-41db-49a5-9543-eac1df3986b4` |
| `ONESIGNAL_REST_API_KEY` | OneSignal → Settings → Keys & IDs → **REST API Key** |
| `BREVO_API_KEY` | *(tu clave xkeysib-… de Brevo)* |
| `BREVO_SENDER_EMAIL` | `hello@moonsharedliving.com` |
| `BREVO_SENDER_NAME` | `: moon shared living` |

## Supabase (obligatorio)

Aplicar en SQL Editor si no está hecho:

- `habitus-app/supabase/migrations/20260521800000_notifications.sql`

Crea `habitus_notifications`, `habitus_notification_preferences` y Realtime.

## Probar en local

```bash
cd habitus-app
# API routes + env server:
npx vercel dev
```

Con `npm run dev` solo Vite **no** ejecuta `/api/notify/event`; usa `vercel dev` para probar emails.

## Smoke test producción

1. Inquilino solicita piso → propietario recibe email de `hello@moonsharedliving.com` + campana in-app.
2. `curl -X POST https://www.moonsharedliving.com/api/notify/event` sin JWT → **401**.
