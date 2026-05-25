# OAuth (Google y Facebook) — Habitus

## Supabase Dashboard

1. **Authentication → Providers**: activa **Google** y **Facebook** con Client ID / Secret de cada consola de desarrollador.
2. **Authentication → URL Configuration → Redirect URLs** (añade todas las que uses):

| Entorno | URL |
|---------|-----|
| Web local | `http://localhost:5173/auth/callback` |
| Web producción | `https://www.moonsharedliving.com/auth/callback` |
| Expo dev | `exp://127.0.0.1:8081/--/auth/callback` (puede variar; ver log de `makeRedirectUri`) |
| App nativa | `habitus://auth/callback` |

3. **Site URL** (producción): `https://www.moonsharedliving.com`

## Google Cloud Console

- Tipo: aplicación web + (opcional) iOS/Android si publicas stores.
- URI de redirección autorizada: la URL de callback de Supabase (formato `https://<project-ref>.supabase.co/auth/v1/callback`).

## Meta (Facebook)

- Producto **Facebook Login**.
- Valid OAuth Redirect URIs: misma URL de callback de Supabase.
- Dominios de la app según entorno.

## Flujo en la app

1. **Registro**: el usuario elige rol → OAuth guarda rol en `localStorage` (web) o AsyncStorage (móvil).
2. Tras el redirect: `/auth/callback` intercambia el `code` PKCE **una sola vez** y llama a `ensureProfileForAuthUser`.
3. Redirección: `/completar-rol` si falta rol → `/onboarding` si falta nombre/edad → home por rol.

## Variables de entorno

Sin claves OAuth en el cliente: solo `VITE_SUPABASE_*` (web) y `EXPO_PUBLIC_SUPABASE_*` (móvil). Los secretos viven en Supabase.

**Web (Vercel):** define también `VITE_SITE_URL=https://www.moonsharedliving.com` para que el `redirectTo` de OAuth siempre use el mismo origen que Supabase (evita error *PKCE code verifier not found* si el usuario entra por `moonsharedliving.com` sin `www`).

## PKCE / “code verifier not found”

Si ves ese error:

1. Confirma que **Redirect URLs** incluye exactamente `https://www.moonsharedliving.com/auth/callback`.
2. En Vercel, añade `VITE_SITE_URL` y el redirect apex → www (ya en `vercel.json`).
3. Inicia OAuth y completa el login **en la misma pestaña** (no abras el link de Google en otra ventana).
4. No borres datos del sitio entre “Continuar con Google” y el callback.
