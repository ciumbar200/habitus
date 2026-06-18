# Handoff de Certificacion - Moon / Habitus

Fecha: 2026-06-19

## Estado actual

El bloque de contratos, finanzas, grupos y RLS ya esta validado con evidencia fuerte:

- `npm run build` OK
- `npx playwright test --project=chromium` OK, `10 passed`
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
- auditoria completa del worktree sucio heredado
- lint global del repositorio: falla con errores reales existentes en varias superficies

## Hallazgos abiertos conocidos

- En `habitus-app/e2e/agents/admin-embajador-verify.spec.ts` existe un TODO comentado:
  - `/admin/habitaciones` todavia falla por RPC 404
- Hay muchos cambios previos sin relacion con este bloque en el worktree.
  - No revertirlos por defecto.
  - Tratar cualquier limpieza como tarea separada.

## Inventario de superficies a certificar

### Rutas publicas

- Landing, listings, blog, recursos, legal, ayuda, calculadora
- Evidencia actual: existe codigo y build pasa
- Falta: recorrido visual y responsive con datos reales

### Auth / onboarding

- `/access`, `/auth/callback`, `/onboarding`, `/completar-rol`, quiz de compatibilidad
- Evidencia actual: specs basicos y fix de hydration
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
- Evidencia actual: existe suite parcial y screenshots
- Falta: resolver `/admin/habitaciones` y completar recorrido total

### API / Supabase

- contratos, gastos, grupos, ingresos, verificaciones, stripe, admin
- Evidencia actual: RLS auditada en el bloque nuevo
- Falta: inventario completo de endpoints serverless y webhooks activos

## Orden recomendado para seguir

1. Hacer inventario completo de rutas, endpoints y roles.
2. Cerrar el TODO de `/admin/habitaciones`.
3. Completar suite E2E para admin, auth y recovery.
4. Ejecutar responsive y accesibilidad.
5. Ejecutar smoke real contra entorno de despliegue.
6. Reparar o aislar los errores de `eslint` que hoy bloquean la certificacion total.
7. Documentar cualquier hueco restante con evidencia, no con suposiciones.

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
