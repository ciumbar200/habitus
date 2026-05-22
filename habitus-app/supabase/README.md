# Supabase — Habitus

Proyecto: **ana_leads** (`qectypyfbjlhabdmxigk`)  
URL: https://qectypyfbjlhabdmxigk.supabase.co

## Tablas

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Miembros (vinculados a `auth.users`) |
| `property_categories` | Filtros: All Homes, Shared Suites, etc. |
| `properties` | Espacios co-living |
| `property_amenities` | Amenities por propiedad |
| `property_images` | Galería de fotos |
| `member_tags` | Tags de estilo de vida |
| `property_bookmarks` | Propiedades guardadas |
| `member_bookmarks` | Roommates guardados |
| `applications` | Solicitudes de membresía |
| `conversations` | Hilos de chat |
| `conversation_participants` | Participantes |
| `messages` | Mensajes |
| `compatibility_scores` | % compatibilidad (propiedad o perfil) |

## Vista

- `properties_list` — listado público con categoría

## Datos semilla

- 5 categorías
- 6 propiedades (incl. Kensington, Shoreditch, Marquee Loft, etc.)
- 12 amenities
- 2 imágenes de galería

Los perfiles de roommates (`profiles`) se crean al registrarse vía Auth; el trigger `on_auth_user_created` inserta el perfil automáticamente.

## Variables de entorno (React)

```env
VITE_SUPABASE_URL=https://qectypyfbjlhabdmxigk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<tu publishable key del dashboard>
```

Obtén la clave en: [Supabase Dashboard](https://supabase.com/dashboard/project/qectypyfbjlhabdmxigk/settings/api)

## Migraciones aplicadas

1. `habitus_initial_schema`
2. `habitus_seed_data`
3. `habitus_fix_compatibility_rls`
4. `habitus_seed_showcase_members` — perfiles demo para Matches
