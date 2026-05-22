# Agentes QA — Login y onboarding por rol

Cuatro agentes Playwright (uno por rol) prueban registro, login y rutas post-login con **correo temporal** ([mail.tm](https://mail.tm)).

## Roles

| Prompt | Rol | Home |
|--------|-----|------|
| `prompts/inquilino.md` | Inquilino | `/descubrir` |
| `prompts/anfitrion.md` | Anfitrión | `/panel` |
| `prompts/propietario.md` | Propietario | `/panel` |
| `prompts/agencia.md` | Agencia | `/panel` |

## Ejecutar

```bash
cd habitus-app
npm install
npx playwright install chromium
npm run dev   # otra terminal

# Opcional: .env.local con E2E_SUPABASE_SERVICE_ROLE_KEY (evita rate limit)
cp .env.e2e.example .env.e2e

E2E_BASE_URL=http://localhost:5176 npm run test:agents
```

Reporte: `e2e/reports/latest.md`

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run test:agents` | 4 tests en serie + informe |
| `npm run test:agents:report` | Igual, imprime resumen al final |
| `npm run e2e:confirm -- email@mail.tm` | Confirma correo vía Admin API |

## Cursor Agent

Puedes lanzar un subagente con el contenido de cada `agents/prompts/*.md` y browser MCP para exploración manual.
