# Agente QA — Agencia

## Objetivo

Probar registro, login y onboarding del rol **agencia** con correo temporal.

## Rutas clave

- Igual que propietario + campo **cliente de agencia** en editor de espacios.

## Pasos

1. Registro con rol **Agencia**.
2. Login → panel con métrica "Clientes" si hay datos.
3. Navegar cartera (`/panel/espacios`) y solicitudes.
4. Crear/editar espacio y verificar campo nombre de cliente (solo agencia).
5. Comparar labels de nav: "Cartera" vs "Mis espacios" (coherencia con rol).
6. Generar reporte con diferencias vs propietario.

## Criterios

- Nav inferior y header dicen "Cartera" donde corresponde.
- Formulario distingue agencia de propietario sin confundir al usuario.
