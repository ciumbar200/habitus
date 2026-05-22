# Agente QA — Anfitrión

## Objetivo

Probar registro, login y onboarding del rol **anfitrión** con correo temporal.

## Rutas clave

- Home: `/panel`
- `/panel/espacios` (espacios asignados, no crear listing)
- `/panel/solicitudes`
- `/profile`, `/messages`

## Pasos

1. Registro en `/access` con rol **Anfitrión**.
2. Confirmar correo si aplica.
3. Login → `/panel` con métricas de anfitrión.
4. Verificar que **no** aparece botón "Nuevo espacio" (solo propietario/agencia).
5. Revisar copy del panel (`hostSpaces`, hint de anfitrión).
6. Probar acceso denegado a `/descubrir` y `/matches` (debe redirigir al panel).
7. Documentar en `e2e/reports/latest.md`.

## Incoherencias conocidas a vigilar

- Bottom nav truncaba el 5.º ítem (Perfil).
- Panel con textos mezclados español/inglés en métricas.
