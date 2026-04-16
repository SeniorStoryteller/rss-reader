# All Things AI

A curated RSS feed reader built with Next.js and deployed on Vercel. Feed URLs are managed in a local config file and pushed to GitHub. The app is read-only and public — no authentication, no write operations from the public-facing side.

**Production URL:** `https://rss-reader-three-omega.vercel.app`

The repo name is still `rss-reader` for historical reasons; the site itself is branded "All Things AI".

## Tech Stack

- **Next.js 14.x (Pages Router)** — deliberately chosen to avoid CVE-2025-55182, a CVSS 10.0 RCE in React Server Components confirmed in the wild. Do not upgrade to Next.js 15.x or 16.x.
- **TypeScript** — compile-time type safety for feed parsing, config validation, and UI components
- **Tailwind CSS** — utility-first styling with no runtime overhead
- **Vercel** — deployment with automatic TLS, edge caching, and preview deployments

## Local Development

```bash
# Install dependencies
npm ci

# Start dev server
npm run dev
```

The app runs at `http://localhost:3000`.

## Managing Feeds

### Admin page (dev only)

The easiest way to manage feeds is via the built-in admin UI. Start the dev server and navigate to `http://localhost:3000/admin`. A **Manage Feeds** link also appears in the sidebar in dev mode.

- **Add** — fill in name, URL (`https://` required), and category
- **Edit** — click Edit on any row to modify inline
- **Delete** — click Delete; confirms before removing
- **Commit & Push** — commits `feeds.public.json` and pushes directly to `main`, triggering a Vercel production deployment. The button is disabled until a change has been made.

The admin page and its API routes return 403 / "Not available" in production. The sidebar link is not rendered in production builds.

### Manual editing

Edit `feeds.public.json` at the project root directly. Each entry requires `name`, `url`, and `category`:

```json
[
  {
    "name": "Example Feed",
    "url": "https://example.com/feed.xml",
    "category": "Tech"
  }
]
```

The file is validated against `feeds.schema.json` by a pre-commit hook and in CI. Invalid changes will be rejected. After editing, commit and push to `main` to deploy.

### Private feeds

For feeds you don't want visible in the repo:

1. Create `feeds.private.json` locally (already in `.gitignore`) with the same format
2. On Vercel, set the `PRIVATE_FEEDS` environment variable to the JSON string contents of your private feeds config via the Vercel dashboard — never set secrets directly in the terminal

## Per-Source Logos

Cards without a feed-supplied image show a black banner. To use a custom logo for a source:

1. Add the logo image to `public/` (e.g. `public/Logo - My Source.png`)
2. Add one entry to the `SOURCE_LOGOS` map in `src/components/ArticleCard.tsx`:

```ts
const SOURCE_LOGOS: Record<string, string> = {
  "Source Name As It Appears On Cards": '/Logo%20-%20My%20Source.png',
};
```

The source name must match `item.source` exactly (visible in small text above each article title).

Currently configured:

| Source name | File |
|---|---|
| Lenny's Podcast | `Logo - Lennys Podcast.png` |
| Wyndo | `Logo - AI Maker.png` |
| The AI Daily Brief | `Logo - AI Daily Brief.jpg` |
| Hard Fork | `Logo - Hard Fork.png` |
| Practical AI | `Logo - Practical AI.webp` |
| AI in Business | `Logo - AI in Business.png` |
| OpenAI News | `Logo - OpenAI.jpg` (feed not currently active) |

## Caching & Rendering

The home page and category pages use **Incremental Static Regeneration (ISR)** with `revalidate: 300`. Pages are pre-rendered at build time with feed data baked into the HTML, then regenerated every 5 minutes in the background. First-byte is served instantly from Vercel's CDN — no client-side fetch waterfall.

The `/api/feeds` endpoint (still used by the admin page and as a fallback) uses `s-maxage=300` with an in-memory 60-second dedup cache.

### Feed item cap

Each feed is capped at 20 items (`MAX_ITEMS_PER_FEED` in `src/lib/rss.ts`). This prevents high-volume archives from dominating the combined feed — OpenAI's blog RSS, for example, returns 900+ items in a single fetch.

### HTML sanitization

Feed descriptions pass through `sanitize-html` with a strict tag/attribute allowlist. Non-HTTPS `src` attributes on images are stripped.

## Merge Workflow

Direct pushes to `main` are used for routine changes (feed edits, UI tweaks). Branch protection is in place but `enforce_admins` is `false`, so the repo owner can push directly.

For larger changes that should go through CI:

1. Push changes to the `preview` branch
2. Open a PR from `preview` to `main`
3. Wait for CI to pass (feed validation, audit, type check, build)
4. Merge the PR
5. Verify the production deployment on Vercel

The `preview` branch is permanent — never delete it.

## CI Pipeline

On every PR targeting `main`, GitHub Actions runs:

1. `npm run validate-feeds` — validates `feeds.public.json` against JSON Schema
2. `npm audit --audit-level=critical` — checks for critical vulnerabilities
3. `npx tsc --noEmit` — TypeScript type checking
4. `npm run build` — production build

All steps must pass before merging.

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `PRIVATE_FEEDS` | Vercel dashboard only | JSON string of private feed configs |

Never set `PRIVATE_FEEDS` or any secret directly in the terminal. Use `.env.local` for local development and the Vercel dashboard for production.
