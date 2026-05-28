# Notificaciones — checklist de despliegue

## Variables Vercel (Production + Preview)

| Variable | Scope | Descripción |
|----------|-------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Inserts in-app + resolver emails |
| `VITE_SUPABASE_URL` | All | URL Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | All | Anon key |
| `VITE_ONESIGNAL_APP_ID` | All | App ID OneSignal (cliente) |
| `ONESIGNAL_APP_ID` | Server | Mismo ID para REST API |
| `ONESIGNAL_REST_API_KEY` | Server | REST API key OneSignal |
| `BREVO_API_KEY` | Server | API transaccional |
| `BREVO_SENDER_EMAIL` | Server | `hello@moonsharedliving.com` (remitente verificado) |
| `BREVO_SENDER_NAME` | Server | `: moon shared living` |
| `NOTIFY_INTERNAL_SECRET` | Server | Opcional — header `x-notify-secret` |
| `VITE_SITE_URL` | Server | `https://www.moonsharedliving.com` |

## Supabase

Aplicar migraciones pendientes:

```bash
supabase db push
# o aplicar manualmente:
# - 20260521700000_owner_groups_tenants.sql
# - 20260521800000_notifications.sql
```

## Smoke test manual

### 1. API rechaza anónimos

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST https://www.moonsharedliving.com/api/notify/event \
  -H "Content-Type: application/json" \
  -d '{"type":"test","profileIds":["x"],"title":"t","body":"b"}'
# Esperado: 401
```

### 2. Solicitud → propietario

1. Inquilino crea solicitud en piso publicado
2. Propietario: badge campana + fila in-app + email Brevo + push (si opt-in)

### 3. Cambio estado → inquilino

1. Propietario aprueba/rechaza en `/panel/solicitudes`
2. Inquilino recibe los 3 canales

### 4. Mensaje

1. Chat con pestaña cerrada en destinatario
2. Push + in-app; email solo si `email_messages = true`

### 5. Preferencias

1. Perfil → desactivar «Emails de mensajes»
2. Enviar mensaje → solo push + in-app

## Cambios de hardening incluidos

- `VITE_ONESIGNAL_APP_ID` en `index.html` y `notifications.ts`
- Eliminado `public/sw.js` legacy (PWA vía `vite-plugin-pwa`)
- Auto-prompt OneSignal desactivado (`autoPrompt: false`)
- Auth JWT obligatorio en `/api/notify/event`
