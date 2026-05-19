# RSS Reader — Phase 7: Feed Management UI

Read `rss-reader-spec.md` and `PHASES.md` in the docs folder before starting. This is Phase 7. Phases 1–6 are complete.

Break after each major step and check in before continuing.

## What already exists

- Git repo on `main` branch with `preview` as permanent staging branch
- Next.js 14.x Pages Router, TypeScript, Tailwind CSS
- `feeds.public.json` — 4 starter feeds, validated by `ajv` + `husky` pre-commit hook
- `feeds.schema.json` — JSON Schema (name, url, category; url must start with `https://`; no additional properties)
- `next.config.mjs` — CSP, HSTS, X-Content-Type-Options headers, **production-only**
- GitHub Actions CI pipeline (validate feeds → audit --critical → tsc → build)
- Dependabot (npm, weekly)
- Branch protection on `main` (require PR + CI)
- Vercel Git integration (auto-deploys: PRs get preview URLs, merges to `main` deploy to production)
- Production URL: `https://rss-reader-three-omega.vercel.app`

### Lib layer
- `src/lib/types.ts` — `FeedConfig` (`name`, `url`, `category`), `FeedItem`, `FailedFeed`, `FeedApiResponse`
- `src/lib/feeds.ts` — `getFeeds()` merges public + private config with runtime validation via `isValidFeedConfig()`
- `src/lib/rss.ts` — fetches/parses feeds, XXE mitigation, 5s timeout, `Promise.allSettled`
- `src/lib/sanitize.ts` — DOMPurify + jsdom server-side sanitization
- `src/lib/search.ts` — `filterBySearch()` across title, description, source

### Pages
- `src/pages/api/feeds.ts` — API route, `s-maxage=3600`, 60s in-memory dedup
- `src/pages/index.tsx` — homepage
- `src/pages/category/[slug].tsx` — category-filtered view
- `src/pages/404.tsx`, `src/pages/500.tsx` — error pages

### Components
- `Layout`, `ErrorBoundary`, `Sidebar`, `MobileNav`, `SearchBar`, `ThemeToggle`
- `ArticleCard`, `CategoryBadge`, `SkeletonCard`, `FeedErrorNotice`

## Critical decisions made in earlier phases — do not change

**Next.js 14.x Pages Router is a deliberate security decision.** CVE-2025-55182 (React2Shell) is a CVSS 10.0 unauthenticated RCE in React Server Components. Do not upgrade to Next.js 15.x or 16.x.

**`npm audit` uses `--audit-level=critical`** (not high). All remaining high-severity findings are in Next.js features this project does not use.

## What to build in this phase

A local-only admin page for full CRUD operations on feeds. Changes are saved directly to `feeds.public.json`. A built-in "Commit & Push" button deploys changes without leaving the browser.

The admin UI is **development-only** — disabled in production builds. No authentication needed.

### 1. Feed CRUD API — `src/pages/api/admin/feeds.ts`

CRUD endpoint for `feeds.public.json`:

- **GET** — returns the current feeds array
- **POST** — adds a new feed (validates against schema, appends to array, writes file)
- **PUT** — updates an existing feed by index (validates, replaces entry, writes file)
- **DELETE** — removes a feed by index (splices array, writes file)

All mutations:
- Validate the feed entry shape (name, url, category — same rules as `feeds.schema.json`)
- Require `https://` URLs
- Write to `feeds.public.json` using `JSON.stringify(data, null, 2)` with a trailing newline
- Return the updated feeds array
- **Reject all requests when `NODE_ENV === 'production'`** (returns 403)

Reuse: `FeedConfig` type from `src/lib/types.ts`, validation pattern from `isValidFeedConfig()` in `src/lib/feeds.ts`.

### 2. Git API — `src/pages/api/admin/git.ts`

Commit and push endpoint (dev-only, returns 403 in production):

- **POST** — runs `git add feeds.public.json`, commits with an auto-generated message (e.g., "Update feeds: add Ars Technica"), and pushes to the current branch
- Returns success/failure status and the commit hash
- On failure, returns the git error message so the UI can display it

### 3. Admin page — `src/pages/admin.tsx`

Development-only page (returns "Not available" in production via `getServerSideProps`).

**Feed list section:**
- Table or card list of all feeds showing name, URL, category
- Edit and Delete buttons per feed
- Delete should confirm before removing

**Add feed form:**
- Inputs for name, URL, category
- Client-side validation: non-empty fields, `https://` URL
- Add button submits to POST `/api/admin/feeds`

**Edit mode:**
- Inline or modal editing of an existing feed's name, URL, category
- Save submits to PUT `/api/admin/feeds`
- Cancel discards changes

**Commit & Push button:**
- Calls POST `/api/admin/git`
- Disabled when there are no uncommitted changes to `feeds.public.json`
- Shows commit status: success with commit hash, or error message
- After successful push, Vercel auto-deploys from the branch

**Behavior:**
- Fetches feeds from GET `/api/admin/feeds` on mount
- After any mutation, re-fetches to stay in sync
- Shows success/error feedback after each operation

Use existing patterns: `<Layout>` wrapper, `next/head` for meta tags, Tailwind for styling.

### 4. Nav link to admin (dev only)

Add a conditional link in the `<Sidebar>` component that only renders when `process.env.NODE_ENV !== 'production'`. Links to `/admin`.

### 5. Update README

Add a section documenting the admin page:
- How to access it (`npm run dev` → `http://localhost:3000/admin`)
- What it does (add, edit, remove feeds; commit & push)
- That it's dev-only and not available in production

### 6. Commit, push to `preview`, open PR to `main`

Follow the standard merge workflow:
1. Commit all new/modified files on `preview`
2. Push to `preview`
3. Open PR from `preview` → `main`
4. Verify CI passes
5. Merge

## Done when

- `npm run dev` → navigating to `/admin` shows the feed management UI
- Can add a new feed and see it appear in `feeds.public.json`
- Can edit an existing feed and see the change persist in the file
- Can delete a feed and see it removed from the file
- "Commit & Push" button commits `feeds.public.json` and pushes to the current branch
- `/admin` returns "Not available" when running in production mode
- `npm run validate-feeds` passes after all mutations
- `npx tsc --noEmit` — no type errors
- CI passes on the PR
- Sidebar shows admin link in dev mode only
- README documents the admin page
