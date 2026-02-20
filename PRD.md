# Product Requirements Document: Children’s Colouring Book Generator

- Author: Richard  
- Date: 20 February 2026  
- Version: 1.0 — Draft  
- Status: Research Complete / Ready for Review

---

## 1. Executive Summary

A web application that allows parents, teachers, and creators to generate custom children’s colouring book pages on demand using AI image generation. Users describe a scene or theme in natural language, and the system produces clean, print-ready line art suitable for children to colour in.

The product differentiates from existing solutions (ColorBliss, Colorify AI, DZINE) by offering a developer-owned, self-hosted solution with full control over prompt engineering, output quality, and the ability to compile pages into downloadable PDF colouring books.

---

## 2. Problem Statement

Creating custom colouring pages today requires either illustration skills or reliance on generic clip-art. Existing AI colouring page generators are consumer SaaS products with limited customisation, watermarks on free tiers, and no API for integration into other workflows.

Parents and teachers want themed, age-appropriate colouring pages on demand — for birthday parties, classroom topics, or personalised gifts — without design expertise.

---

## 3. Target Users

| Persona | Need | Key Behaviour |
|--------------------|---------------------------------------------------------------|-----------------------------------------------------|
| **Parent** | Quick themed pages for kids (dinosaurs, space, unicorns) | Generates 1–5 pages at a time, prints at home |
| **Teacher** | Curriculum-aligned colouring sheets (letters, history, science) | Batch generates sets of 10–20 pages |
| **Creator / Seller** | Colouring books for Etsy/Amazon KDP | Generates full 20–50 page books with consistent style |
| **Party Planner** | Themed activity sheets for events | Needs fast turnaround, branded/themed pages |

---

## 4. Goals & Success Metrics

| Goal | Metric | Target |
|-----------------|------------------------------------------|-----------------------------------|
| Fast generation | Time from prompt to rendered page | < 15 seconds |
| Print quality | Output resolution | ≥ 2048×2048px, 300 DPI |
| Child-appropriate | Clean line art with no shading/grey areas | > 90% usable without manual cleanup |
| Cost-effective | Per-page generation cost | < $0.05 per page |
| User satisfaction | Pages rated “ready to print” without edits | > 80% of generations |

---

## 5. API Endpoint Research & Recommendation

### 5.1 Candidates Evaluated

| Provider | Model | API Available | Price/Image | Line Art Quality | Notes |
|---------------------|--------------------|:------------------:|----------------------------|----------------|-------------------------------------------------------------------------------------------------|
| **OpenAI** | GPT Image 1.5 | ✅ | $0.01–$0.17 | ★★★★☆ | Best prompt adherence; 3 quality tiers; excellent at following “coloring book” style instructions |
| **OpenAI** | GPT Image 1 Mini | ✅ | $0.005–$0.052 | ★★★☆☆ | Budget option; good for high-volume; slightly less detail |
| **OpenAI** | DALL·E 3 | ✅ | $0.04–$0.08 | ★★★★☆ | Proven reliability; strong content safety; good line art |
| **Black Forest Labs** | FLUX.2 [pro] | ✅ | from $0.03 | ★★★★☆ | Excellent quality; megapixel-based pricing; fast |
| **Black Forest Labs** | FLUX.2 [klein] 4B | ✅ | from $0.014 | ★★★☆☆ | Sub-second generation; cheapest option; good for prototyping |
| **Black Forest Labs** | FLUX.1 Kontext [pro] | ✅ | $0.04 | ★★★★★ | Best for style consistency across pages; image editing support |
| **Leonardo AI** | Phoenix / Lucid | ✅ | ~$0.02–$0.05 (credit-based) | ★★★★★ | Dedicated “Coloring Book” element; purpose-built for this use case |
| **Stability AI** | Stable Diffusion 3.5 | ✅ (self-host or API) | $0.025 or free (self-hosted) | ★★★☆☆ | Open-source; needs ControlNet for best line art; most setup effort |
| **Midjourney** | v7 | ❌ (no public API) | $10–$120/mo | ★★★★★ | Excellent artistic quality but NO API — Discord only |
| **Google** | Imagen 4 | ✅ (Vertex AI) | $0.02–$0.06 | ★★★★☆ | Strong quality; requires Google Cloud setup |

### 5.2 Recommendation: Tiered Approach

**Primary: OpenAI GPT Image 1.5 (Medium quality)**
- Why: Best-in-class prompt adherence, simple REST API, excellent at interpreting “children’s colouring book, clean black line art on white background, no shading” instructions.
- Medium quality at ~$0.04/image hits the sweet spot of cost vs. quality.

**Fallback tier: GPT Image 1 Mini (Low)**
- ~$0.005/image for draft previews before committing to a high-quality render.

**Secondary (future): FLUX.1 Kontext [pro]**
- Why: Superior style consistency when generating multi-page books where characters need to look the same across pages.
- The image editing capability also enables “generate base character → place in different scenes” workflows.

**Ruled Out**
- Midjourney — no API
- Stable Diffusion self-hosted — too much infrastructure overhead for MVP
- Leonardo AI — credit system adds complexity; better as a consumer tool than an API backend

### 5.3 Prompt Engineering Strategy

The key to reliable colouring page output is a well-engineered system prompt. Based on research, the optimal prompt structure is:

> Children’s colouring book page. Simple black line art on pure white background. Clean outlines only, no shading, no gradients, no grey tones, no colour fill. Thick bold lines suitable for young children to colour with crayons. [USER’S SCENE DESCRIPTION] Style: friendly, age-appropriate, cartoon illustration. Aspect ratio: square.

Quality modifiers to test:
- “simple” vs “detailed” (age-appropriate complexity)
- “thick lines” vs “fine lines” (motor skill level)
- “single subject centred” vs “full scene” (page complexity)

---

## 6. Core Features (MVP)

### 6.1 Single Page Generator
- Text prompt input with smart defaults (pre-populated system prompt)
- Age range selector (2–4, 5–7, 8–12) that adjusts line complexity
- Preview before download
- Download as PNG (high-res) or PDF (print-ready A4/Letter)

### 6.2 Theme Browser
- Pre-built prompt templates organised by category (Animals, Space, Vehicles, Fantasy, Nature, Alphabet, Numbers)
- One-click generation from template
- User can modify template before generating

### 6.3 Book Compiler
- Select multiple generated pages
- Arrange page order (drag-and-drop)
- Add cover page (with title text)
- Export as multi-page PDF colouring book
- Optional: add page numbers and “Coloured by: ___” footer

### 6.4 Generation History
- Gallery of previously generated pages
- Re-generate with modified prompt
- Favourite / bookmark pages
- Delete unwanted generations

---

## 7. Non-Functional Requirements

| Requirement | Detail |
|------------------|-------------------------------------------------------------------------------|
| **Performance** | Page generation < 15s; UI interactions < 200ms |
| **Availability** | 99.5% uptime (dependent on upstream API) |
| **Security** | API keys server-side only; no client exposure |
| **Content Safety** | All prompts filtered for age-appropriateness; OpenAI’s built-in moderation used |
| **Accessibility** | WCAG 2.1 AA; keyboard navigable; screen reader compatible |
| **Print Quality** | Output ≥ 2048×2048px; PDF at 300 DPI |
| **Cost Control** | Per-user generation limits; rate limiting; cost alerts |
| **Data Privacy** | No user data sold; generated images belong to user; GDPR-compliant |

---

## 8. Future Enhancements (Post-MVP)

1. Photo-to-colouring-page — upload a photo, convert to line art
2. Character consistency — same character across multiple pages (FLUX Kontext)
3. Difficulty slider — fine-grained control over line complexity
4. Text overlay — add educational text (letters, words, numbers) to pages
5. Colouring app — digital colouring directly in-browser
6. Marketplace — share/sell custom colouring books
7. Batch generation API — for teachers/creators who want programmatic access
8. Multi-language support — UI and prompt templates in multiple languages
9. Subscription model — monthly plans with generation allowances

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|-------------------------------|--------------------|-------------------------------------------------------------------------------------------------|
| API provider outage | Users can’t generate | Implement fallback to secondary API (FLUX) |
| Inappropriate content generated | Brand/safety risk | Use OpenAI moderation + custom prompt filtering + output review |
| Cost overrun from abuse | Financial | Per-user rate limits; CAPTCHA on free tier; cost monitoring dashboard |
| Inconsistent line art quality | User frustration | Prompt engineering iteration; quality scoring pipeline; regenerate option |
| IP/copyright concerns | Legal | Clear ToS that AI-generated images have no copyright claim; use APIs with commercial-use licences |

---

## 10. Open Questions

1. Monetisation model: Freemium (X free pages/month) vs. pay-per-page vs. subscription?
2. Hosting: Vercel/Netlify (serverless) vs. VPS vs. container (for cost control)?
3. Target platform: Web-first, or also native mobile app?
4. White-label potential: Should the architecture support multi-tenant / white-label from day one?
5. Print partnership: Integrate with a print-on-demand service (e.g., Lulu, Blurb)?
