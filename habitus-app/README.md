# : moon shared living — web

Co-living en Barcelona y Madrid. La lógica de negocio vive en `@habitus/core` (monorepo).

## Variables

```bash
cp .env.example .env.local
```

| Variable | Uso |
|----------|-----|
| `VITE_SUPABASE_URL` | API Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave pública |

## Desarrollo

Desde la raíz del monorepo:

```bash
npm install
npm run dev:web
```

O en esta carpeta: `npm run dev` → `http://localhost:5173`

- Acceso: `/access`
- Demo: `DEMO_USERS.md` y `npm run seed:demo-users` (si el script está en package.json)

## Build

```bash
npm run build
```

## Arquitectura

Ver `../docs/ARCHITECTURE.md`. App móvil: `../habitus-mobile`.
