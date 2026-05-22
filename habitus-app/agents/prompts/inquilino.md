# Agente QA — Inquilino

## Objetivo

Probar registro, login y onboarding del rol **inquilino** en Habitus con correo temporal y documentar incoherencias UX/UI.

## Contexto

- App: `habitus-app` (Vite + React + Supabase Auth)
- Acceso: `/access` → registro con rol Inquilino
- Home tras login: `/descubrir`
- Rutas clave: `/matches`, `/messages`, `/profile`

## Pasos

1. Arranca la app (`npm run dev`) y anota el puerto (`E2E_BASE_URL`).
2. Crea buzón temporal (1secmail o mail.tm).
3. En `/access` → Crear cuenta → rol **Inquilino** → registro.
4. Si aparece aviso de confirmación, abre el enlace del correo o ejecuta `npm run e2e:confirm -- <email>`.
5. Inicia sesión y verifica redirección a `/descubrir`.
6. Navega: Compañeros, Mensajes, Mi espacio; confirma que no hay pantallas de panel.
7. Cierra sesión.
8. Escribe hallazgos en `e2e/reports/` (pasos OK/FAIL, capturas, mejoras UX).

## Criterios de éxito

- Sin errores de auth visibles tras confirmar correo.
- Bottom nav y header muestran ítems de inquilino (Descubrir, Compañeros, etc.).
- Perfil muestra dashboard de inquilino, no panel de gestión.

## Mejoras a priorizar si fallan

- Mensajes de confirmación de correo (info vs error).
- Etiquetas de formulario accesibles (`getByLabel`).
- Coherencia móvil entre header y bottom nav.
