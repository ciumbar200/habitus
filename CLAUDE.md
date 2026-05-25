# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

Monorepo for **: moon shared living** (branded from Habitus), a co-living platform in Barcelona and Madrid. Three npm workspaces:

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

# Preview production build locally
npm run preview -w habitus-app

# Lint web app
npm run lint -w habitus-app
```

**iOS Simulator:** `npm run ios -w habitus-mobile` automatically selects the first available iPhone simulator and cleans unavailable devices.

## Environment Variables

**IMPORTANT:** Do NOT use inline comments (`# ...`) in `.env` files — npm workspaces interpret them as arguments.

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

**Mobile specifics:** iOS script auto-selects first available simulator via `scripts/open-ios.mjs`.

## Supabase

Migrations in `habitus-app/supabase/migrations`. Remote project configured in env files. Core services use typed `Database` from `types/database.ts`.

## UI & Styling

- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (not v3 — different configuration model)
- **Phosphor Icons** via `@phosphor-icons/react` (replaced Material Symbols)
- Brand assets in `brandAssets.ts` (web) and `theme/brandAssets.ts` (mobile)

## Deployment

**Vercel:** `habitus-app/vercel.json` uses custom `installCommand` for monorepo:
```json
{
  "installCommand": "cd .. && npm install && cd habitus-app",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

Deploy root repo, not individual workspaces.

## Key Services (@habitus/core/src/services)

- `auth.ts` — OAuth, password reset, profile creation
- `profile.ts` — CRUD, onboarding, identity verification
- `properties.ts` — Listings, filters, search
- `applications.ts` — Property applications
- `messages.ts` — Conversations
- `members.ts` — Public profiles, matching
- `compatibility.ts` — Match scoring
- `admin.ts` — Admin operations
