# Habitus — arquitectura

Monorepo con **una base de datos Supabase** y **lógica compartida** para web y móvil.

## Paquetes

| Ruta | Rol |
|------|-----|
| `packages/habitus-core` | Tipos, i18n, servicios Supabase, navegación por rol. Inicializar con `initHabitus(client)`. |
| `habitus-app` | Web (React + Vite + Tailwind). Importa `@habitus/core`. |
| `habitus-mobile` | App (Expo + React Navigation). Importa `@habitus/core`. |

## Flujo de datos

1. Cada app crea el cliente Supabase (web: `VITE_*`, móvil: `EXPO_PUBLIC_*` + AsyncStorage).
2. Llama `initHabitus(supabase, { configured: true })` al arrancar.
3. Pantallas usan funciones de `@habitus/core` (`fetchProperties`, `fetchConversations`, etc.).

## Scripts (desde la raíz)

```bash
npm install
npm run dev:web      # habitus-app
npm run dev:mobile   # habitus-mobile (Expo)
npm run typecheck:core
```

## Demo (beta)

Usuarios `demo-*@e2e.habitus.local` — ver `habitus-app/DEMO_USERS.md`. Contraseña común documentada allí.

## Supabase

Proyecto remoto configurado en `.env.local` (web) y `.env` (móvil). Migraciones y seeds viven en el flujo de `habitus-app` cuando existan scripts `seed:demo-users`.

## Flujo de acceso (web y móvil)

1. Login/registro (email u OAuth Google/Facebook).
2. Completar rol si falta (`/completar-rol`).
3. Onboarding: nombre + fecha de nacimiento (`/onboarding`).
4. Cuestionario de compatibilidad para inquilino/anfitrión (`/cuestionario-compatibilidad`).
5. Home por rol (`/descubrir`, `/panel`, etc.).

Recuperación de contraseña: `/olvide-contrasena` (web). OAuth: `docs/OAUTH_SETUP.md`.

## Móvil (paridad)

- **Panel**: stack con espacios (crear/editar), solicitudes y espacios asignados (anfitrión).
- **Comunidad**: tab con eventos `habitus_community_events`.
- **Perfil**: edición de bio y foto.
- **Recordarme**: guarda el email 30 días (AsyncStorage / localStorage).
- **iOS**: `npm run ios` en `habitus-mobile` detecta simulador y limpia `.expo/devices.json`.
