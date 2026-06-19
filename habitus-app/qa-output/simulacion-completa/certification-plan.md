# Plan de Certificacion - Moon / Habitus

Fecha: 2026-06-19

## Objetivo

Verificar la app entera con evidencia ejecutada, no con inspeccion visual parcial, y dejar cada superficie en uno de estos estados:

- Certificada
- Certificada con salvedades
- Pendiente de verificacion
- Bloqueada por deuda tecnica

## Estado de partida

- `npm run build` pasa
- `npm run lint` pasa sin errores; quedan 90 warnings
- `npx playwright test e2e/agents --project=chromium` pasa con 12/12
- `npx playwright test e2e/agents/verification-ai-smoke.spec.ts --project=chromium` pasa con 2/2
- `npx playwright test e2e/agents --project=chromium` pasa con 14/14
- `npx playwright test e2e/agents/contracts-ui.spec.ts --project=chromium` pasa
- `npx playwright test e2e/agents/contracts-rls.spec.ts --project=chromium` pasa
- `admin/habitaciones` sigue siendo el hueco funcional mas visible

## Fase 1. Cierre de bloqueadores

1. Mantener los warnings como deuda separada, salvo que escondan riesgo funcional.
2. Revalidar `npm run build` tras cada lote de correcciones.

Exit criteria:

- `npm run build` verde
- `npm run lint` sin errores

## Fase 2. Cobertura funcional por superficie

1. Admin completo, incluyendo `/admin/habitaciones`.
2. Auth y onboarding completos.
3. Inquilino core: descubrir, matches, mensajes, grupos, perfil.
4. Propietario / anfitrión: panel, contratos, ingresos, gastos.
5. Public marketing y listings.
6. Verification, AI, notifications y Stripe si forman parte del producto certificado.

Exit criteria:

- Cada superficie con al menos un smoke real
- Cada flujo crítico con al menos un recorrido feliz y un recorrido de error

## Fase 3. Validacion de UI renderizada

1. Desktop first viewport.
2. Mobile viewport.
3. Estados vacios, cargando, error y datos reales.
4. Interacciones que cambian estado visible.

Exit criteria:

- No overlays de framework
- No clipping ni solapes visibles
- Los CTAs principales responden sin error de consola relevante

## Fase 4. Seguridad y backend

1. RLS de objetos nuevos.
2. RPCs sensibles.
3. Webhooks y serverless si aplican.
4. Permisos cruzados por rol.

Exit criteria:

- Evidencia de DB o API para cada flujo sensible
- Ninguna operacion critica expone datos fuera de rol

## Fase 5. Cierre de certificacion

1. Ejecutar una pasada final de smoke en entorno de despliegue.
2. Consolidar hallazgos en matriz de certificacion.
3. Marcar como certificados solo los bloques con evidencia repetible.

Exit criteria:

- Matriz completa y actualizada
- Handoff final sin huecos ocultos
- Lista explicita de lo que no se certifica aun

## Comandos base

```bash
npm run build
npm run lint
npx playwright test --project=chromium
npx playwright test e2e/agents --project=chromium
npx playwright test e2e/agents/contracts-ui.spec.ts --project=chromium
npx playwright test e2e/agents/contracts-rls.spec.ts --project=chromium
```
