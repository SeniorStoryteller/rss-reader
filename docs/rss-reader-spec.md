# RSS Feed Reader — Build Specification

**Version:** 1.3  
**Date:** April 13, 2026  
**Purpose:** Complete, self-contained specification for Claude Code. Every decision includes what was chosen, why, and what was considered and rejected.

---

## Project Overview

A modern, publicly accessible RSS feed reader deployable on Vercel. Feed URLs are managed locally in a config file and pushed to GitHub. The app is read-only and public — no authentication, no write operations.

---

## Tech Stack

### Framework: Next.js 14.x with Pages Router

**Chosen because:** Next.js 14.x stable with Pages Router is confirmed unaffected by CVE-2025-55182, a critical CVSS 10.0 unauthenticated remote code execution vulnerability in the React Server Components Flight protocol. Exploitation requires a single crafted HTTP request with no prerequisites and was confirmed in the wild within 24 hours of disclosure in December 2025.

**Rejected:** Next.js 15.x/16.x with App Router. Although patched versions exist, this CVE class has already produced multiple follow-on CVEs (CVE-2025-55183, CVE-2025-55184, CVE-2025-67779, CVE-2026-23864). For a simple read-only app, the App Router provides no meaningful benefit that justifies carrying this attack surface.

**Rejected:** Plain HTML with Vercel serverless functions. Viable but lacks the structured routing, TypeScript integration, and build pipeline that make the project maintainable long-term.

### Language: TypeScript

**Chosen because:** Compile-time type safety catches feed parsing errors, malformed config shapes, and API contract violations before deployment. The entire project including config validation, feed parsing, and UI components uses TypeScript.

### Styling: Tailwind CSS

**Chosen because:** Utility-first CSS with no runtime overhead, compatible with `script-src 'self'` CSP. Requires `style-src 'unsafe-inline'` in the CSP — this is a known, accepted trade-off. CSS injection is far less dangerous than script injection and there is no separate injection vector in this app.

### Deployment: Vercel

**Chosen because:** Native Next.js support, automatic TLS, edge caching for the feed API route, and preview deployments for the staging workflow.

---

## Feed Management

### Config Files

Two files manage feed URLs:

**`feeds.public.json`** — committed to the repository. Visible on GitHub. Contains all public feed URLs.

**`feeds.private.json`** — listed in `.gitignore`. Never committed. Contains private or authenticated feed URLs. Passed to Vercel as an environment variable (`PRIVATE_FEEDS`) containing the JSON string. At build time, the app merges both files if `feeds.private.json` exists locally or if `PRIVATE_FEEDS` is set in the environment.

**CRITICAL — Order of operations:** `.gitignore` must be created and committed before `feeds.private.json` is created. If `feeds.private.json` is created first and `git add .` is run before `.gitignore` is in place, Git will track the file. Deleting it afterward does not remove it from Git history — the content is permanently recoverable from the commit log and requires a full history rewrite to eliminate. Claude Code must generate and commit `.gitignore` as the first file in the repository, before any other files are created.

**Schema (identical for both files):**

```json
[
  {
    "name": "Hacker News",
    "url": "https://news.ycombinator.com/rss",
    "category": "Tech"
  }
]
```

All three fields are required. The `url` field must begin with `https://`. HTTP feed URLs are rejected at validation time.

**Rejected:** A single `feeds.json` — would require either committing private feed URLs to the repo or restructuring the file for every deployment.

**Rejected:** JS/TS config file — adds a build step for no gain over plain JSON.

**Rejected:** Markdown file — requires a custom parser with no benefit.

### Validation

A JSON Schema validates both config files. Validation runs in two places:

1. **Pre-commit hook** via `husky` — blocks the commit locally if `feeds.public.json` is malformed
2. **GitHub Actions CI pipeline** — first step before any build or audit

The validator uses `ajv`. If validation fails at either stage, the pipeline stops. A malformed config never reaches Vercel.

**Important:** The pre-commit hook is a convenience, not a security gate. It can be bypassed with `git commit --no-verify`. The CI pipeline is the authoritative enforcement point. Never treat a passing local hook as a substitute for CI passing.

---

## Security

### Content Security Policy

Applied via `next.config.ts` response headers on all routes:

| Directive | Value | Reason |
|---|---|---|
| `default-src` | `'self'` | Baseline — nothing loads unless explicitly allowed |
| `script-src` | `'self'` | No inline scripts, no third-party scripts |
| `style-src` | `'self' 'unsafe-inline'` | Required for Tailwind; CSS injection risk accepted |
| `img-src` | `'self' https:` | Allows feed images from HTTPS sources only; `data:` URIs blocked to prevent tracking pixels |
| `connect-src` | `'self'` | Browser API calls to own origin only |
| `font-src` | `'self'` | Restricts font loading to same origin; prevents injection of external fonts |
| `frame-ancestors` | `'none'` | Prevents clickjacking via iframe embedding |
| `base-uri` | `'self'` | Prevents `<base>` tag injection attacks |

### HSTS

```
Strict-Transport-Security: max-age=63072000; includeSubDomains
```

### Additional Security Headers

```
X-Content-Type-Options: nosniff
```

Prevents browsers from MIME-sniffing responses away from the declared `Content-Type`, mitigating drive-by download attacks. Applied via `next.config.ts` alongside the CSP and HSTS headers.

**Note on `preload`:** The `preload` directive is intentionally omitted from the initial deployment. Once a domain is submitted to browser HSTS preload lists, removal is slow and difficult. Add `preload` only after confirming long-term commitment to HTTPS on the chosen domain. This is a conscious decision, not an oversight.

### Feed Content Sanitization

All HTML content from feed descriptions is sanitized server-side using DOMPurify before being passed to the client. No raw feed HTML is ever rendered via `dangerouslySetInnerHTML`.

DOMPurify requires a DOM environment. On the server (Node.js), `jsdom` provides this. The `sanitize.ts` module initializes a `JSDOM` instance and passes its `window` to `DOMPurify` at module load.

DOMPurify is configured with a custom `ALLOWED_ATTR` list that strips any `src` attribute value that does not begin with `https://`. This applies to all tags including `img`, `source`, and `iframe` (which is also removed entirely).

**Rejected:** Rendering raw feed HTML — direct XSS vector via malicious feed content.

**Rejected:** Client-side sanitization only — sanitization must happen before data leaves the server.

### Image Handling

Images in feed content are allowed subject to these constraints:

- Only `https://` source URLs are permitted — enforced by both DOMPurify sanitization and `img-src https:` CSP
- HTTP image sources are stripped during sanitization
- `data:` URI images in feed content are stripped (tracking pixel vector)
- `data:` URIs are also blocked at the CSP level as a defence-in-depth measure

**Known accepted risk:** The `img-src https:` allowance permits images from any HTTPS domain. This means a malicious feed author could embed tracking pixels via HTTPS image URLs. This leaks user IP addresses to the image host. This is a known, accepted trade-off for a public read-only feed reader where proxying images was rejected due to SSRF risk.

**Rejected:** Server-side image proxy — reintroduces SSRF attack surface.

**Rejected:** Stripping all images — degrades the reading experience contrary to stated requirements.

### External Links

All outbound links use `rel="noopener noreferrer"` and `target="_blank"`. There is no article proxy endpoint. Articles open at their original source URL.

**Rejected:** Article proxy/reader endpoint — SSRF risk, significant attack surface for a feature the user did not require.

### RSS Parser Library

No current Node.js RSS parsing library has documented, audited protection against XXE injection or billion laughs XML entity expansion attacks.

**Selected: `rss-parser`** — actively maintained, no known CVEs in Snyk or GitHub Advisory Database, does not use `eval` or dynamic code execution internally, source-readable and auditable. Handles both RSS 2.0 and Atom feeds.

Regardless of library chosen, feed XML is pre-processed before parsing to strip DOCTYPE declarations and external entity references, removing the XXE vector at the input level before the parser sees the content.

### Dependency Security

- All dependencies pinned to exact versions in `package.json` — no `^` or `~` prefixes
- `package-lock.json` committed to the repository — never `.gitignore`d
- Vercel build uses `npm ci` — fails if lockfile does not match `package.json`
- Dependabot enabled via `.github/dependabot.yml` — opens PRs for vulnerability advisories
- `npm audit --audit-level=high` runs as second step in CI pipeline after config validation — a high or critical finding fails the pipeline before Vercel receives the build

**Local install safety:** When installing dependencies locally for the first time, use `npm install --ignore-scripts`. This prevents packages from executing arbitrary code via `postinstall` scripts on your local machine. npm packages can run scripts at install time with your user's full privileges — pinned versions reduce but do not eliminate this risk. After the initial install, audit any packages that legitimately require install scripts before enabling them individually.

---

## Accessibility

- Semantic HTML landmarks: `<nav>`, `<main>`, `<article>`, `<aside>`
- Skip-to-content link as the first focusable element in `_app.tsx` (not `_document.tsx`, which lacks React interactivity)
- All interactive elements fully keyboard-navigable (Tab, Enter, Escape for modals/menus)
- ARIA labels on icon-only buttons: dark mode toggle, mobile menu hamburger, search clear
- Minimum 4.5:1 color contrast ratio (WCAG AA) in both light and dark themes
- Feed error notices use `role="alert"` for screen reader announcement
- Visible focus indicators (`:focus-visible` ring) on all interactive elements
- Search results announced to screen readers via `aria-live="polite"` region

---

## Feed Fetching

### Architecture

Feed fetching happens exclusively server-side in a Pages Router API route (`/api/feeds`). Feed URLs never reach the browser.

### Failure Handling

Each feed is fetched independently. The implementation uses `Promise.allSettled()` — not `Promise.all()`. A single failed feed does not affect the others.

Each individual feed fetch has a hard 5-second timeout enforced via `AbortController`. A feed that hangs does not hold up the entire fetch cycle.

The API response includes:
- `items` — successfully fetched and parsed feed entries
- `failed` — array of feed names and error reasons for feeds that did not return

Failed feeds are surfaced in the UI as an unobtrusive notice. They are not silently dropped.

**Rejected:** `Promise.all()` — fails fast on any single rejection, causing total failure from one bad feed.

### Caching

The `/api/feeds` route sets:

```
Cache-Control: s-maxage=3600, stale-while-revalidate
```

Vercel's edge network serves the cached response without invoking the function for the duration of the cache window.

A module-level timestamp in the function tracks the last successful fetch. Requests arriving within 60 seconds of the last fetch receive the cached result immediately without re-fetching upstream sources. This protects against cache bypass and runaway invocation costs.

**Limitation:** The module-level timestamp is per-instance. Vercel may spawn multiple function instances under load, each with an independent timestamp. The edge cache (`s-maxage=3600`) is the authoritative rate limiter; the in-memory dedup is a best-effort secondary layer, not a guarantee.

---

## Date and Timestamp Handling

All feed dates are normalised to UTC millisecond timestamps at parse time. `rss-parser` returns both `pubDate` (raw string) and `isoDate` (pre-parsed ISO 8601 string) on each item. The `dates.ts` module uses a three-step parse:

1. Use `isoDate` from `rss-parser` if present — already ISO 8601, parsed via `date-fns/parseISO`
2. If `isoDate` is missing, fall back to raw `pubDate` — replace common timezone abbreviations (`GMT`→`+0000`, `EST`→`-0500`, `CST`→`-0600`, `MST`→`-0700`, `PST`→`-0800`, `EDT`→`-0400`, `CDT`→`-0500`, `MDT`→`-0600`, `PDT`→`-0700`, `UT`→`+0000`) with numeric offsets, then parse via `date-fns/parse` with format `EEE, dd MMM yyyy HH:mm:ss xx`
3. If both fail, assign timestamp `0`

Feed items with unparseable dates are assigned a timestamp of `0` and sort to the bottom of the chronological feed rather than throwing an error.

The UI displays dates in relative format ("2 hours ago"). The full UTC timestamp is available on hover as a `title` attribute.

---

## Features

### Default View

All feeds merged and displayed in reverse chronological order — newest items first across all sources.

### Category View

Each category defined in `feeds.public.json` and `feeds.private.json` gets a filtered view at `/category/[slug]`. Categories are surfaced in the sidebar navigation.

### Search

Client-side search across all fetched feed items. Search runs against already-fetched data — no additional server requests. Searches title, description, and source name fields.

### Dark Mode

Implemented via Tailwind's `dark:` classes. System preference is respected by default. Manual toggle available in the UI.

### Design

Contemporary, clean, easy to navigate. Sidebar for category navigation. Main content area for feed items. Article cards show title, source, category badge, relative date, and description excerpt.

### Error Handling

- `src/pages/404.tsx` — static "page not found" page with link back to home
- `src/pages/500.tsx` — static server error page; no stack traces exposed to users
- `src/components/ErrorBoundary.tsx` — React error boundary wrapping content in `_app.tsx`; shows a friendly message with retry option on unhandled client-side errors

### Loading States

Skeleton placeholder cards display while `/api/feeds` is in flight. `src/components/SkeletonCard.tsx` mirrors the dimensions of `ArticleCard`. Index and category pages render 6 skeleton cards during the initial fetch. The skeleton uses Tailwind's `animate-pulse`.

### Responsive Layout

The layout is fully responsive:

- **Mobile (<768px):** Sidebar collapses to a hamburger menu overlay. Article cards stack single-column. Navigation via `src/components/MobileNav.tsx`.
- **Tablet (768–1024px):** 2-column card grid, sidebar visible.
- **Desktop (>1024px):** 3-column card grid, sidebar visible.
- All interactive elements have minimum 44×44px touch targets (WCAG 2.1 SC 2.5.5).

### Metadata & SEO

- Static favicon at `public/favicon.ico` and `public/favicon.svg`
- `<html lang="en">` attribute set in `_document.tsx`
- Page titles via Next.js `<Head>`: "RSS Reader" on index, "{Category} — RSS Reader" on category pages
- Meta description on all pages
- Open Graph tags: `og:title`, `og:description`, `og:type` (website)

---

## Deployment Workflow

### Branch Structure

Two permanent branches:

- `preview` — staging environment. Every push triggers a Vercel preview deployment at a unique URL.
- `main` — production. Only receives merges from `preview` via pull request.

No other long-lived branches. GitHub branch protection is configured to auto-delete branches after a pull request is merged.

### CI Pipeline Order

The following steps run in strict order on every pull request from `preview` to `main`. If any step fails, the pipeline stops and Vercel does not receive the build:

1. Validate `feeds.public.json` against JSON Schema
2. `npm audit --audit-level=high`
3. TypeScript type check
4. Build

### Merge Checklist (to be included in README)

1. Push changes to `preview` branch
2. Verify the Vercel preview deployment URL looks and functions correctly
3. Open a pull request from `preview` into `main`
4. Confirm all CI steps pass
5. Merge the pull request
6. On Vercel free tier: manually delete the preview deployment from the Vercel dashboard

### Preview Deployment Cleanup

Vercel retains preview deployments indefinitely on the free tier. Preview deployments are accessible to anyone with the URL and may reflect intermediate app states. Manual deletion after each merge is the required practice on the free tier, documented in the merge checklist above. On Vercel Pro, automatic retention limits can be configured.

### Environment Variables

| Variable | Location | Purpose |
|---|---|---|
| `PRIVATE_FEEDS` | Vercel environment settings | JSON string of private feed config |

No other environment variables are required for baseline operation.

**Local environment variable safety:** Never set `PRIVATE_FEEDS` or any sensitive value directly in the terminal via `export VARIABLE=value`. Terminal commands are written to shell history files (`.bash_history`, `.zsh_history`) in plain text. If the machine is compromised or history files are synced, the values are exposed.

Instead, set local environment variables exclusively via a `.env.local` file. This file must be listed in `.gitignore` — see the `.gitignore` requirements below.

### .gitignore Requirements

The following entries are mandatory in `.gitignore`. Claude Code must include all of these before any other files are created:

```
feeds.private.json
.env
.env.local
.env.*.local
.env.development.local
.env.test.local
.env.production.local
```

Next.js projects created with `create-next-app` include some of these by default, but the presence of all entries must be verified explicitly — never assumed.

---

## Project Structure

```
rss-reader/
├── .gitignore                  ← FIRST FILE COMMITTED — before any sensitive files exist
├── .github/
│   ├── dependabot.yml
│   └── workflows/
│       └── ci.yml
├── .husky/
│   └── pre-commit
├── .env.local                  ← in .gitignore — never committed
├── feeds.public.json
├── feeds.private.json          ← in .gitignore — never committed
├── feeds.schema.json           ← JSON Schema for validation
├── package.json                ← exact version pins, no ^ or ~
├── package-lock.json           ← committed, never .gitignored
├── next.config.ts              ← security headers, CSP, HSTS, nosniff
├── postcss.config.js            ← PostCSS config for Tailwind
├── tailwind.config.ts
├── tsconfig.json
├── public/
│   ├── favicon.ico
│   └── favicon.svg
├── src/
│   ├── pages/
│   │   ├── _app.tsx            ← wraps content in ErrorBoundary, skip-to-content link
│   │   ├── _document.tsx       ← lang="en"
│   │   ├── index.tsx           ← chronological merged feed
│   │   ├── 404.tsx             ← static not-found page
│   │   ├── 500.tsx             ← static server error page
│   │   ├── category/
│   │   │   └── [slug].tsx      ← filtered by category
│   │   └── api/
│   │       └── feeds.ts        ← server-side fetch, parse, cache
│   ├── components/
│   │   ├── ArticleCard.tsx
│   │   ├── ErrorBoundary.tsx   ← React error boundary with retry
│   │   ├── FeedErrorNotice.tsx ← role="alert" for screen readers
│   │   ├── MobileNav.tsx       ← hamburger menu for <768px
│   │   ├── SearchBar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── SkeletonCard.tsx    ← loading placeholder, animate-pulse
│   │   └── CategoryBadge.tsx
│   ├── styles/
│   │   └── globals.css         ← @tailwind directives, imported by _app.tsx
│   └── lib/
│       ├── rss.ts              ← fetch, pre-process, parse feeds
│       ├── sanitize.ts         ← DOMPurify + jsdom configuration
│       ├── dates.ts            ← RFC 822 + ISO 8601 date parsing
│       ├── feeds.ts            ← merge public + private config
│       └── types.ts
└── README.md
```

---

## Dependencies (to be pinned at exact versions)

| Package | Purpose |
|---|---|
| `next` | Framework — pin to 14.x stable |
| `react` | UI — pin to version compatible with Next.js 14.x |
| `react-dom` | UI |
| `typescript` | Language |
| `tailwindcss` | Styling |
| `autoprefixer` | PostCSS vendor prefixing — required peer of Tailwind v3 |
| `postcss` | CSS transformation pipeline — required by Tailwind |
| `dompurify` | Feed content sanitization |
| `@types/dompurify` | TypeScript types |
| `date-fns` | Date normalisation |
| `ajv` | JSON Schema validation |
| `husky` | Pre-commit hooks |
| `rss-parser` | RSS 2.0 and Atom feed parsing |
| `jsdom` | DOM environment for server-side DOMPurify |
| `@types/jsdom` | TypeScript types for jsdom |

---

## Known Accepted Risks

These risks were evaluated and deliberately accepted rather than overlooked:

1. **Tracking pixels via HTTPS images** — feed authors can embed HTTPS image URLs that log user IPs. Accepted because proxying images introduces SSRF risk, which is the worse trade-off for this app.

2. **`style-src 'unsafe-inline'`** — required by Tailwind. Accepted because CSS injection requires a separate injection vector this app does not have.

3. **`img-src https:`** — permits images from any HTTPS domain. `data:` URIs are no longer allowed. Accepted as the practical alternative to blocking all external images.

4. **No `preload` on HSTS** — intentionally deferred until domain is confirmed permanent.

5. **RSS parser XXE** — mitigated by pre-processing input to strip DOCTYPE and external entity declarations before parsing. No currently available library provides this protection natively.
