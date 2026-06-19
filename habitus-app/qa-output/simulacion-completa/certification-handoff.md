# Handoff de Certificacion - Moon / Habitus

Fecha: 2026-06-19

## Estado actual

El bloque de contratos, finanzas, grupos y RLS ya esta validado con evidencia fuerte:

- `npm run build` OK
- `npx playwright test e2e/agents --project=chromium` OK, `12 passed`
- `npx playwright test --project=chromium` OK, `10 passed`
- `npx playwright test e2e/agents/contracts-ui.spec.ts --project=chromium` OK, `2 passed`
- `npx playwright test e2e/agents/admin-embajador-verify.spec.ts --project=chromium` OK, `2 passed`
- `npx playwright test e2e/agents/public-smoke.spec.ts --project=chromium` OK, `2 passed` en desktop y mobile
- `npx playwright test e2e/agents/verification-ai-smoke.spec.ts --project=chromium` OK, `2 passed`
- `npx playwright test e2e/agents --project=chromium` OK, `14 passed`
- Auditoria RLS real pasada para contratos, gastos, grupos e ingresos
- Rutas criticas y deep links corregidos para:
  - `/panel/propietarios`
  - `/panel/contratos`
  - `/panel/grupos`
  - `/panel/propietarios/contratos`
  - `/panel/propietarios/ingresos`
  - `/panel/anfitriones/contratos`

Commit importante de este bloque:

- `1166a3d feat(contracts): add panel aliases and QA coverage`

## Lo que ya esta certificado

### Frontend / rutas

- Login y hydration de auth
- Rutas profundas autenticadas para propietario e inquilino
- Hub de propietarios
- Hub de contratos
- Pantalla de grupos con CTA visible
- Pantallas de contratos de habitacion y de piso
- Pantalla de ingresos
- Admin completo del bloque actual, incluyendo `/admin/habitaciones`
- Smoke público y auth en desktop + mobile para landing, listings, barrio, blog, ayuda, access y recuperación
- Batería completa `e2e/agents` en chromium
- OneSignal bootstrap movido fuera de `index.html` para evitar fricción con Vite/Vercel dev
- Smoke de verificación/IA cubre `/verificacion`, `/admin/verificaciones` y `/admin/ia`

### Backend / Supabase

- RLS aplicado y verificado en objetos nuevos del plan
- RPCs sensibles endurecidas
- Privilegios revisados para las funciones del bloque nuevo

### QA

- Playwright UI para rutas del bloque
- Playwright RLS real contra Supabase
- Build del app

## Lo que no esta certificado como "todo perfecto"

No hay evidencia suficiente para afirmar que toda la app este certificada. Faltan, como minimo:

- cobertura E2E de todos los flujos admin
- cobertura multi-navegador
- accesibilidad formal
- responsive serio en varios breakpoints
- verificacion real de notificaciones / webhooks / endpoints serverless
- verificacion de flujos AI y verificacion si se consideran criticos
- lint global del repositorio: pasa con 90 warnings, sin errores
- auditoria completa del worktree sucio heredado
- falta ampliar el smoke público con más estados y datos reales, aunque ya hay una base funcional

## Hallazgos abiertos conocidos

- Hay muchos cambios previos sin relacion con este bloque en el worktree.
  - No revertirlos por defecto.
  - Tratar cualquier limpieza como tarea separada.

## Inventario de superficies a certificar

### Rutas publicas

- Landing, listings, blog, recursos, legal, ayuda, calculadora
- Evidencia actual: `public-smoke.spec.ts` en desktop y mobile, build pasa
- Falta: recorrido visual más amplio con datos reales y estados vacíos/llenos

### Auth / onboarding

- `/access`, `/auth/callback`, `/onboarding`, `/completar-rol`, quiz de compatibilidad
- Evidencia actual: specs básicos + smoke de `/access` y `/olvide-contrasena`
- Falta: smoke completo con signup, recovery y OAuth si aplica

### Inquilino

- `/descubrir`, `/matches`, `/grupos`, `/grupos/nuevo`, `/messages`, `/profile`
- Evidencia actual: UI y tests basicos
- Falta: recorrido completo con datos reales y estados vacios/llenos

### Propietario / anfitrion / agencia

- `/panel`, `/panel/espacios`, `/panel/solicitudes`, `/panel/propietarios`, contratos, ingresos, gastos
- Evidencia actual: rutas y Playwright UI del bloque
- Falta: combinatoria de estados por rol y permisos cruzados

### Admin

- `/admin/*`
- Evidencia actual: suite `admin-embajador-verify.spec.ts` pasa incluyendo `/admin/habitaciones`
- Falta: ampliar cobertura de estados y rutas secundarias admin
- Falta: multi-browser, accesibilidad formal, verification, AI, notifications y Stripe
- Falta: multi-browser, accesibilidad formal, notifications y Stripe
- El runtime local con `vercel dev` sigue siendo inestable para este workspace; el smoke de verificación/IA se valida sobre Vite con API admin mockeada en el test

### API / Supabase

- contratos, gastos, grupos, ingresos, verificaciones, stripe, admin
- Evidencia actual: RLS auditada en el bloque nuevo
- Falta: inventario completo de endpoints serverless y webhooks activos

## Orden recomendado para seguir

1. Hacer inventario completo de rutas, endpoints y roles.
2. Completar suite E2E para admin, auth y recovery.
3. Ejecutar responsive y accesibilidad más formales.
4. Ejecutar smoke real contra entorno de despliegue.
5. Reparar o aislar los warnings de `eslint` que hoy siguen abiertos.
6. Documentar cualquier hueco restante con evidencia, no con suposiciones.

## Comandos utiles para continuar

```bash
npm run build
npx playwright test --project=chromium
npx playwright test e2e/agents/admin-embajador-verify.spec.ts --project=chromium
npx playwright test e2e/agents/contracts-ui.spec.ts --project=chromium
npx playwright test e2e/agents/contracts-rls.spec.ts --project=chromium
supabase db advisors --linked --type security --level warn --output json
```

## Regla de continuidad

Si otro modelo retoma esto, que empiece por:

1. Leer este handoff.
2. Mirar `habitus-app/qa-output/simulacion-completa/lista-implementacion.md`.
3. Mirar `habitus-app/qa-output/simulacion-completa/simulacion-report.md`.
4. Mirar la suite `habitus-app/e2e/agents/*`.
5. Corregir primero los hallazgos con evidencia, no las listas de deseos.
