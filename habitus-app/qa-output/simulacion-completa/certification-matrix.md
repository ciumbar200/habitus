# Certification Matrix - Moon / Habitus

Fecha: 2026-06-19

Este documento cruza superficies del producto con evidencia real de verificacion.
No considera un area "certificada" sin prueba ejecutada sobre esa superficie.

## Resumen Ejecutivo

- Certificado con evidencia fuerte: contratos, finanzas, grupos, RLS de objetos nuevos, auth hydration, rutas profundas del bloque principal.
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
| Public listings | `/`, `/alojamientos`, `/habitaciones/:ciudad/:barrio` | rutas visibles, assets verificados en build | Pendiente de recorrido visual completo |
| Public marketing | landing, host, owner, agency, docs, ayuda, blog | componentes y rutas existen | Pendiente de responsive + accesibilidad |
| Admin | `/admin/*` | `admin-embajador-verify.spec.ts` | Parcialmente certificado; hay TODO en `/admin/habitaciones` |
| Embajadores | `/embajadores`, referidos | E2E de embajador OK | Parcialmente certificado |
| Notifications | `services/notifications.ts`, `/notifications` | existe codigo, no hay smoke de cola/push | Pendiente |
| AI / operator | `api/ai/run.ts`, `AdminAIPage`, `OperatorDashboardData` | existe codigo y UI, sin certificacion funcional completa | Pendiente |
| Verification | `api/verification/*`, `VerificationPage`, admin verifications | existe codigo y UI | Pendiente |
| Stripe | `api/stripe/*` | existe infraestructura | Pendiente |
| Storage | `services/storage.ts`, uploads de imagenes | existe codigo | Pendiente |
| Supabase security | tablas y RPCs nuevas del bloque contratos/grupos/finanzas | auditoria RLS real pasada | Certificado para objetos nuevos |

## Evidencia Ejecutada Recientemente

- `npm run build` en `habitus-app`
- `npx playwright test --project=chromium`
- `npx playwright test e2e/agents/contracts-ui.spec.ts --project=chromium`
- `npx playwright test e2e/agents/contracts-rls.spec.ts --project=chromium`
- `supabase db advisors --linked --type security --level warn --output json`
- `npm run lint` en `habitus-app` falla con 15 errores y 90 warnings

## Huecos Reales que Siguen Abiertos

1. `/admin/habitaciones` sigue marcado como TODO en la suite admin.
2. No existe aun una pasada multi-browser completa.
3. No hay auditoria de accesibilidad formal.
4. No hay smoke real de notificaciones, Stripe, verification y AI.
5. Hay worktree previo sucio que no pertenece a este bloque y no se ha limpiado.
6. `eslint` no pasa en el repositorio actual. Los errores mas claros estan en:
   - `LeadMagnetPage.tsx` (`no-empty`)
   - `BarrioPage.tsx` (`usePageMeta` condicional)
   - varios componentes/paginas con `any` y hooks React no conformes

## Siguiente Fase Recomendada

1. Cerrar `/admin/habitaciones`.
2. Completar el recorrido admin total.
3. Añadir smoke de rutas publicas y auth en mobile viewport.
4. Ejecutar auditoria a11y y responsive.
5. Dejar un reporte final de certificacion con lo que queda realmente no cubierto.
