# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Children's colouring book page generator. Users describe a scene, select an age range, and get AI-generated black-and-white line art suitable for printing and colouring. Users can save generations, compile them into PDF books with drag-drop ordering, and download.

Local-first app — only external dependency is the OpenAI API for image generation.

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

`src/app/api/generate/route.ts` → `src/lib/generate-image.ts` → OpenAI

1. User prompt + age range → `buildSystemPrompt()` in `src/lib/prompts.ts` adds colouring-book-specific instructions
2. `generateImage()` calls OpenAI image generation
3. Images saved to local filesystem (`public/uploads/`) via `src/lib/storage.ts`
4. Generation metadata saved to SQLite via Drizzle ORM

### Storage

Local filesystem. Images stored in `public/uploads/` and served as static files. The `storage.ts` module provides `uploadImage`, `getImage`, `generateImageKey`, and `readImageFromUrl` (handles data: URLs, local /uploads/ paths, and remote http URLs).

### Database

SQLite (local file). Schema in `src/lib/db/schema.ts`, Drizzle ORM. Migrations in `drizzle/`. Key tables: `users`, `generations`, `books`, `book_pages`, `templates`.

Falls back to `file:local.db` when `DATABASE_URL` is not set. A default local user is auto-created on first request via `src/lib/default-user.ts`.

### PDF Compilation

`src/lib/pdf.ts` (server-side, uses `pdf-lib`) and `src/lib/pdf-client.ts` (client-side). Books are assembled from existing generations with configurable page size (A4/Letter), page numbers, and footer text.

### Key Directories

- `src/app/api/` — API routes (generate, gallery, book CRUD/compile, templates, admin)
- `src/components/` — React components (GeneratorForm, BookEditor with drag-drop, GalleryGrid, etc.)
- `src/lib/` — Server utilities (db, image generation, storage, PDF, prompts, costs)
- `src/types/` — Shared TypeScript types (AgeRange, QualityTier, request/response interfaces)
- `drizzle/` — SQL migration files

## Environment

Copy `.env.example` to `env.local`. Required: `OPENAI_API_KEY`. Optional: `DATABASE_URL` (defaults to `file:local.db`).
