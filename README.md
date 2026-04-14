# RSS Reader

A modern, publicly accessible RSS feed reader built with Next.js and deployed on Vercel. Feed URLs are managed in a local config file and pushed to GitHub. The app is read-only and public — no authentication, no write operations.

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

### Public feeds

Edit `feeds.public.json` at the project root. Each entry has a `url` and `category`:

```json
[
  {
    "url": "https://example.com/feed.xml",
    "category": "Tech"
  }
]
```

The file is validated against a JSON Schema by a pre-commit hook and in CI. Invalid changes will be rejected.

### Private feeds

For feeds you don't want visible in the repo:

1. Create `feeds.private.json` locally (already in `.gitignore`) with the same format
2. On Vercel, set the `PRIVATE_FEEDS` environment variable to the JSON string contents of your private feeds config via the Vercel dashboard — never set secrets directly in the terminal

## Admin Page (dev only)

A local feed management UI is available during development at `http://localhost:3000/admin`.

Start the dev server (`npm run dev`) and navigate to `/admin` — it is not available in production builds.

### What it does

- **Add feeds** — fill in name, URL (must start with `https://`), and category, then click Add Feed
- **Edit feeds** — click Edit on any row to modify inline; Save or Cancel to confirm
- **Delete feeds** — click Delete; confirms before removing
- **Commit & Push** — once you've made changes, click "Commit & Push" to stage `feeds.public.json`, commit, and push to the current branch. Vercel will auto-deploy from that branch.

All changes write directly to `feeds.public.json`. Run `npm run validate-feeds` at any time to confirm the file is still valid.

The `/admin` route returns "Not available in production" when `NODE_ENV === 'production'`, and the admin API endpoints return 403.

## Merge Workflow

All development flows through the `preview` branch before reaching `main`:

1. Push changes to the `preview` branch
2. Verify the Vercel preview deployment works correctly
3. Open a PR from `preview` to `main`
4. Wait for CI to pass (feed validation, audit, type check, build)
5. Merge the PR
6. Verify the production deployment on Vercel
7. Delete the preview deployment from the Vercel dashboard (free tier only allows limited deployments)

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
