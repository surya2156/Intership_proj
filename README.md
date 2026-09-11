# LOOP — AI Customer-Feedback Intelligence Platform

> Zidio Development Internship — Project LOOP (Web Development Track)
> Built with Next.js 14 (App Router), TypeScript, PostgreSQL, Prisma, and the Anthropic Claude API.

LOOP ingests multi-channel customer feedback (support tickets, app-store reviews, NPS
surveys, sales call notes, community posts), uses Claude to classify and cluster it,
surfaces trending themes, answers plain-English questions grounded in the real
feedback, and generates a Voice-of-Customer digest — all inside a multi-tenant,
role-based workspace.

## 1. Tech stack

| Layer        | Technology                          |
|--------------|--------------------------------------|
| Framework    | Next.js 14 (App Router) + TypeScript |
| Styling      | Tailwind CSS                        |
| Database     | PostgreSQL (Neon / Supabase free tier) |
| ORM          | Prisma                              |
| Auth         | NextAuth (Auth.js), credentials provider |
| AI           | Anthropic Claude API (`claude-sonnet-4-6`) |
| Charts       | Recharts                            |
| Validation   | Zod on every API boundary            |
| Deployment   | Vercel                              |

## 2. Architecture

Three-tier: browser → API route handlers → Prisma/Postgres, with the Claude API
called **only** from server-side route handlers (never the browser). Every query
that touches `Feedback`, `Theme`, `Report`, or `User` is filtered by the
authenticated user's `workspaceId` — see `lib/auth.ts` (`requireSession`,
`requireRole`) and the `assertOwnedByWorkspace` guard in
`app/api/feedback/[id]/route.ts` for how tenant isolation is enforced.

```
app/
  (auth)/login, signup              -> public auth pages
  (app)/dashboard, inbox, trends,
        ask, reports, settings      -> protected app shell (see app/(app)/layout.tsx)
  api/
    auth/[...nextauth], auth/signup -> authentication
    feedback, feedback/[id],
    feedback/csv, feedback/channel  -> ingestion + inbox CRUD (C3, C4)
    themes, themes/[id]             -> clustering + trends (AI2)
    insights                        -> Ask LOOP, retrieval-grounded Q&A (AI3)
    reports, reports/[id]           -> Voice-of-Customer report (AI4)
    members                         -> RBAC / team management (C2)
    dashboard                       -> analytics dashboard data (C5)
lib/
  auth.ts       -> NextAuth config + requireSession/requireRole guards
  db.ts         -> Prisma client singleton
  ai.ts         -> all Claude calls (classify, answer, generate report)
  search.ts     -> embeddings + cosine-similarity retrieval for Ask LOOP
  validators.ts -> Zod schemas for every API input
  simulated-channels.ts -> sample data pools for the "channel sync" feature
components/
  charts/    -> Recharts wrappers (volume, sentiment, top themes)
  feedback/  -> ingestion form, CSV import, channel sync, inbox table
prisma/
  schema.prisma -> data model (Workspace, User, Feedback, Theme, FeedbackTheme,
                   Embedding, Report)
  seed.ts       -> demo workspace + 3 role accounts + 130 feedback items
```

## 3. The four AI features

| # | Feature | Where |
|---|---------|-------|
| AI1 | **Auto-classification** — every item gets sentiment, score, theme(s), and a feature-area label from Claude, returned as strict JSON and validated with Zod before saving. | `lib/ai.ts#classifyFeedback`, wired in `app/api/feedback/route.ts#classifyAndStore` |
| AI2 | **Theme clustering & trends** — items are grouped into named themes (reused across ingests), with a trends view comparing the current vs. previous period and flagging spikes (≥50% growth). | `app/api/themes/route.ts`, `app/(app)/trends/page.tsx` |
| AI3 | **Ask LOOP** — retrieval-grounded Q&A. The question is embedded, the top-6 most similar feedback items are retrieved, and Claude is instructed to answer *only* from that context and say so if it can't. | `lib/search.ts`, `lib/ai.ts#answerFromFeedback`, `app/api/insights/route.ts` |
| AI4 | **Voice-of-Customer report** — stats (totals, sentiment breakdown, top themes, sample quotes) are computed in code first; Claude only writes the narrative around them, so figures can't be hallucinated. | `lib/ai.ts#generateVoCNarrative`, `app/api/reports/route.ts` |

### A note on embeddings

`lib/search.ts` uses a deterministic hashing-based bag-of-words embedding so the
project runs end-to-end without a second paid API key. It's good enough for a
topical-relevance demo. For production-grade semantic search, swap `embedText()`
for a real embeddings provider (Anthropic recommends
[Voyage AI](https://docs.voyageai.com)) and switch the `Embedding.vector` Prisma
column to a native `vector` type via the `pgvector` extension — the rest of the
retrieval pipeline (`cosineSimilarity`, `retrieveTopK`) doesn't need to change.

## 4. Local setup

### Prerequisites
- Node.js 18+
- A free PostgreSQL database — [Neon](https://neon.tech) or [Supabase](https://supabase.com)
- An [Anthropic API key](https://console.anthropic.com)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# then fill in DATABASE_URL, NEXTAUTH_SECRET (openssl rand -base64 32),
# and ANTHROPIC_API_KEY

# 3. Create the database schema
npx prisma migrate dev --name init

# 4. Seed demo data (workspace, 3 role accounts, 130 feedback items)
npm run seed

# 5. Run locally
npm run dev
# -> http://localhost:3000
```

### Deploying to Vercel

```bash
vercel
```
Add `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (your production URL), and
`ANTHROPIC_API_KEY` in the Vercel project's Environment Variables settings, then
redeploy. Run `npx prisma migrate deploy` (or `npm run seed` once) against the
production database before your first login.

## 5. Demo credentials

Password for all three seeded accounts: **`Demo1234!`**

| Role    | Email                  |
|---------|-------------------------|
| Admin   | admin@loop-demo.dev    |
| Analyst | analyst@loop-demo.dev  |
| Viewer  | viewer@loop-demo.dev   |

## 6. Roles

- **Admin** — everything, plus managing members/roles (`/settings`).
- **Analyst** — ingest feedback (single/CSV/channel sync), triage the inbox, re-classify, generate reports.
- **Viewer** — read-only across dashboard, inbox, trends, Ask LOOP, and reports.

Roles are enforced **server-side** in every route handler via `requireRole()` —
hiding a button in the UI is never the only guard.

## 7. What's out of scope (by design)

Per the project brief: no live third-party integrations (channels are
simulated), no billing/payments, no native mobile app, no real-time
collaboration, no email/SMS delivery. See brief §4.2.

## 8. Using pgvector instead of the JSON embedding column

If your Postgres instance supports the `pgvector` extension:

```sql
create extension if not exists vector;
```

Change the `Embedding.vector` field in `prisma/schema.prisma` to
`Unsupported("vector(256)")`, run a migration, and switch the retrieval query in
`app/api/insights/route.ts` to a `<->` distance query instead of in-memory cosine
similarity. This scales far better once you have thousands of feedback items.

---
Built for the Zidio Development Web Development Track internship.
# Intership_proj
