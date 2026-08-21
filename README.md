# Attuned

**Your application. Tailored for the job.**

Attuned turns a job description and your real resume into a targeted, evidence-grounded resume and cover letter — with a match score, a keyword-by-keyword evidence map, ATS analysis, and an AI-recommended visual design. It never fabricates experience, skills, or metrics: everything it generates is traceable back to your candidate profile.

## Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API routes
- **Database:** Postgres via Prisma. Local dev uses a throwaway Docker Postgres (`docker-compose.yml`) — no separate install needed. Production points at any Postgres host (Supabase, Neon, Railway, RDS).
- **Auth:** NextAuth (credentials/local) — swappable for Supabase Auth
- **AI:** A pluggable `AIProvider` abstraction. Ships with a fully local, offline **heuristic engine** (keyword/skill extraction, evidence-based matching, template-based generation) that needs no API key. Optional OpenAI/Anthropic providers are wired to the same interface — set `AI_PROVIDER` and an API key in `.env` to switch.
- **Storage:** A pluggable driver — local disk by default, or S3-compatible object storage (`STORAGE_DRIVER=s3`; works with AWS S3, Supabase Storage, Cloudflare R2) for hosts without a persistent filesystem.
- **Documents:** `pdf-parse` / `mammoth` for resume parsing, `@react-pdf/renderer` / `docx` for export, `jszip` for the full application package

## Getting started

Requires [Docker](https://www.docker.com/) for local Postgres (or point `DATABASE_URL` at any Postgres instance you already have).

```bash
docker compose up -d        # starts local Postgres on :5432
npm install
cp .env.example .env        # defaults work out of the box against the Docker Postgres above
npx prisma migrate dev --name init
npm run db:seed             # seeds design templates
npm run dev
```

Open http://localhost:3000. Register an account, upload or paste a resume, then paste a job description to run the full flow: job analysis → candidate match → keyword mapping → tailored resume + cover letter → design → ATS check → export.

## Architecture

```
src/
  app/          Next.js routes (landing, auth, dashboard, application workspace) + API route handlers
  components/   Reusable UI primitives (button, card, input, tabs, ...)
  features/     Feature-scoped UI: job-input, candidate-profile, match-analysis, document-editor, design-engine, ats-analyzer, applications
  lib/          Cross-cutting: prisma client, auth config, session helpers, AI provider abstraction (lib/ai/), storage driver
  services/     Business logic: resume parsing, ATS analysis, document export, text diffing
  types/        Shared domain types (JobAnalysis, MatchAnalysis, CandidateProfile, ...)
prisma/         Schema, seed script
storage/        Local-disk file store when STORAGE_DRIVER=local (gitignored, never overwritten)
```

AI logic lives only under `src/lib/ai/` and `src/services/` — never inside components. The niche system (`src/lib/ai/niches/`) is fully seeded for **technology / AI / software / fintech** and stubbed for nursing, sales, marketing, finance, consulting, trades, healthcare, and education — extend a niche by filling in its skills dictionary and tone profile.

## Anti-fabrication guarantee

Every generated document is built from the candidate profile only. Requirements the profile doesn't support are surfaced as gaps (`"Not found in profile"`), never invented — see `src/lib/ai/localProvider.ts` (`findEvidence`) and `src/services/atsAnalyzer.ts` for how evidence is traced.

## Deploying

The app is a standard Next.js app, so it deploys to any Next.js-compatible host. Two things need real infrastructure behind them first — SQLite-on-disk and local file storage don't survive a serverless platform's ephemeral filesystem, which is why both are already pluggable:

1. **Database** — provision a Postgres instance (free tiers: [Supabase](https://supabase.com), [Neon](https://neon.tech), [Railway](https://railway.app)). Set `DATABASE_URL` to its connection string and run `npx prisma migrate deploy` once against it (from CI or locally).
2. **File storage** — for a serverless host (Vercel, Netlify), set `STORAGE_DRIVER=s3` plus `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` (and `S3_ENDPOINT` for a non-AWS provider like Supabase Storage or Cloudflare R2). If you're instead deploying to a host with a persistent disk (a VM, Railway, Fly.io, Docker), `STORAGE_DRIVER=local` (the default) works unchanged.
3. **Auth** — set `NEXTAUTH_URL` to your production URL and a real random `NEXTAUTH_SECRET` (`openssl rand -base64 32`).
4. **AI** — no key required; `AI_PROVIDER=local` works in production exactly as it does locally.

### Example: Vercel + Supabase

- Push this repo to GitHub, import it in Vercel.
- Create a Supabase project; use its Postgres connection string as `DATABASE_URL`, and its Storage bucket + service credentials as the `S3_*` vars (Supabase Storage speaks the S3 API — set `S3_ENDPOINT` to your project's S3-compatible endpoint).
- Set `STORAGE_DRIVER=s3`, `NEXTAUTH_URL` to your Vercel domain, and a generated `NEXTAUTH_SECRET`, in Vercel's environment variables.
- Run `npx prisma migrate deploy` once (locally, pointed at the Supabase `DATABASE_URL`, or as a Vercel build step) to create the schema.
- Deploy. `AI_PROVIDER` can stay `local`.

### Example: a single persistent-disk host (Railway, Fly.io, a VPS)

- No storage changes needed — keep `STORAGE_DRIVER=local`.
- Still needs a real Postgres (`docker-compose.yml` is for local dev only; use the host's managed Postgres or your own Postgres container in production).
- `npm run build && npm run start`.

## Known follow-up

`npm audit` flags several Next.js 14.x advisories that are only fixed in the Next 15/16 line. Next 16 changes the App Router API (async route params, etc.) enough that upgrading isn't a drop-in change — treat it as a deliberate follow-up task, not something to silently pull in.

## Switching to production infrastructure (auth)

Swap the NextAuth Credentials provider for Supabase Auth (or another provider) in `src/lib/auth.ts` if you want managed auth instead of the built-in credentials flow. Database and storage are already environment-driven (see **Deploying** above) — no code changes needed to move those to production.
