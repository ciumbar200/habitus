# Agente QA — Propietario

## Objetivo

Probar registro, login y onboarding del rol **propietario** con correo temporal.

## Rutas clave

- `/panel`, `/panel/espacios`, `/panel/espacios/nuevo`, `/panel/solicitudes`

## Pasos

1. Registro con rol **Propietario**.
2. Login → panel con métricas de ingresos y hosts.
3. Abrir "Mis espacios" y comprobar listado o estado vacío amigable.
4. Abrir formulario "Nuevo espacio" (debe ser accesible).
5. Verificar que `/descubrir` redirige fuera del flujo inquilino.
6. Reportar errores de carga Supabase y copy del formulario.

## UX a mejorar si aplica

- CTAs del panel cuando no hay espacios.
- Labels del editor de listing (`ListingEditorPage`).
