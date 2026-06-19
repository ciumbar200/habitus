# Certification Matrix - Moon / Habitus

Fecha: 2026-06-19

Este documento cruza superficies del producto con evidencia real de verificacion.
No considera un area "certificada" sin prueba ejecutada sobre esa superficie.

## Resumen Ejecutivo

- Certificado con evidencia fuerte: contratos, finanzas, grupos, RLS de objetos nuevos, auth hydration, rutas profundas del bloque principal, smoke completo de `e2e/agents` en chromium.
- Certificado parcialmente: admin, embajadores, acceso public/marketing, pages publicas, notificaciones, AI/verificacion.
- No certificado aun: cobertura completa de toda la app, multi-browser, accesibilidad formal, responsive sistematico, webhooks y serverless end-to-end.

## Matriz

| Superficie | Ruta / Servicio | Evidencia actual | Estado |
|---|---|---|---|
| Auth base | `/access`, `/auth/callback`, onboarding | `e2e/agents/access-ui.spec.ts`, fix en `AuthContext.tsx`, `build` OK | Parcialmente certificado |
| Perfil / identidad | `/profile`, `/profile/editar`, verification | codigo existe, varias paginas y APIs presentes | Pendiente de smoke completo |
| Inquilino core | `/descubrir`, `/matches`, `/messages`, `/grupos` | rutas en `App.tsx`, tests basicos y E2E de grupos | Parcialmente certificado |
| Grupos | `/grupos`, `/grupos/nuevo`, `/grupos/:id/invitar`, `/grupos/join/:token` | `contracts-ui.spec.ts`, `contracts-rls.spec.ts`, services de grupos/invites | Certificado para bloque nuevo |
| Contratos habitacion | `/panel/anfitriones/contratos*` | UI + RLS real + PDF + build | Certificado para bloque nuevo |
| Contratos piso | `/panel/propietarios/contratos*` | UI + RLS real + ingresos/gastos asociados + build | Certificado para bloque nuevo |
| Hub de contratos | `/panel/contratos` | alias nuevo + Playwright | Certificado para navegacion |
| Hub propietarios | `/panel/propietarios` | alias nuevo + Playwright | Certificado para navegacion |
| Ingresos / gastos | `/panel/propietarios/ingresos`, `/panel/propietarios/gastos/:pisoId` | `contracts-ui.spec.ts`, servicios `gastos.ts` | Parcialmente certificado |
| Public listings | `/`, `/alojamientos`, `/habitaciones/:ciudad/:barrio` | `public-smoke.spec.ts` (desktop + mobile), assets verificados en build | Parcialmente certificado |
| Public marketing | landing, host, owner, agency, docs, ayuda, blog | `public-smoke.spec.ts`, componentes y rutas existen | Parcialmente certificado |
| Admin | `/admin/*` | `admin-embajador-verify.spec.ts`, `/admin/habitaciones` ahora pasa en smoke | Parcialmente certificado; falta ampliar cobertura mas alla del recorrido actual |
| Embajadores | `/embajadores`, referidos | E2E de embajador OK | Parcialmente certificado |
| Notifications | `services/notifications.ts`, `/notifications` | existe codigo, no hay smoke de cola/push | Pendiente |
| AI / operator | `api/ai/run.ts`, `AdminAIPage`, `OperatorDashboardData` | existe codigo y UI; smoke de `/admin/ia` OK en Vite dev | Parcialmente certificado |
| Verification | `api/verification/*`, `VerificationPage`, admin verifications | existe codigo y UI; smoke de `/verificacion` y `/admin/verificaciones` OK, con API admin mockeada en el test | Parcialmente certificado |
| Stripe | `api/stripe/*` | existe infraestructura | Pendiente |
| Storage | `services/storage.ts`, uploads de imagenes | existe codigo | Pendiente |
| Supabase security | tablas y RPCs nuevas del bloque contratos/grupos/finanzas | auditoria RLS real pasada | Certificado para objetos nuevos |

## Evidencia Ejecutada Recientemente

- `npm run build` en `habitus-app`
- `npx playwright test --project=chromium`
- `npx playwright test e2e/agents/contracts-ui.spec.ts --project=chromium`
- `npx playwright test e2e/agents/contracts-rls.spec.ts --project=chromium`
- `supabase db advisors --linked --type security --level warn --output json`
- `npm run lint` en `habitus-app` pasa con 90 warnings y 0 errores
- `npx playwright test e2e/agents/admin-embajador-verify.spec.ts --project=chromium` pasa, incluyendo `/admin/habitaciones`
- `npx playwright test e2e/agents/public-smoke.spec.ts --project=chromium` pasa en desktop y mobile
- `npx playwright test e2e/agents --project=chromium` pasa, `12 passed`

## Huecos Reales que Siguen Abiertos

1. No existe aun una pasada multi-browser completa.
2. No hay auditoria de accesibilidad formal.
3. No hay smoke real de notificaciones, Stripe, verification y AI.
4. Hay worktree previo sucio que no pertenece a este bloque y no se ha limpiado.
5. `eslint` ya no bloquea por errores, pero siguen 90 warnings repartidos en:
   - varios `react-hooks/set-state-in-effect`
   - dependencias de hooks
   - memorization warnings de React Compiler

## Siguiente Fase Recomendada

1. Completar el recorrido admin total con más casos y estados.
2. Añadir smoke de rutas publicas y auth en mobile viewport.
3. Ejecutar auditoria a11y y responsive.
4. Dejar un reporte final de certificacion con lo que queda realmente no cubierto.
