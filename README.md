# Colouring Book Generator

Generate custom children's colouring book pages with AI. Type a description, select an age range, and get print-ready black-and-white line art in seconds.

## Features

- **AI Image Generation** — Describe a scene and get a colouring page via OpenAI
- **Age-Appropriate Output** — Select 2-4, 5-7, or 8-12 for complexity-adjusted line art
- **Quality Tiers** — Low, medium, and high quality generation options
- **Gallery** — Browse, favourite, and manage all your generated pages
- **Book Compiler** — Drag-and-drop pages into books, compile to PDF with cover pages
- **Templates** — Pre-built prompt templates for quick generation
- **Local-First** — SQLite database and local file storage, no cloud dependencies

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example env.local
# Edit env.local and add your OPENAI_API_KEY

# Run database migrations
npm run db:migrate

# Optionally seed templates
npm run db:seed

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: SQLite via Drizzle ORM
- **AI**: OpenAI image generation API
- **PDF**: pdf-lib (server-side compilation)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for image generation |
| `DATABASE_URL` | No | SQLite path (defaults to `file:local.db`) |

## Project Structure

```
src/
  app/
    api/          # API routes (generate, gallery, book CRUD/compile, templates, admin)
    book/         # Book editor and generation pages
    gallery/      # Gallery page
    templates/    # Template browser page
  components/     # React components (GeneratorForm, BookEditor, GalleryGrid, etc.)
  lib/            # Server utilities (db, image generation, storage, PDF, prompts)
  types/          # Shared TypeScript types
drizzle/          # SQL migration files
public/uploads/   # Generated images (gitignored)
```
