# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

Monorepo for **Habitus**, a co-living platform in Barcelona and Madrid. Three npm workspaces:

- `packages/habitus-core` — Shared types, Supabase services, i18n, role-based navigation config. Entry point: `src/index.ts`. Initialize with `initHabitus(supabase)`.
- `habitus-app` — Web app (React + Vite + Tailwind v4, React Router v7). Imports `@habitus/core` via workspace alias.
- `habitus-mobile` — Mobile app (Expo ~54, React Native 0.81, React Navigation v7). Shares core via Metro `watchFolders`.

## Development

```bash
# Install all dependencies (from root)
npm install

# Web dev (http://localhost:5173)
npm run dev:web

# Mobile dev (Expo dev server)
npm run dev:mobile

# Typecheck core package
npm run typecheck:core

# Web build
npm run build -w habitus-app
```

## Environment Variables

Web (`.env.local` in `habitus-app`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Mobile (`.env` in `habitus-mobile`):
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

See `.env.example` files. Demo users in `habitus-app/DEMO_USERS.md` (password: `HabitusDemo2026!`).

## Architecture

**Data flow:** Each app creates its own Supabase client (web: standard, mobile: AsyncStorage adapter), then calls `initHabitus(client)`. All business logic lives in `@habitus/core` services.

**Role-based access:** Five account roles (`inquilino`, `anfitrion`, `propietario`, `agencia`, `admin`). Navigation config in `core/src/config/roleNavigation.ts` and `mobileNavigation.ts`. `homePathForRole()` / `homeScreenForRole()` determine entry points.

**Auth flow:** Login → `/completar-rol` (if missing) → `/onboarding` → `/cuestionario-compatibilidad` (for inquilino/anfitrión) → role-specific home.

**Mobile specifics:** `npm run ios` cleans unavailable simulators via `.expo/devices.json`. Don't put inline comments (`# ...`) in `.env` files — npm interprets them as arguments.

## Supabase

Migrations in `habitus-app/supabase/migrations`. Remote project configured in env files. Core services use typed `Database` from `types/database.ts`.

## Key Services (@habitus/core/src/services)

- `auth.ts` — OAuth, password reset, profile creation
- `profile.ts` — CRUD, onboarding, identity verification
- `properties.ts` — Listings, filters, search
- `applications.ts` — Property applications
- `messages.ts` — Conversations
- `members.ts` — Public profiles, matching
- `compatibility.ts` — Match scoring
- `admin.ts` — Admin operations
