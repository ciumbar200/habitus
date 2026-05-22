# Plan entrega app Habitus — vídeo demo 100%

**Estado:** listo para grabación live (build OK).

## Concepto (vs Moon Shared Living)

Habitus ya comunica lo que Moon promete y faltaba en nuestra app:

| Moon | Habitus |
|------|---------|
| Elegir con quién vives | Matching + perfil público completo (`/miembro/:slug`) |
| Grupos para alquilar juntos | `/grupos`, reparto justo, desbloqueo de pisos privados |
| Compatibilidad con quien vive en el piso | Score con anfitrión; aviso claro si solo hay propietario |
| Verificación identidad | Mock Veriff en perfil inquilino/anfitrión |
| Pisos privados / curados | Publicación `público` vs `privado` + panel desbloqueo |

## SQL — ejecutar en Supabase (orden)

1. `20260521230000_fix_habitus_chat_rls.sql`
2. `20260521240000_profile_search_prefs_storage.sql`
3. `20260521250000_demo_ready_consolidated.sql`
4. **`20260521260000_groups_identity_listing_visibility.sql`** ← grupos, identidad, privado/público

## Guión live recomendado (8–10 min)

### 1. Landing (30 s)
- Mensaje «alquilar hogar, no solo habitación»
- Bloque grupos + audiencias (estudiantes, expats, separados)

### 2. Inquilino `demo-inquilino@e2e.habitus.local`
1. Perfil → **Verificación identidad (demo)**
2. **Compañeros** → ojo → **perfil completo** → chat
3. **Descubrir** → espacio → **anfitrión visible** → ojo al perfil
4. Espacio **sin anfitrión** → mensaje compatibilidad nula / formar grupo
5. **Grupos** → crear → reparto justo → miembros con ojo a perfil

### 3. Propietario `demo-propietario@e2e.habitus.local`
1. Publicar espacio → **Público vs Privado**
2. Panel espacios → **Desbloquear grupo** en piso privado

### 4. Anfitrión `demo-anfitrion@e2e.habitus.local`
1. Perfil con verificación
2. Ver espacio donde aparece como anfitrión

### 5. Admin `demo-admin@e2e.habitus.local`
1. `/admin` → usuarios / espacios / reportes

Contraseña: `HabitusDemo2026!`

## Comandos

```bash
cd habitus-app && npm run dev
npm run build   # verificado ✓
```
