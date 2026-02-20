# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Children's colouring book page generator. Users describe a scene, select an age range, and get AI-generated black-and-white line art suitable for printing and colouring. Authenticated users can save generations, compile them into PDF books with drag-drop ordering, and download.

## Commands

```bash
npm run dev          # Start Next.js dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint (flat config, Next.js core-web-vitals + TypeScript)
npm run db:generate  # Generate Drizzle migration files from schema changes
npm run db:migrate   # Apply pending migrations
npm run db:seed      # Seed templates (tsx src/lib/db/seed.ts)
```

No test framework is configured yet.

## Architecture

Next.js 16 App Router with TypeScript, Tailwind CSS v4, and shadcn/ui components.

### Image Generation Pipeline

`src/app/api/generate/route.ts` → `src/lib/generate-image.ts` → OpenAI (primary) / FLUX (fallback)

1. User prompt + age range → `buildSystemPrompt()` in `src/lib/prompts.ts` adds colouring-book-specific instructions
2. `generateImage()` tries OpenAI first, falls back to FLUX if `BFL_API_KEY` is set
3. Images uploaded to Cloudflare R2 via `src/lib/storage.ts` (S3-compatible SDK)
4. Generation metadata saved to SQLite via Drizzle ORM

### Auth

NextAuth v5 (beta) with Google provider and Drizzle adapter. JWT session strategy. Config in `src/lib/auth.ts`. Unauthenticated users get IP-based rate limiting; authenticated users get plan-based limits (free/pro/creator tiers).

### Database

SQLite (local file or Turso for production). Schema in `src/lib/db/schema.ts`, Drizzle ORM. Migrations in `drizzle/`. Key tables: `users`, `generations`, `books`, `book_pages`, `templates`, plus NextAuth tables (`accounts`, `sessions`, `verification_tokens`).

Falls back to `file:local.db` when `DATABASE_URL` is not set.

### PDF Compilation

`src/lib/pdf.ts` (server-side, uses `pdf-lib`) and `src/lib/pdf-client.ts` (client-side). Books are assembled from existing generations with configurable page size (A4/Letter), page numbers, and footer text.

### Payments

Stripe integration for pro/creator plans. Checkout via `src/app/api/stripe/checkout/route.ts`, webhook handling in `src/app/api/stripe/webhook/route.ts`. Pricing page at `/pricing`.

### Rate Limiting

Three-tier plan system defined in `src/app/api/generate/route.ts` (`PLAN_LIMITS`): free (5/day, 30/month, low quality only), pro (30/day, 500/month), creator (100/day, 2000/month, all qualities). IP-based limiting for unauthenticated users in `src/lib/rate-limit.ts`. Daily counter reset via cron at `src/app/api/cron/reset-counters/route.ts`.

### Key Directories

- `src/app/api/` — API routes (generate, gallery, book CRUD/compile, templates, stripe, admin)
- `src/components/` — React components (GeneratorForm, BookEditor with drag-drop, GalleryGrid, etc.)
- `src/lib/` — Server utilities (auth, db, image generation, storage, PDF, prompts, rate limiting)
- `src/types/` — Shared TypeScript types (AgeRange, QualityTier, request/response interfaces)
- `drizzle/` — SQL migration files

## Environment

Copy `.env.example` to `env.local`. Required: `OPENAI_API_KEY`. Optional: `BFL_API_KEY` (FLUX fallback), R2 credentials (storage), `AUTH_SECRET` + Google OAuth creds (auth), Stripe keys (payments).
