# RSS Reader — Phase 5: Error Pages, SEO & Polish

Read `rss-reader-spec.md` and `PHASES.md` in the docs folder before starting. This is Phase 5 of 6. Phases 1–4 are complete.

Break after each major step and check in before continuing.

## What already exists

- Git repo with Next.js 14.x, Pages Router, TypeScript, Tailwind CSS
- `next.config.mjs` with security headers (CSP, HSTS, X-Content-Type-Options), production-only
- `feeds.public.json` with 4 starter feeds (Hacker News, Ars Technica, BBC News, NASA), validated by `ajv` + `husky` pre-commit hook
- `tailwind.config.ts` — `darkMode: 'class'`

### Lib layer
- `src/lib/types.ts` — `FeedItem`, `FailedFeed`, `FeedConfig`, `FeedApiResponse`
- `src/lib/feeds.ts` — merges public + private config with runtime validation
- `src/lib/rss.ts` — fetches/parses feeds with XXE mitigation, 5s timeout, `Promise.allSettled`
- `src/lib/sanitize.ts` — DOMPurify + jsdom server-side sanitization
- `src/lib/dates.ts` — RFC 822 + ISO 8601 date parsing
- `src/lib/slugify.ts` — shared slug generation
- `src/lib/search.ts` — `filterBySearch()` across title, description, source

### Hooks
- `src/hooks/useFeedData.ts` — React Context-based feed data provider; fetches once in `_app.tsx`, shared across all pages via `useFeedData()` hook; exposes `items`, `failed`, `loading`, `categories`

### Pages
- `src/pages/api/feeds.ts` — API route with `s-maxage=3600` caching and 60s in-memory dedup
- `src/pages/_document.tsx` — `<html lang="en">`
- `src/pages/_app.tsx` — imports `globals.css`, skip-to-content link, ErrorBoundary wrapper, `FeedDataProvider` wrapping all pages
- `src/pages/index.tsx` — homepage using `Layout` + `useFeedData`, search filtering, skeleton loading, error notice
- `src/pages/category/[slug].tsx` — category-filtered view using `Layout` + `useFeedData`, "Category not found" handling with link home

### Components
- `src/components/Layout.tsx` — shared shell: header with SearchBar + ThemeToggle + MobileNav, Sidebar, `<main>` wrapper; accepts `categories`, `searchQuery`, `onSearchChange`, `searchResultCount`, `children`
- `src/components/ErrorBoundary.tsx` — class component with `window.location.reload()` retry, dark mode variants
- `src/components/Sidebar.tsx` — category navigation with `aria-current="page"`, dark mode variants
- `src/components/MobileNav.tsx` — hamburger menu with focus trap, Escape key, `role="dialog"`, `aria-modal`, dark mode variants
- `src/components/SearchBar.tsx` — search input with ARIA label, clear button (44x44px), `aria-live="polite"` result announcements, Escape to clear, dark mode variants
- `src/components/ThemeToggle.tsx` — sun/moon toggle (44x44px), system preference detection via `matchMedia`, `localStorage` persistence, applies `dark` class to `<html>`
- `src/components/ArticleCard.tsx` — title, source, category badge, relative date, description excerpt, external link, dark mode variants, WCAG AA contrast verified
- `src/components/CategoryBadge.tsx` — styled badge with dark mode variants
- `src/components/SkeletonCard.tsx` — loading placeholder with `animate-pulse`, dark mode variants
- `src/components/FeedErrorNotice.tsx` — `role="alert"`, dark mode variants

### Styles
- `src/styles/globals.css` — Tailwind directives with `:focus-visible` base styles
- All components have `dark:` variants; 4.5:1 contrast ratio verified in both themes

## What to build in this phase

### 1. Error pages
- `src/pages/404.tsx` — static "page not found" page
  - Friendly heading and message (no technical jargon)
  - Link back to home with proper styling and 44x44px touch target
  - Dark mode variants matching the rest of the app
  - Does NOT use `Layout` component (no sidebar, no search, no feed data needed)
  - Standalone page with its own minimal styling
- `src/pages/500.tsx` — static server error page
  - Friendly heading and message
  - No stack traces or error details exposed to users
  - Link back to home
  - Dark mode variants
  - Does NOT use `Layout` component

### 2. Favicons
- `public/favicon.ico` — standard ICO format favicon
- `public/favicon.svg` — SVG favicon for modern browsers
- Link tags in `_document.tsx` or `_app.tsx` pointing to both favicons

### 3. SEO metadata
- Add Open Graph tags to all pages: `og:title`, `og:description`, `og:type` (website)
- Verify existing page titles are correct:
  - Homepage: "RSS Reader"
  - Category pages: "{Category} — RSS Reader"
  - 404 page: "Page Not Found — RSS Reader"
  - 500 page: "Server Error — RSS Reader"
- Verify meta descriptions exist on all pages
- Add OG tags to the `<Head>` in each page

### 4. Visual polish pass
- Review spacing, typography, and card design across all pages
- Ensure consistent visual rhythm between components
- Check that skeleton cards match ArticleCard dimensions closely
- Review mobile layout for any spacing or overflow issues
- Verify the header looks balanced with search bar, theme toggle, and mobile nav

### 5. Final accessibility verification
- Verify `:focus-visible` indicators on all interactive elements in both themes
- Verify skip-to-content link works (focus it via Tab, press Enter, confirm focus moves to `#main-content`)
- Verify all pages are keyboard-navigable end-to-end
- Verify screen reader announcements (loading state, search results)

## Key requirements from the spec

- 404 page: static, link home, no technical details
- 500 page: static, no stack traces exposed
- Favicons: `public/favicon.ico` and `public/favicon.svg`
- `<html lang="en">` already set in `_document.tsx`
- OG tags: `og:title`, `og:description`, `og:type` (website) on all pages
- Page titles follow the pattern: "RSS Reader" / "{Category} — RSS Reader"

## Done when

- Navigating to a nonexistent route shows the custom 404 page with link home
- Triggering a server error shows the custom 500 page (no stack traces)
- Both error pages render correctly in light and dark mode
- Favicons appear in the browser tab
- Viewing page source shows correct `<title>`, meta description, and OG tags on all pages
- Visual polish is complete — spacing, typography, and layout look clean and consistent
- Skip-to-content link works correctly
- Focus indicators are visible in both themes on all interactive elements
