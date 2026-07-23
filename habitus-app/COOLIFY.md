# Despliegue en Coolify

## Aplicación

- Repositorio: `https://github.com/ciumbar200/habitus`
- Rama: `main`
- Build pack: `Dockerfile`
- Base directory: `/`
- Dockerfile: `/habitus-app/Dockerfile`
- Contexto de build: raíz del repositorio
- Puerto: `3000`
- Healthcheck: `/healthz`

La imagen sirve la SPA y adapta las antiguas funciones de Vercel bajo `/api`. Las rutas
del navegador usan fallback a `index.html`.

## Variables obligatorias

Configurar como variables de runtime:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SITE_URL=https://www.moonsharedliving.com
SUPABASE_SERVICE_ROLE_KEY
```

Las variables `VITE_*` se inyectan mediante `/runtime-config.js` al iniciar el contenedor;
no hace falta reconstruir la imagen al rotarlas.

Variables opcionales según las integraciones activas:

```text
CANONICAL_HOST=www.moonsharedliving.com
VITE_ONESIGNAL_APP_ID
VITE_SENTRY_DSN
VITE_SENTRY_ENVIRONMENT
VITE_SENTRY_RELEASE
VITE_SENTRY_TRACES_SAMPLE_RATE
ONESIGNAL_APP_ID
ONESIGNAL_REST_API_KEY
BREVO_API_KEY
BREVO_SENDER_EMAIL
BREVO_SENDER_NAME
NOTIFY_INTERNAL_SECRET
CRON_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_IDENTITY_SUCCESS_URL
STRIPE_IDENTITY_CANCEL_URL
AI_GATEWAY_API_KEY
AI_GATEWAY_BASE_URL
AI_DEFAULT_MODEL
AI_MATCH_MODEL
AI_SAFETY_MODEL
AI_VISION_MODEL
```

No exponer `SUPABASE_SERVICE_ROLE_KEY`, claves de Stripe, OneSignal, Brevo o IA con
prefijo `VITE_`.

## Tareas programadas

Crear en Coolify dos tareas:

```sh
wget -qO- --header="Authorization: Bearer $CRON_SECRET" http://127.0.0.1:3000/api/admin/hard-delete-users
```

Semanal, domingo a las 03:00 UTC: `0 3 * * 0`.

```sh
wget -qO- --header="Authorization: Bearer $CRON_SECRET" http://127.0.0.1:3000/api/verification/cleanup
```

Diaria a las 03:30 UTC: `30 3 * * *`.

## Dominio

Adjuntar `www.moonsharedliving.com` a la aplicación. Si también se adjunta el dominio
raíz, `CANONICAL_HOST` fuerza una redirección permanente al host canónico. Actualizar
en Supabase Auth el Site URL y las redirect URLs para el dominio definitivo.
