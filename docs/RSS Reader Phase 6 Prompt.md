# RSS Reader — Phase 6: CI/CD & Deployment

Read `rss-reader-spec.md` and `PHASES.md` in the docs folder before starting. This is Phase 6 of 6. Phases 1–5 are complete.

Break after each major step and check in before continuing.

## What already exists

- Git repo on `main` branch, Next.js 14.x Pages Router, TypeScript, Tailwind CSS
- `next.config.mjs` — CSP, HSTS, X-Content-Type-Options headers, **production-only** (`process.env.NODE_ENV === 'production'`)
- `feeds.public.json` with 4 starter feeds, validated by `ajv` + `husky` pre-commit hook
- `package.json` — all dependencies pinned to exact versions, no `^` or `~`
- `package-lock.json` — committed, up to date

### Lib layer
- `src/lib/types.ts` — `FeedItem` (includes `imageUrl?: string`), `FailedFeed`, `FeedConfig`, `FeedApiResponse`
- `src/lib/feeds.ts` — merges public + private config with runtime validation
- `src/lib/rss.ts` — fetches/parses feeds, XXE mitigation, 5s timeout, `Promise.allSettled`, extracts featured images from `enclosure`/`media:content`/`media:thumbnail`/content HTML
- `src/lib/sanitize.ts` — DOMPurify + jsdom server-side sanitization
- `src/lib/dates.ts` — RFC 822 + ISO 8601 date parsing
- `src/lib/slugify.ts` — shared slug generation
- `src/lib/search.ts` — `filterBySearch()` across title, description, source

### Hooks
- `src/hooks/useFeedData.ts` — `FeedDataProvider` (self-contained, owns its own fetch lifecycle), `useFeedData()` consumer hook

### Pages
- `src/pages/api/feeds.ts` — API route, `s-maxage=3600`, 60s in-memory dedup
- `src/pages/_document.tsx` — `<html lang="en">`, favicon link tags
- `src/pages/_app.tsx` — skip-to-content link, ErrorBoundary, FeedDataProvider
- `src/pages/index.tsx` — homepage, OG tags
- `src/pages/category/[slug].tsx` — category-filtered view, OG tags
- `src/pages/404.tsx` — standalone not-found page, OG tags
- `src/pages/500.tsx` — standalone server error page, OG tags

### Components
- `Layout`, `ErrorBoundary`, `Sidebar`, `MobileNav`, `SearchBar`, `ThemeToggle`
- `ArticleCard` — renders featured image if present (`loading="lazy" decoding="async"`)
- `CategoryBadge`, `SkeletonCard` (includes image placeholder), `FeedErrorNotice`

### Public
- `public/favicon.ico` — 32×32 generated ICO
- `public/favicon.svg` — orange rounded square with white RSS arcs

## Critical decisions made in earlier phases — do not change

**Next.js 14.x Pages Router is a deliberate security decision.** CVE-2025-55182 (React2Shell) is a CVSS 10.0 unauthenticated RCE in React Server Components, confirmed in the wild. Next.js 14.x Pages Router is unaffected. Do not upgrade to Next.js 15.x or 16.x.

**`npm audit` note:** `npm audit --audit-level=high` will permanently fail because all remaining high-severity findings are in Next.js features this project does not use (Server Components, Image Optimizer, rewrites). The only offered fix is upgrading to Next.js 16, which violates the security architecture. **Use `--audit-level=critical` in the CI workflow.** The real vulnerabilities (DOMPurify XSS, ajv ReDoS) were already patched in Phase 6 prep.

## What to build in this phase

### 1. GitHub Actions CI pipeline — `.github/workflows/ci.yml`

Runs on every pull request targeting `main`. Steps in strict order — if any step fails, the pipeline stops:

1. Validate `feeds.public.json` against JSON Schema (`npm run validate-feeds`)
2. `npm audit --audit-level=critical` — **critical, not high** (see note above)
3. TypeScript type check (`npx tsc --noEmit`)
4. Build (`npm run build`)

Use `npm ci` for dependency installation in the workflow (fails if lockfile doesn't match `package.json`).

### 2. Dependabot — `.github/dependabot.yml`

Configure Dependabot for npm, weekly schedule, targeting `main`.

### 3. Create `preview` branch

Push a `preview` branch from current `main`. This is the permanent staging branch — all development merges to `preview` first, then `preview` → `main` via PR.

### 4. Connect to Vercel and deploy

- Install Vercel CLI: `npm i -g vercel`
- Link the project to Vercel (`vercel link`)
- Set up environment variables on Vercel if needed (`PRIVATE_FEEDS` for private feed config)
- Deploy from `preview` branch to get a preview URL
- Verify the preview deployment: check the browser console for **CSP violations** — the security headers are production-only and have never run in a real browser. This is the first opportunity to catch any issues.

### 5. Open PR from `preview` → `main`

- Verify all CI steps pass
- Merge to `main`
- Verify production deployment on Vercel

### 6. GitHub branch protection

Configure branch protection on `main`:
- Require PR before merging
- Require CI to pass before merge
- Auto-delete head branches after merge

### 7. Write `README.md`

Include:
- Project overview (what it is, tech stack, why Pages Router)
- Local development setup
- How to add or remove feeds (`feeds.public.json`, schema)
- The merge checklist from the spec (push to `preview` → verify preview URL → open PR to `main` → CI passes → merge → delete preview deployment)
- Note on `PRIVATE_FEEDS` environment variable

## Key requirements from the spec

- CI uses `npm ci` — fails if lockfile doesn't match
- `npm audit --audit-level=critical` (not high — see above)
- Dependabot enabled via `.github/dependabot.yml`
- `preview` branch is permanent — never deleted
- Preview deployments on Vercel free tier must be manually deleted after each merge (document this in README)
- Do not set `PRIVATE_FEEDS` or any secret directly in terminal — use `.env.local` locally, Vercel dashboard for production

## Done when

- CI pipeline passes on a PR from `preview` to `main`
- Production deployment is live on Vercel
- Navigating to the production URL shows the RSS reader with live feed data
- Browser console on the production URL shows no CSP violations
- `README.md` documents the merge workflow
- Branch protection is configured on `main`
