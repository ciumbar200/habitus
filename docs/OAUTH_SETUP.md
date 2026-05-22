# OAuth (Google y Facebook) — Habitus

## Supabase Dashboard

1. **Authentication → Providers**: activa **Google** y **Facebook** con Client ID / Secret de cada consola de desarrollador.
2. **Authentication → URL Configuration → Redirect URLs** (añade todas las que uses):

| Entorno | URL |
|---------|-----|
| Web local | `http://localhost:5173/auth/callback` |
| Web producción | `https://TU_DOMINIO/auth/callback` |
| Expo dev | `exp://127.0.0.1:8081/--/auth/callback` (puede variar; ver log de `makeRedirectUri`) |
| App nativa | `habitus://auth/callback` |

3. Site URL en desarrollo: `http://localhost:5173`

## Google Cloud Console

- Tipo: aplicación web + (opcional) iOS/Android si publicas stores.
- URI de redirección autorizada: la URL de callback de Supabase (formato `https://<project-ref>.supabase.co/auth/v1/callback`).

## Meta (Facebook)

- Producto **Facebook Login**.
- Valid OAuth Redirect URIs: misma URL de callback de Supabase.
- Dominios de la app según entorno.

## Flujo en la app

1. **Registro**: el usuario elige rol → OAuth guarda rol en `sessionStorage` (web) o AsyncStorage (móvil).
2. Tras el redirect: `ensureProfileForAuthUser` crea/actualiza `habitus_profiles`.
3. Redirección: `/completar-rol` si falta rol → `/onboarding` si falta nombre/edad → home por rol.

## Variables de entorno

Sin claves OAuth en el cliente: solo `VITE_SUPABASE_*` (web) y `EXPO_PUBLIC_SUPABASE_*` (móvil). Los secretos viven en Supabase.
