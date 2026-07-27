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
CRON_SECRET
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

## Tareas programadas en la VPS

Vercel no ejecuta tareas programadas. La VPS tiene dos timers de systemd que
localizan el contenedor activo por su etiqueta de Coolify y llaman al API usando
`CRON_SECRET` desde el propio entorno del contenedor:

```text
moonsharedliving-hard-delete.timer       domingo 03:00 UTC
moonsharedliving-verification-cleanup.timer  diario 03:30 UTC
```

Consultar su estado con:

```sh
systemctl list-timers 'moonsharedliving-*'
journalctl -u moonsharedliving-hard-delete.service
journalctl -u moonsharedliving-verification-cleanup.service
```

## Dominio

El frontend estático se sirve desde Vercel en `moonsharedliving.com` y
`www.moonsharedliving.com`. Vercel reescribe `/api/*` hacia
`https://api.moonsharedliving.com/api/*`.

La API se ejecuta en Coolify. Como el host usa Caddy fuera de Coolify, un Nginx local
escucha solo en `127.0.0.1:3300`, resuelve el alias Docker
`moonsharedliving-api` y conecta Caddy con el contenedor sin publicar un puerto HTTP.
La configuración está en:

```text
/etc/moonsharedliving-api-proxy/nginx.conf
/etc/caddy/conf.d/moonsharedliving-api.caddy
```

Las fuentes reproducibles del puente, Caddy y los timers están en `ops/vps/`.

Actualizar en Supabase Auth el Site URL y las redirect URLs para el dominio definitivo.
