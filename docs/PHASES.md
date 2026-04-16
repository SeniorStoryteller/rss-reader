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

---

## Post-Phase 7 Feed & UI Session ✅ Complete

### Feed changes
- **Topic categories** — feeds reclassified into six granular categories: `Claude Code`, `Claude Skills`, `AI Automation`, `AI & Work`, `Product & Strategy`, `AI Critique`
- **"Categories" renamed to "Topics"** — sidebar heading and "All Feeds" link updated to "Topics" / "All Topics" in both `Sidebar.tsx` and `MobileNav.tsx`
- **How to AI restored** — `https://ruben.substack.com/feed` (was lost during category update, re-added to `Claude Code`)
- **New Product & Strategy feeds added:** Hard Fork, The AI Daily Brief, Practical AI, AI in Business
- **No Priors removed** — `feeds.megaphone.fm/nopriors` feed items have no individual article page links (only MP3 enclosures), so articles were unclickable

### Logo additions
All logos live in `public/` and are mapped in `SOURCE_LOGOS` in `src/components/ArticleCard.tsx`:

| Source name (must match exactly) | File |
|---|---|
| Lenny's Podcast | `Logo - Lennys Podcast.png` |
| Wyndo | `Logo - AI Maker.png` |
| The AI Daily Brief | `Logo - AI Daily Brief.jpg` |
| Hard Fork | `Logo - Hard Fork.png` |
| Practical AI | `Logo - Practical AI.webp` |
| AI in Business | `Logo - AI in Business.png` |

### Current feed list (17 feeds)

| Name | Category |
|---|---|
| How to AI | Claude Code |
| Michael Crist | Claude Code |
| Senior Storyteller | Claude Code |
| Claude Skill of the Week | Claude Skills |
| Response Awareness Methodology | Claude Skills |
| Wyndo | AI Automation |
| Automato | AI Automation |
| One Useful Thing | AI & Work |
| Future-Proof Your Career with AI | AI & Work |
| Lenny's Podcast | Product & Strategy |
| Hard Fork | Product & Strategy |
| The AI Daily Brief | Product & Strategy |
| Practical AI | Product & Strategy |
| AI in Business | Product & Strategy |
| Gary Marcus | AI Critique |
| Yes, And Also No | AI Critique |

### YouTube RSS note
YouTube provides RSS feeds at `https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID`. The channel ID (format: `UCxxxxxxxxx`) must be found by viewing the channel page source. YouTube feeds use Atom format — articles link correctly but images require either a logo entry in `SOURCE_LOGOS` or custom `media:group` thumbnail parsing in `src/lib/rss.ts`.

---

## Post-Phase 7 "All Things AI" Rebrand + Performance Session ✅ Complete

### Branding
- **Site renamed** to "All Things AI" — updated page titles, `<Head>` meta tags, OG tags, and page header (`h1` bumped from `text-xl` to `text-4xl`) across `index.tsx`, `category/[slug].tsx`, `404.tsx`, `500.tsx`, and `Layout.tsx`

### Layout & navigation
- **Search bar moved** from the header to the left sidebar (desktop) and MobileNav drawer (mobile). `Layout.tsx` passes search props to both `Sidebar.tsx` and `MobileNav.tsx`
- **Sticky sidebar** — `sticky top-6 self-start` on the desktop aside, so topics stay visible while scrolling
- **Active nav state redesigned** — replaced `bg-blue-50` fill with a left border accent (`border-l-2 border-orange-400 pl-[10px] font-semibold text-white`) to stop the active topic from looking like a form input

### Card restructure (horizontal single-column)
- `ArticleCard.tsx` — horizontal layout: `w-1/3 shrink-0 bg-black` image panel on left, content panel on right. Title bumped to `text-2xl font-bold` with `line-clamp-2`. Description rendered directly (no JS truncation) with `line-clamp-3`. Fixed card height `h-[220px]` with `overflow-hidden` to keep rows uniform
- **Block link pattern** — the title `<a>` carries `after:absolute after:inset-0` so the entire card is clickable while the category pill sits above with `relative z-10`
- **Image display** — `object-contain` on the `<img>` so wide OG images render fully with letterbox rather than being cropped mid-word. The black panel background fills the letterbox cleanly
- **Relative dates** — `formatDisplayDate()` uses `date-fns` `differenceInHours` / `differenceInDays`: `Xh ago` → `Yesterday` → `2 days ago` → `EEE yyyy-MM-dd` for anything older
- `SkeletonCard.tsx` — reshaped to match the horizontal layout so the loading state matches what lands
- `index.tsx` / `category/[slug].tsx` — grid replaced with `flex flex-col gap-4` (single column, scrollable archive)

### Feed management
- **`MAX_ITEMS_PER_FEED = 20`** in `src/lib/rss.ts` — safeguard against archive floods. OpenAI's blog feed returned 937 items which is why the constant exists
- **OpenAI News** added then removed (too high volume even with the cap). `Logo - OpenAI.jpg` and its `SOURCE_LOGOS` entry left in place for future use

### Performance — first-load optimization
- **ISR (Incremental Static Regeneration)** — `index.tsx` and `category/[slug].tsx` now use `getStaticProps` with `revalidate: 300`. `getStaticPaths` pre-renders all category slugs at build time. HTML arrives with feed data baked in, eliminating the client-side fetch waterfall. First-load went from 2–5 seconds (skeleton) to instant from CDN
- **`FeedDataProvider` accepts optional `initialData`** — skips the client fetch when SSG data is provided. `_app.tsx` passes `pageProps.initialFeedData` through. Admin page (no `getStaticProps`) still client-fetches for the admin API
- **jsdom + DOMPurify → `sanitize-html`** — removed ~200MB of server dependencies. `sanitize-html` is a drop-in replacement with equivalent tag/attribute/scheme policies and the same non-HTTPS `src` stripping. Major cold-start win on Vercel
- `rss.ts` now conditionally spreads `imageUrl` (omits the key when absent) so `getStaticProps` can serialize to JSON — `undefined` breaks SSG serialization

### Current feed list (16 feeds)

| Name | Category |
|---|---|
| How to AI | Claude Code |
| Michael Crist | Claude Code |
| Senior Storyteller | Claude Code |
| Claude Skill of the Week | Claude Skills |
| Response Awareness Methodology | Claude Skills |
| Wyndo | AI Automation |
| Automato | AI Automation |
| One Useful Thing | AI & Work |
| Future-Proof Your Career with AI | AI & Work |
| Lenny's Podcast | Product & Strategy |
| Hard Fork | Product & Strategy |
| The AI Daily Brief | Product & Strategy |
| Practical AI | Product & Strategy |
| AI in Business | Product & Strategy |
| Gary Marcus | AI Critique |
| Yes, And Also No | AI Critique |

### Deferred for a future session
- **Search analytics** — user chose Vercel Web Analytics `track()` custom events in `SearchBar.tsx` (fire on settled queries ≥3 chars after debounce). Not built yet. See memory: `project_analytics.md`
- **Reader-submitted feed suggestions** — discussed: a public form that fetches the feed, calls the Claude API to evaluate relevance/safety, and notifies the admin. Not built yet. Key considerations: SSRF protection on URL fetch, `ANTHROPIC_API_KEY` on Vercel, notification channel (email via Resend or GitHub issue)
