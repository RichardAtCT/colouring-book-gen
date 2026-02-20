# Technical Specification: Children’s Colouring Book Generator

Version: 1.0  
Date: 20 February 2026  
Status: Draft  
Related: [PRD.md](./PRD.md)

-----

## 1. Architecture Overview

```text
┌─────────────────────────────────────────────────────┐
│ Client (Browser)                                    │
│ Next.js App · React UI · TailwindCSS               │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────┐
│ API Layer (Next.js API Routes)                      │
│                                                     │
│ /api/generate  - Image generation orchestration     │
│ /api/gallery   - User's generation history          │
│ /api/book      - PDF book compilation               │
│ /api/templates - Pre-built prompt templates         │
│ /api/health    - Health check + cost monitoring     │
└──────┬──────────────────┬───────────────────────────┘
       │                  │
┌──────▼──────┐    ┌──────▼──────┐    ┌────────────────┐
│ OpenAI API  │    │ Storage      │    │ PDF Engine     │
│ (Primary)   │    │ (S3/R2)      │    │ (pdf-lib)      │
└─────────────┘    └─────────────┘    └────────────────┘
       │
┌──────▼──────┐
│ FLUX API    │
│ (Fallback)  │
└─────────────┘
```

-----

## 2. Tech Stack

| Layer | Technology | Rationale |
|--------------------|---------------------------------------|----------------------------------------------------------|
| **Framework** | Next.js 15 (App Router) | SSR + API routes in one project; Vercel-ready |
| **Language** | TypeScript | Type safety across client/server boundary |
| **Styling** | TailwindCSS + shadcn/ui | Rapid UI development; consistent design system |
| **Image Generation** | OpenAI GPT Image 1.5 API (primary) | Best prompt adherence; simple REST API |
| **Image Generation** | Black Forest Labs FLUX API (fallback) | Cost-effective fallback; style consistency features |
| **Storage** | Cloudflare R2 (or AWS S3) | Cheap object storage for generated images |
| **Database** | SQLite via Turso (or Postgres via Neon) | Serverless-friendly; stores user data, generation metadata |
| **PDF Generation** | pdf-lib (Node.js) | Pure JS; no native dependencies; embeds images into PDF |
| **Auth** | NextAuth.js / Clerk | Social login; session management |
| **Deployment** | Vercel | Zero-config Next.js hosting; edge functions |
| **Monitoring** | Vercel Analytics + custom cost tracker | Usage metrics + API spend tracking |

-----

## 3. Data Model

### 3.1 Core Entities

```ts
// User
interface User {
  id: string; // UUID
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'creator';
  generationsToday: number;
  generationsThisMonth: number;
  createdAt: Date;
}

// Generation
interface Generation {
  id: string; // UUID
  userId: string; // FK → User
  prompt: string; // User's input prompt
  systemPrompt: string; // Full prompt sent to API
  ageRange: '2-4' | '5-7' | '8-12';
  provider: 'openai' | 'flux';
  model: string; // e.g. 'gpt-image-1.5'
  quality: 'low' | 'medium' | 'high';
  imageUrl: string; // R2/S3 URL
  thumbnailUrl: string; // 256px thumbnail
  width: number;
  height: number;
  costUsd: number; // Actual API cost
  status: 'pending' | 'completed' | 'failed';
  isFavourite: boolean;
  createdAt: Date;
}

// Book
interface Book {
  id: string; // UUID
  userId: string; // FK → User
  title: string;
  coverImageUrl?: string;
  pages: BookPage[]; // Ordered list
  pdfUrl?: string; // Generated PDF URL
  status: 'draft' | 'compiled' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

interface BookPage {
  generationId: string; // FK → Generation
  pageNumber: number;
  includePageNumber: boolean;
  includeFooter: boolean; // "Coloured by: ___"
}

// Template
interface Template {
  id: string;
  category: string; // 'animals' | 'space' | 'vehicles' | ...
  name: string; // "Friendly Dinosaur"
  promptTemplate: string; // "A friendly {animal} in a {setting}..."
  variables: TemplateVar[];
  ageRange: '2-4' | '5-7' | '8-12';
  previewUrl: string;
}

interface TemplateVar {
  name: string;
  placeholder: string;
  options?: string[]; // Suggested values
}
```

### 3.2 Database Schema (SQL)

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  plan TEXT DEFAULT 'free',
  generations_today INTEGER DEFAULT 0,
  generations_this_month INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE generations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  prompt TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  age_range TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  quality TEXT NOT NULL DEFAULT 'medium',
  image_url TEXT,
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  cost_usd REAL,
  status TEXT DEFAULT 'pending',
  is_favourite BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE books (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  cover_image_url TEXT,
  pdf_url TEXT,
  status TEXT DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE book_pages (
  book_id TEXT NOT NULL REFERENCES books(id),
  generation_id TEXT NOT NULL REFERENCES generations(id),
  page_number INTEGER NOT NULL,
  include_page_number BOOLEAN DEFAULT TRUE,
  include_footer BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (book_id, generation_id)
);

CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  variables_json TEXT, -- JSON array of TemplateVar
  age_range TEXT NOT NULL,
  preview_url TEXT
);

CREATE INDEX idx_generations_user ON generations(user_id, created_at DESC);
CREATE INDEX idx_books_user ON books(user_id, updated_at DESC);
CREATE INDEX idx_templates_category ON templates(category);
```

-----

## 4. API Endpoints

### 4.1 Image Generation

**POST** `/api/generate`

Request:

```json
{
  "prompt": "A friendly dragon reading a book in a castle library",
  "ageRange": "5-7",
  "quality": "medium",
  "provider": "openai"
}
```

Response:

```json
{
  "id": "gen_abc123",
  "status": "completed",
  "imageUrl": "https://r2.example.com/generations/gen_abc123.png",
  "thumbnailUrl": "https://r2.example.com/generations/gen_abc123_thumb.png",
  "prompt": "A friendly dragon reading a book in a castle library",
  "costUsd": 0.04,
  "createdAt": "2026-02-20T14:30:00Z"
}
```

Server-side flow:
1. Validate user auth + rate limits
2. Build system prompt from ageRange + user prompt
3. Call OpenAI API (or fallback to FLUX on failure)
4. Receive image (base64 or URL)
5. Upload to R2/S3 (full-size + thumbnail)
6. Save Generation record to DB
7. Update user's generation counters
8. Return response

### 4.2 System Prompt Construction

```ts
function buildSystemPrompt(userPrompt: string, ageRange: string): string {
  const complexity = {
    '2-4': 'Very simple shapes, extra thick bold outlines, minimal detail, large areas to colour',
    '5-7': 'Simple but recognisable shapes, thick outlines, moderate detail, clear defined areas',
    '8-12': 'Detailed illustration, medium-weight outlines, intricate patterns allowed',
  }[ageRange];

  return `Children's colouring book page. Black line art on pure white background. Clean outlines only. No shading, no gradients, no grey tones, no colour fill, no watermarks. ${complexity}. Subject: ${userPrompt} Style: Friendly, age-appropriate cartoon illustration suitable for a printed colouring book. The image should fill the page with the subject centred.`;
}
```

### 4.3 OpenAI Integration

```ts
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateWithOpenAI(prompt: string, quality: 'low' | 'medium' | 'high') {
  const response = await openai.images.generate({
    model: 'gpt-image-1.5',
    prompt,
    n: 1,
    size: '1024x1024', // Square for colouring pages
    quality,
    response_format: 'b64_json',
  });

  return {
    imageBase64: response.data[0].b64_json,
    revisedPrompt: response.data[0].revised_prompt,
  };
}
```

### 4.4 FLUX Fallback Integration

```ts
async function generateWithFlux(prompt: string) {
  const response = await fetch('https://api.bfl.ml/v1/flux-pro-1.1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Key': process.env.BFL_API_KEY!,
    },
    body: JSON.stringify({
      prompt,
      width: 1024,
      height: 1024,
      prompt_upsampling: false,
    }),
  });

  const { id } = await response.json();

  // Poll for result
  for (let i = 0; i < 60; i++) {
    const statusResp = await fetch(
      `https://api.bfl.ml/v1/get_result?id=${id}`,
      { headers: { 'X-Key': process.env.BFL_API_KEY! } }
    );

    const statusData = await statusResp.json();
    if (statusData.status === 'Ready') {
      return { imageUrl: statusData.result.sample };
    }

    await new Promise(r => setTimeout(r, 2000));
  }

  throw new Error('FLUX generation timed out');
}
```

### 4.5 Gallery

**GET** `/api/gallery?page=1&limit=20&favourites=false`

Returns paginated list of user’s generations, newest first.

### 4.6 Book Compilation

**POST** `/api/book`

Request:

```json
{
  "title": "Dinosaur Adventures",
  "pages": [
    { "generationId": "gen_abc123", "pageNumber": 1 },
    { "generationId": "gen_def456", "pageNumber": 2 }
  ],
  "options": {
    "pageSize": "A4",
    "includePageNumbers": true,
    "includeFooter": true,
    "footerText": "Coloured by: ___________"
  }
}
```

PDF compilation flow:

```ts
import { PDFDocument, rgb } from 'pdf-lib';

async function compileBook(pages: BookPage[], options: BookOptions): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();

  const { width, height } = options.pageSize === 'A4'
    ? { width: 595.28, height: 841.89 } // A4 in points
    : { width: 612, height: 792 }; // US Letter in points

  for (const page of pages) {
    const pdfPage = pdfDoc.addPage([width, height]);

    const imageBytes = await fetchImageBytes(page.imageUrl);
    const image = await pdfDoc.embedPng(imageBytes);

    // Scale image to fit with margins (0.5 inch = 36pt)
    const margin = 36;
    const maxW = width - 2 * margin;
    const maxH = height - 2 * margin - 40; // Reserve space for footer

    const scale = Math.min(maxW / image.width, maxH / image.height);
    const drawW = image.width * scale;
    const drawH = image.height * scale;
    const x = (width - drawW) / 2;
    const y = (height - drawH) / 2 + 20; // Shift up for footer

    pdfPage.drawImage(image, { x, y, width: drawW, height: drawH });

    if (options.includePageNumbers) {
      pdfPage.drawText(`${page.pageNumber}`, {
        x: width / 2 - 5,
        y: 25,
        size: 10,
        color: rgb(0.6, 0.6, 0.6),
      });
    }

    if (options.includeFooter && options.footerText) {
      pdfPage.drawText(options.footerText, {
        x: margin,
        y: 25,
        size: 9,
        color: rgb(0.6, 0.6, 0.6),
      });
    }
  }

  return Buffer.from(await pdfDoc.save());
}
```

-----

## 5. Rate Limiting & Cost Control

### 5.1 User Limits

| Plan | Daily Limit | Monthly Limit | Quality Allowed | Price |
|-----------|-----------|-------------|---------------|------|
| **Free** | 5 pages | 30 pages | Low only | £0 |
| **Pro** | 30 pages | 500 pages | Low + Medium | £5/mo |
| **Creator** | 100 pages | 2,000 pages | All qualities | £15/mo |

### 5.2 Server-side Controls

```ts
// Rate limiting middleware
async function checkLimits(userId: string, plan: Plan): Promise<boolean> {
  const user = await db.getUser(userId);
  const dailyLimit = PLAN_LIMITS[plan].daily;
  const monthlyLimit = PLAN_LIMITS[plan].monthly;

  if (user.generationsToday >= dailyLimit) {
    throw new RateLimitError('Daily generation limit reached');
  }

  if (user.generationsThisMonth >= monthlyLimit) {
    throw new RateLimitError('Monthly generation limit reached');
  }

  return true;
}
```

### 5.3 Cost Monitoring

- Track `costUsd` per generation in DB
- Daily cost aggregation cron job
- Alert via webhook if daily spend exceeds threshold (e.g., $50)
- Kill switch: disable generation if monthly spend exceeds budget cap

-----

## 6. Image Post-Processing Pipeline

Generated images may need post-processing to ensure clean colouring pages:

1. Receive raw image from API
2. [Optional] Convert to greyscale → threshold to pure B&W
3. Generate thumbnail (256×256)
4. Upload full-size PNG to R2
5. Upload thumbnail to R2
6. Return URLs

For MVP, skip step 2 (rely on prompt engineering). Add as enhancement if output quality requires it.

```ts
// Post-processing with sharp (if needed)
import sharp from 'sharp';

async function postProcess(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer)
    .greyscale()
    .threshold(128) // Pure B&W
    .png({ compressionLevel: 9 })
    .toBuffer();
}
```

-----

## 7. Project Structure

```text
colouring-book-generator/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # Landing / generator
│   │   ├── gallery/page.tsx          # User's gallery
│   │   ├── book/[id]/page.tsx        # Book editor
│   │   ├── templates/page.tsx        # Template browser
│   │   └── api/
│   │       ├── generate/route.ts     # POST — generate image
│   │       ├── gallery/route.ts      # GET — list generations
│   │       ├── book/route.ts         # POST — compile book
│   │       └── templates/route.ts    # GET — list templates
│   ├── components/
│   │   ├── PromptInput.tsx           # Main prompt form
│   │   ├── AgeRangeSelector.tsx      # Age range radio group
│   │   ├── ImagePreview.tsx          # Generated image display
│   │   ├── GalleryGrid.tsx           # Masonry grid of images
│   │   ├── BookEditor.tsx            # Drag-drop page arranger
│   │   └── TemplateCard.tsx          # Template browser card
│   ├── lib/
│   │   ├── openai.ts                 # OpenAI API client
│   │   ├── flux.ts                   # FLUX API client
│   │   ├── storage.ts                # R2/S3 upload helpers
│   │   ├── pdf.ts                    # PDF compilation
│   │   ├── prompts.ts                # System prompt builder
│   │   ├── rate-limit.ts             # Rate limiting logic
│   │   └── db.ts                     # Database client
│   └── types/
│       └── index.ts                  # Shared TypeScript types
├── prisma/
│   └── schema.prisma                 # DB schema (if using Prisma)
├── public/
│   └── templates/                    # Template preview images
├── .env.local                        # API keys (never committed)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

-----

## 8. Environment Variables

```bash
# API Keys
OPENAI_API_KEY=sk-...
BFL_API_KEY=bfl_...

# Storage
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=colouring-pages

# Database
DATABASE_URL=libsql://...

# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# Cost Controls
DAILY_COST_ALERT_USD=50
MONTHLY_COST_CAP_USD=500
```

-----

## 9. MVP Scope & Milestones

### Phase 1: Core Generator (Week 1–2)
- [ ] Next.js project setup with TypeScript + Tailwind
- [ ] OpenAI API integration with prompt builder
- [ ] Single page generation UI (prompt → preview → download PNG)
- [ ] Age range selector affecting prompt complexity
- [ ] Basic rate limiting (IP-based for unauthenticated)

### Phase 2: Storage & Gallery (Week 3)
- [ ] R2/S3 integration for image persistence
- [ ] User authentication (NextAuth / Clerk)
- [ ] Generation history gallery with pagination
- [ ] Favourite/delete functionality
- [ ] User generation counters and plan limits

### Phase 3: Book Compiler (Week 4)
- [ ] Book creation UI with drag-drop ordering
- [ ] PDF compilation with pdf-lib
- [ ] Cover page generation
- [ ] Page numbers and footer text
- [ ] Download compiled PDF

### Phase 4: Templates & Polish (Week 5)
- [ ] Template data seeding (20+ templates across categories)
- [ ] Template browser UI
- [ ] Template variable customisation
- [ ] FLUX fallback integration
- [ ] Image post-processing pipeline (B&W threshold)
- [ ] Cost monitoring dashboard (admin)

### Phase 5: Launch Prep (Week 6)
- [ ] Landing page with examples
- [ ] Payment integration (Stripe) for Pro/Creator plans
- [ ] Terms of service and privacy policy
- [ ] Performance testing and optimisation
- [ ] Production deployment

-----

## 10. Testing Strategy

| Type | Tool | Coverage |
|-----------|--------------------|----------------------------------------------------|
| Unit | Vitest | Prompt builder, rate limiter, cost calculations |
| Integration | Vitest + MSW | API routes with mocked OpenAI responses |
| E2E | Playwright | Full generation flow, book compilation, auth |
| Visual | Chromatic (optional) | Component regression testing |
| Load | k6 | Concurrent generation requests; verify rate limiting |

-----

## 11. Deployment

### Vercel (recommended for MVP)
- Framework: Next.js
- Build: `next build`
- Environment: Production env vars via Vercel dashboard
- Domains: colouringbook.app (or similar)
- Edge: API routes run as serverless functions
- Cron: Vercel Cron for daily counter resets + cost aggregation

Alternative (for cost control at scale):
- Docker container on Railway / Fly.io
- More predictable pricing at high volume
- Better for long-running PDF compilation jobs

-----

## 12. Cost Projections

Assuming 1,000 users, 60% free / 30% Pro / 10% Creator:

| Item | Monthly Volume | Unit Cost | Monthly Cost |
|------------------------|---------------------|--------------|------------------|
| Free tier generations | 600 users × 20 pages | $0.01 (low) | $120 |
| Pro tier generations | 300 users × 200 pages | $0.04 (medium) | $2,400 |
| Creator tier generations | 100 users × 800 pages | $0.04–$0.17 | $3,200–$13,600 |
| R2 Storage (est. 500GB) | — | ~ $7.50/mo | $8 |
| Vercel hosting | — | — | $20 |
| Database (Turso) | — | — | $0–$29 |
| **Total estimated** | | | **$5,750–$16,050** |

Revenue needed to break even:
- 300 Pro users × £5 = £1,500
- 100 Creator users × £15 = £1,500
- Total: £3,000/mo — needs additional revenue or tighter cost controls

Key insight:
The cost-to-revenue gap suggests starting with GPT Image 1 Mini (Low: $0.005) for free tier, and only using Medium/High for paid users. This reduces estimated API cost by ~60%.
