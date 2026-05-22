# : moon shared living

Monorepo de co-living (Barcelona y Madrid): web, mobile y core compartido.

## Estructura

| Carpeta | Descripción |
|---------|-------------|
| `habitus-app/` | App web (Vite + React) |
| `habitus-mobile/` | App móvil (Expo) |
| `packages/habitus-core/` | Lógica compartida, i18n, servicios Supabase |
| `docs/` | Documentación del producto |

## Inicio rápido

```bash
npm install
cp habitus-app/.env.example habitus-app/.env.local
npm run dev:web
```

Web en `http://localhost:5173`. Usuarios demo: ver `habitus-app/DEMO_USERS.md`.

## Supabase

Migraciones en `habitus-app/supabase/migrations/`. Aplicar en el SQL Editor del proyecto Supabase en orden cronológico.

## Scripts

```bash
npm run dev:web      # Vite dev server
npm run dev:mobile   # Expo
npm run typecheck:core
```
