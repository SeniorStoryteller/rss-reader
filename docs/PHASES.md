# RSS Feed Reader — Build Phases

Each phase is designed to be completed in a single Claude Code session. Phases build on each other sequentially.

---

## Phase 1: Project Scaffolding & Safety Net

**Goal:** Repository initialized with all safety-critical files in place before any application code exists.

- Initialize git repository
- Create and commit `.gitignore` as the **first commit** (includes `feeds.private.json`, `.env*` entries)
- Scaffold Next.js 14.x project with TypeScript and Pages Router
- Pin all dependencies to exact versions (no `^` or `~`)
- Install dependencies with `--ignore-scripts`
- Configure `tsconfig.json`
- Configure `tailwind.config.ts`, `postcss.config.js`, `globals.css`
- Configure `next.config.ts` with security headers (CSP, HSTS, X-Content-Type-Options)
- Create `feeds.schema.json` (JSON Schema for feed config)
- Create `feeds.public.json` with a few starter feeds
- Set up `ajv` validation script
- Set up `husky` pre-commit hook (validates `feeds.public.json`)
- Verify `.gitignore` covers everything before committing

**Done when:** `npm run build` succeeds, pre-commit hook catches invalid feed config, security headers are in `next.config.ts`.

---

## Phase 2: Feed Engine (Server-Side)

**Goal:** The `/api/feeds` endpoint fetches, parses, sanitizes, and returns feed data.

- Create `src/lib/types.ts` (shared TypeScript types)
- Create `src/lib/feeds.ts` (merge public + private config, validate)
- Create `src/lib/rss.ts` (fetch feeds, XML pre-processing for XXE mitigation, parse with `rss-parser`, 5s timeout via `AbortController`, `Promise.allSettled`)
- Create `src/lib/sanitize.ts` (DOMPurify + jsdom, strip non-HTTPS `src` attributes)
- Create `src/lib/dates.ts` (RFC 822 + ISO 8601 parsing, timezone abbreviation replacement, fallback to timestamp `0`)
- Create `src/pages/api/feeds.ts` (API route with caching headers, 60s in-memory dedup, error/success response shape)
- Test the endpoint manually — verify feeds return, failed feeds appear in `failed` array

**Done when:** Hitting `/api/feeds` returns parsed, sanitized feed items with proper cache headers.

---

## Phase 3: Core UI & Layout

**Goal:** The app renders feed items with proper layout, navigation, and responsive design.

- Create `src/pages/_document.tsx` (`lang="en"`)
- Create `src/pages/_app.tsx` (global styles import, skip-to-content link, ErrorBoundary wrapper)
- Create `src/components/ErrorBoundary.tsx` (React error boundary with retry)
- Create `src/components/Sidebar.tsx` (category navigation)
- Create `src/components/MobileNav.tsx` (hamburger menu for mobile)
- Create `src/components/ArticleCard.tsx` (title, source, category badge, relative date, description excerpt, external link with `rel="noopener noreferrer"`)
- Create `src/components/CategoryBadge.tsx`
- Create `src/components/SkeletonCard.tsx` (loading placeholder with `animate-pulse`)
- Create `src/components/FeedErrorNotice.tsx` (`role="alert"`)
- Create `src/pages/index.tsx` (fetch from `/api/feeds`, render all items chronologically, skeleton loading state, error notice for failed feeds)
- Responsive layout: single column mobile, 2-col tablet, 3-col desktop

**Done when:** Homepage displays live feed items, responsive layout works across breakpoints, skeleton cards show during loading.

---

## Phase 4: Category Pages, Search & Dark Mode

**Goal:** All remaining user-facing features are functional.

- Create `src/pages/category/[slug].tsx` (filtered view by category)
- Create `src/components/SearchBar.tsx` (client-side search across title, description, source name)
- Add `aria-live="polite"` region for search results
- Implement dark mode toggle (Tailwind `dark:` classes, system preference detection, manual toggle)
- Verify 4.5:1 contrast ratio in both themes
- Verify all ARIA labels on icon-only buttons (dark mode toggle, hamburger, search clear)
- Verify keyboard navigation (Tab, Enter, Escape)
- Verify minimum 44x44px touch targets

**Done when:** Category filtering, search, and dark mode all work. Accessibility requirements met.

---

## Phase 5: Error Pages, SEO & Polish

**Goal:** Error handling, metadata, and visual polish are complete.

- Create `src/pages/404.tsx` (static page with link home)
- Create `src/pages/500.tsx` (static page, no stack traces)
- Add favicons (`public/favicon.ico`, `public/favicon.svg`)
- Add `<Head>` metadata on all pages (titles, meta descriptions, Open Graph tags)
- Visual polish pass — spacing, typography, card design
- Verify focus indicators (`:focus-visible`) on all interactive elements
- Verify skip-to-content link functionality

**Done when:** 404/500 pages render correctly, metadata appears in page source, app looks polished.

---

## Phase 6: CI/CD & Deployment

**Goal:** The app is deployed to Vercel with a working CI pipeline and branch protection.

- Create `.github/dependabot.yml`
- Create `.github/workflows/ci.yml` (validate config, npm audit, type check, build)
- Create `preview` branch
- Connect repository to Vercel
- Configure `PRIVATE_FEEDS` environment variable on Vercel (if needed)
- Verify preview deployment works from `preview` branch
- Open PR from `preview` to `main`, verify CI passes
- Merge to `main`, verify production deployment
- Write `README.md` with merge checklist and project overview
- Clean up any preview deployments on Vercel dashboard

**Done when:** Production deployment is live, CI pipeline passes, README documents the workflow.

---

## Phase 7: Feed Management UI ✅ Complete

**Goal:** A local-only admin page for full CRUD operations on feeds, with a one-click deploy button.

### What was built

**API layer**
- `src/pages/api/admin/feeds.ts` — GET/POST/PUT/DELETE for `feeds.public.json`; validates feed shape, writes file with trailing newline, returns updated array; returns 403 in production
- `src/pages/api/admin/git.ts` — POST stages `feeds.public.json`, commits with an auto-generated message, and pushes directly to `main`; returns commit hash or git error; returns 403 in production

**Admin page**
- `src/pages/admin.tsx` — feed table with inline edit, delete (with confirm dialog), add feed form with client-side validation, Commit & Push button with success/error feedback
- Accessible via `http://localhost:3000/admin` in dev only; `getServerSideProps` returns "Not available in production" when `NODE_ENV === 'production'`

**Sidebar**
- Conditional "Manage Feeds" link under an Admin section — rendered only when `NODE_ENV !== 'production'`; never visible on the live site

### Post-Phase 7 UI improvements (same session)

- **Feeds API cache** reduced from `s-maxage=3600` to `s-maxage=300` — feed changes appear on the live site within 5 minutes of a push
- **Article images are clickable** — image, logo banner, and name banner all link to the article
- **Fallback image banners** — cards without a feed image show a black banner; per-source logos are supported via a `SOURCE_LOGOS` map in `ArticleCard.tsx` (currently: Lenny's Podcast, Wyndo/AI Maker)
- **OG/Twitter featured image** — `public/RSS Reader - Featured Image.png` wired up as `og:image` and `twitter:image` using the absolute production URL
- **Publication date** — article cards show actual publish date (`Mon 2026-04-13`) instead of relative time
- **Category pill** — moved to the bottom-right of each card, dark orange with white text, links to the category filter page
- **Darker background** — page background changed to `bg-gray-600` so white cards stand out clearly
- **High-contrast sidebar text** — category and admin labels changed to white (`text-gray-100`) for legibility against the dark background
- **Commit & Push goes directly to `main`** — pushes to `HEAD:main` instead of the current branch; branch protection is bypassed for the repo owner (`enforce_admins: false`)

**Done when:** All of the above is committed to `main`, CI has passed, and the live site at `https://rss-reader-three-omega.vercel.app` reflects all changes.
