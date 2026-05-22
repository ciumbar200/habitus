# Pantallas Stitch — Habitus (Moo Co-Living)

Proyecto Stitch: `projects/6998487754438117353`

## En diseño (exportadas localmente)

| Pantalla | Archivo HTML | Estado en app |
|----------|--------------|---------------|
| Descubrir Espacios | `stitch-discover.html` | ✅ `DiscoverPage` |
| Detalle espacio | `stitch-detail.html` | ✅ `PropertyDetailPage` |
| Compañeros | `stitch-roommates.html` | ✅ `MatchesPage` |
| Mi espacio / perfil | `stitch-profile.html` | ✅ `ProfilePage` |
| Acceso (login) | `stitch-access.html` | ✅ `AccessPage` (Google, Facebook, email) |

## Nuevas en producto (no en Stitch original)

| Pantalla | Ruta / móvil | Notas |
|----------|--------------|-------|
| Landing pública | `/` | Hero “Vive digno / seguro / acompañado” |
| Cómo funciona | `/como-funciona` | Pilares y confianza |
| Onboarding | `/onboarding` | Nombre completo + fecha nacimiento (edad) |
| Completar rol | `/completar-rol` | Si falta `account_role` |
| Panel gestión | `/panel/*` | Anfitrión / propietario / agencia |
| Mensajes | `/messages` | Chat integrado |
| Cuestionario compatibilidad | `/cuestionario-compatibilidad` | ✅ Tras onboarding (inquilino/anfitrión) |
| Comunidad / eventos | `/comunidad` | ✅ `CommunityPage` |
| Olvidé contraseña | `/olvide-contrasena` | ✅ `ForgotPasswordPage` |
| Panel convivencia | `/panel/convivencia` | ✅ `PanelConvivenciaPage` (anfitrión) |
| Editar perfil | `/profile/editar` | ✅ `ProfileEditPage` |

## Reglas de implementación

- **OAuth** Google y Facebook vía Supabase — ver `docs/OAUTH_SETUP.md`.
- Copy alineado con co-living accesible (Barcelona/Madrid), no “membresía premium corporativa”.
- Onboarding obligatorio: `birth_date` + `onboarding_completed_at` en Supabase.
