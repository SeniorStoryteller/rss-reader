# RSS Reader — Phase 3: Core UI & Layout

Read `rss-reader-spec.md` and `PHASES.md` in the project root before starting. This is Phase 3 of 6. Phases 1 (scaffolding) and 2 (feed engine) are complete.

Break after each major step and check in before continuing.

## What already exists

- Git repo with `.gitignore` committed first
- Next.js 14.x with Pages Router, TypeScript, Tailwind CSS
- `next.config.ts` with security headers (CSP, HSTS, X-Content-Type-Options)
- `feeds.public.json` with starter feeds, validated by `ajv` + `husky` pre-commit hook
- `src/lib/types.ts` — shared TypeScript types
- `src/lib/feeds.ts` — merges public + private config
- `src/lib/rss.ts` — fetches/parses feeds with XXE mitigation, 5s timeout, `Promise.allSettled`
- `src/lib/sanitize.ts` — DOMPurify + jsdom server-side sanitization
- `src/lib/dates.ts` — RFC 822 + ISO 8601 date parsing
- `src/pages/api/feeds.ts` — API route with caching headers and 60s in-memory dedup

## What to build in this phase

### 1. Page shells
- `src/pages/_document.tsx` — set `<html lang="en">`
- `src/pages/_app.tsx` — import `globals.css`, add skip-to-content link as first focusable element, wrap page content in ErrorBoundary

### 2. Error boundary
- `src/components/ErrorBoundary.tsx` — React class component error boundary with friendly message and retry button

### 3. Layout and navigation
- `src/components/Sidebar.tsx` — lists categories from feed data, links to `/category/[slug]`
- `src/components/MobileNav.tsx` — hamburger menu overlay for viewports under 768px, ARIA label on hamburger button

### 4. Feed display components
- `src/components/ArticleCard.tsx` — shows title, source name, category badge, relative date (with full UTC timestamp in `title` attribute on hover), description excerpt, external link with `target="_blank" rel="noopener noreferrer"`
- `src/components/CategoryBadge.tsx` — small styled badge showing category name
- `src/components/SkeletonCard.tsx` — loading placeholder matching ArticleCard dimensions, uses Tailwind `animate-pulse`
- `src/components/FeedErrorNotice.tsx` — displays failed feed names/reasons, uses `role="alert"` for screen readers

### 5. Homepage
- `src/pages/index.tsx` — fetches `/api/feeds`, displays all items in reverse chronological order, shows 6 skeleton cards during loading, shows FeedErrorNotice if any feeds failed
- Responsive grid: 1 column on mobile (<768px), 2 columns on tablet (768-1024px), 3 columns on desktop (>1024px)

## Key requirements from the spec

- Semantic HTML landmarks: `<nav>`, `<main>`, `<article>`, `<aside>`
- All interactive elements: minimum 44x44px touch targets
- Visible focus indicators (`:focus-visible`)
- No `dangerouslySetInnerHTML` with raw feed content — all content is pre-sanitized server-side
- Dark mode classes can be stubbed but full implementation is Phase 4

## Done when

- Homepage displays live feed items from the API
- Responsive layout works across mobile, tablet, and desktop breakpoints
- Skeleton cards show during loading
- Failed feeds appear in an error notice
- Sidebar shows categories extracted from feed data
- Mobile hamburger menu works on small viewports
