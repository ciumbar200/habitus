# Auditoría de migraciones Supabase

Actualizado: 2026-06-18

## Estado del plan contratos/finanzas/grupos

Estas migraciones del plan están presentes en local, aplicadas en remoto y marcadas como aplicadas en el historial remoto:

- `20260618100000_moon_contratos_sprint1.sql`
- `20260618200000_contratos_rpc_functions.sql`
- `20260618210000_groups_rpc_functions.sql`
- `20260618224337_harden_contracts_groups_rls.sql`

Verificación adicional:

- RLS activo en `habitus_contratos_habitacion`
- RLS activo en `habitus_contratos_piso`
- RLS activo en `habitus_gastos_piso`
- RLS activo en `habitus_group_invites`
- RLS activo en `habitus_group_join_requests`
- RLS activo en `contrato_estado_log`
- `anon` no puede ejecutar las RPC sensibles nuevas de contratos/grupos/ingresos.
- `supabase db advisors --linked --type security --level warn` no reporta hallazgos sobre los objetos nuevos del plan.

## Divergencias antiguas detectadas

El proyecto remoto contiene migraciones antiguas sin archivo local:

- `20260530240000` a `20260530250000`
- `20260530300000` a `20260530390000`
- `20260530490000`
- `20260606194939`
- `20260617000344`
- `20260617000347`
- `20260617004043`
- `20260617172230`
- `20260617172250`
- `20260617172309`

El repositorio local contiene migraciones antiguas no marcadas como aplicadas en remoto:

- `20260606120000`
- `20260607191630`
- `20260616230000`
- `20260617000000`
- `20260617100000`

## Decisión

No se han aplicado ni reparado esas divergencias antiguas durante este bloque porque no pertenecen al plan de contratos/finanzas/grupos y podrían representar ramas previas, hotfixes remotos o migraciones sustituidas. Aplicarlas a ciegas tendría más riesgo que beneficio.

Para dejar el historial global perfecto haría falta una tarea separada de reconciliación: comparar cada migración divergente contra el esquema remoto actual, decidir si debe restaurarse en local, marcarse como aplicada, eliminarse o reemplazarse por una migración consolidada.
