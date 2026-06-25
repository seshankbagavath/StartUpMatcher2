# LiftOff

## Overview

Full-stack founder platform (formerly "Startup Hub"). Founders submit startup ideas, get AI-driven 4-dimension evaluations, match with investors via embeddings, and browse public startups.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **Frontend**: React + Vite (artifact: `startup-hub`, preview: `/`)
- **Backend**: Express 5 (artifact: `api-server`, preview: `/api`)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Auth**: Session tokens stored in localStorage, validated via DB sessions table
- **AI**: OpenAI via `@workspace/integrations-openai-ai-server` (model `gpt-5.4`); embeddings via `text-embedding-3-small`
- **Animations**: Framer Motion (page transitions, stagger reveals, 3D tilt cards)
- **Fonts**: Space Grotesk (headings/display) + Inter (body)
- **External DB**: Supabase credentials in env (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY) — main data uses Replit PostgreSQL

## Key Features

- **Landing page** — animated SVG rocket (float + flame), star field, staggered hero copy, 3D tilt feature cards, gradient headline, CTA band
- **Auth** — register/login with email+password (hashed), session tokens in DB; Framer Motion stagger on forms
- **Dashboard** — stats summary, 4-dimension score breakdown bars, investor matches, recent activity feed, idea portfolio cards; skeleton loading states everywhere
- **Submit Idea** — form with category/stage/visibility, auto-evaluation scoring
- **Browse Startups** — searchable/filterable grid of public ideas
- **Idea Detail** — animated SVG score ring, sub-score breakdown bars
- **Page transitions** — AnimatePresence fade+slide in `App.tsx`
- **Active nav indicator** — Framer Motion layoutId spring underline on current route

## Investor Matching (embedding-based)

- Idea text embedded once per request via `text-embedding-3-small`
- Investor embeddings cached in DB `embedding` column (JSON text); batch-fetched on first request
- Cosine similarity ranks all investors; top 3 returned
- All 3 match explanations generated in **one** `gpt-5.4` chat completion call
- Seed: 10 investors auto-inserted on first request

## 4-Dimension Scoring

Each idea scored across: problemClarity / marketSize / innovation / executionPotential (0–25 each = 100 total). Sub-scores stored in DB, displayed as colored progress bars on dashboard and idea detail page.

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Current user |
| GET | /api/ideas | List user's ideas |
| POST | /api/ideas | Create idea |
| GET | /api/ideas/:id | Get idea |
| DELETE | /api/ideas/:id | Delete idea |
| POST | /api/evaluate-idea | Evaluate idea (4-dimension AI scoring) |
| GET | /api/get-startups | Browse public startups |
| POST | /api/match-investors | Embedding-based investor matching |
| GET | /api/dashboard/summary | Dashboard stats |
| GET | /api/dashboard/recent-activity | Activity feed |
| GET | /api/dashboard/investor-matches | Auto-match latest idea |

## DB Schema

- `users` — id, email, password_hash, name, created_at
- `ideas` — id, user_id, title, description, category, stage (enum), evaluation_score, evaluation_feedback, problem_clarity, market_size, innovation, execution_potential, is_public, created_at, updated_at
- `sessions` — id, user_id, token, created_at, expires_at
- `investors` — id, name, firm, interests[], risk_level, bio, contact_hint, **embedding** (text, nullable — cached JSON vector), created_at

## Key Commands

- `pnpm dev` — **run the whole stack** (Postgres check/auto-start, API with crash-restart, Vite frontend) via `scripts/dev.mjs`; Ctrl-C stops everything. API on :3001, web on :5173. Env knobs: `API_PORT`, `WEB_PORT`, `PGBIN`/`PGDATA`, `SKIP_BUILD=1`.
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks + Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes
- `pnpm run typecheck:libs` — rebuild shared libs

## Auth Pattern

Token stored in `localStorage` under key `startup_hub_token`. The custom fetch in `lib/api-client-react/src/custom-fetch.ts` automatically attaches it as `Authorization: Bearer <token>` via `setAuthTokenGetter`. The `AuthProvider` context (in `src/hooks/use-auth.tsx`) manages login/logout state.

## Framer Motion Patterns

- **Page transitions**: `AnimatePresence mode="wait"` wrapping `Switch` in `App.tsx`, keyed by `useLocation()`
- **Stagger reveals**: `container` + `item` variant objects with `staggerChildren`; used on landing hero, login/register cards
- **Viewport animations**: `whileInView` on feature cards and CTA band (once: true)
- **3D tilt cards**: `useMotionValue` + `useTransform` on `TiltCard` component (landing features)
- **Active nav indicator**: `motion.span` with `layoutId="nav-indicator"` for spring transition between links
- **Ease type**: Always cast cubic bezier as `[number, number, number, number]` — `number[]` fails TS

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
