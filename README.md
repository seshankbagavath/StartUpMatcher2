# LiftOff 🚀

An AI-scored, two-sided marketplace that connects startup **founders** with **investors**.

Founders submit an idea, get a brutally honest AI evaluation across four dimensions, and are matched with the investors who actually fit. Investors create a profile, discover founders, and message them directly.

> Formerly "Startup Hub" / StartUpMatcher.

---

## What it does

**For founders**
- Submit an idea (title, description, problem, target users, category, stage)
- Get an AI **scorecard**: problem clarity, market size, innovation, execution potential (0–25 each → 100), plus strengths, weaknesses, and suggestions in a no-nonsense VC tone
- See your **top investor matches** — including real, registered investors you can message in one click
- Browse the public idea wall

**For investors**
- Sign up, onboard with your firm, bio, and investment focus areas
- Discover founders on the public Browse page (search, filter, sort)
- Reach out to founders about their ideas; your focus areas drive whether you surface in founders' matches

**Messaging** — real founder ↔ investor threads, scoped to a specific idea, initiated from either side.

---

## Stack

| Layer | Tech |
|------|------|
| Monorepo | pnpm workspaces, TypeScript |
| Frontend | React + Vite, Tailwind, Framer Motion, TanStack Query (artifact: `startup-hub`) |
| Backend | Express 5, session-token auth (artifact: `api-server`) |
| Database | PostgreSQL + Drizzle ORM |
| API contract | OpenAPI → Orval (React Query hooks) + Zod schemas |
| AI | OpenAI-compatible provider (**Groq**) for scoring & match explanations, with a deterministic **local fallback** when no key is set |

**Design system:** white-to-beige surfaces with a single sage-green accent — a 4-point spacing scale, a 1.250 major-third type scale, and `--lo-*` design tokens.

---

## Project layout

```
artifacts/
  api-server/      Express API           (preview: /api, port 3001)
  startup-hub/     React + Vite frontend (preview: /,    port 5173)
  mockup-sandbox/  design sandbox
lib/
  db/                  Drizzle schema + client
  api-spec/            OpenAPI source of truth
  api-zod/             generated Zod schemas
  api-client-react/    generated React Query hooks + custom fetch
  integrations-openai-ai-server/   AI client (Groq/OpenAI-compatible)
scripts/
  dev.mjs          one-command dev supervisor
```

---

## Prerequisites

- **Node.js 24+**
- **pnpm** (`npm i -g pnpm`)
- **PostgreSQL** (any local or hosted instance, e.g. local Postgres, Neon, Supabase)

---

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure the API environment
cp artifacts/api-server/.env.example artifacts/api-server/.env
#   then edit artifacts/api-server/.env and set DATABASE_URL.
#   Leave AI_INTEGRATIONS_OPENAI_API_KEY blank to run on the local AI fallback,
#   or paste a Groq key to enable real AI scoring.

# 3. Create the schema in your database
DATABASE_URL="postgresql://USER@HOST:5432/liftoff" \
  pnpm --filter @workspace/db run push
```

### Environment variables (`artifacts/api-server/.env`)

| Var | Required | Notes |
|-----|----------|-------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `PORT` | ✅ | API port (default 3001) |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | – | Defaults to Groq's OpenAI-compatible URL |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | – | Blank = deterministic local fallback; set it to enable real AI |
| `AI_MODEL` | – | Chat model id (e.g. `llama-3.3-70b-versatile`) |

---

## Run

**One command (recommended)** — starts Postgres (if a local cluster is configured), the API with crash-restart, and the frontend:

```bash
pnpm dev
```

- API → http://localhost:3001/api
- Web → http://localhost:5173/
- `Ctrl-C` stops everything.

Env knobs: `API_PORT`, `WEB_PORT`, `PGBIN`/`PGDATA` (auto-start a local cluster), `SKIP_BUILD=1`.

**Or run pieces individually:**

```bash
# API
pnpm --filter @workspace/api-server run dev
# Frontend
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/startup-hub run dev
```

---

## Common commands

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Run the whole stack (supervised) |
| `pnpm --filter @workspace/db run push` | Apply schema changes to the database |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API hooks + Zod from OpenAPI |
| `pnpm run typecheck` | Typecheck all packages |
| `pnpm run typecheck:libs` | Rebuild shared libs |

---

## How matching works

1. The idea's text is turned into a lexical embedding.
2. Candidate investors — **seeded archetypes + registered investor users** (whose interests/bio give them a profile) — are embedded the same way.
3. Cosine similarity ranks them; the top matches are returned, with registered investors lightly boosted so reachable people surface.
4. Each match gets a one-line "why this fits" rationale (Groq when configured, templated otherwise).
5. Registered matches are flagged so founders can **message them directly**.

---

## Notes

- Session tokens are stored in `localStorage` (`startup_hub_token`) and sent as `Authorization: Bearer <token>`. Fine for a demo; revisit before production.
- With no AI key, scoring and match explanations use a deterministic local model — the app is fully functional offline.
