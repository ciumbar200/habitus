# Habitus Mobile

App Expo que comparte lógica con la web vía `@habitus/core`.

## Configuración

Copia credenciales en `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

## Arranque

Desde la raíz del monorepo:

```bash
cd /Users/valentin/Downloads/aaaaa
npm install
npm run dev:mobile
```

Desde esta carpeta (`habitus-mobile`):

```bash
npm run dev
```

No pegues comentarios en la misma línea (`# ...`); npm los interpreta como argumentos y rompe Expo/Vite.

## Pantallas (MVP)

- Login / registro
- Descubrir espacios
- Compañeros (matches)
- Mensajes
- Perfil
- Panel (anfitrión / propietario / agencia)

Usuarios demo: ver `../habitus-app/DEMO_USERS.md`.
