# RSS Reader — Phase 4: Category Pages, Search & Dark Mode

Read `rss-reader-spec.md` and `PHASES.md` in the project root before starting. This is Phase 4 of 6. Phases 1–3 are complete.

Break after each major step and check in before continuing.

## What already exists

- Git repo with 3 commits (`.gitignore` → Phase 1-3 code → review fixes)
- Next.js 14.x with Pages Router, TypeScript, Tailwind CSS
- `next.config.mjs` with security headers (CSP, HSTS, X-Content-Type-Options), production-only to avoid blocking dev mode
- `feeds.public.json` with 4 starter feeds (Hacker News, Ars Technica, BBC News, NASA), validated by `ajv` + `husky` pre-commit hook
- `src/lib/types.ts` — `FeedItem`, `FailedFeed`, `FeedConfig`, `FeedApiResponse`
- `src/lib/feeds.ts` — merges public + private config with runtime validation via `isValidFeedConfig()` type guard
- `src/lib/rss.ts` — fetches/parses feeds with XXE mitigation, 5s timeout, `response.ok` check, `Promise.allSettled`
- `src/lib/sanitize.ts` — DOMPurify + jsdom server-side sanitization
- `src/lib/dates.ts` — RFC 822 + ISO 8601 date parsing
- `src/lib/slugify.ts` — shared slug generation utility
- `src/pages/api/feeds.ts` — API route with caching headers and 60s in-memory dedup
- `src/pages/_document.tsx` — `<html lang="en">`
- `src/pages/_app.tsx` — imports `globals.css`, skip-to-content link, ErrorBoundary wrapper
- `src/components/ErrorBoundary.tsx` — class component with `window.location.reload()` retry
- `src/components/Sidebar.tsx` — category navigation with `aria-current="page"`, uses shared `slugify()`
- `src/components/MobileNav.tsx` — hamburger menu with focus trap, Escape key, `role="dialog"`, `aria-modal`, focus return to trigger
- `src/components/ArticleCard.tsx` — title, source, category badge, relative date (full UTC on hover), description excerpt, external link with `target="_blank" rel="noopener noreferrer"`, `inline-block` for touch target
- `src/components/CategoryBadge.tsx` — styled category badge
- `src/components/SkeletonCard.tsx` — loading placeholder with `animate-pulse`
- `src/components/FeedErrorNotice.tsx` — `role="alert"` for screen readers
- `src/pages/index.tsx` — fetches `/api/feeds`, responsive grid (1/2/3 columns), skeleton loading, error notice, `role="status" aria-live="polite"` loading announcement
- `src/styles/globals.css` — Tailwind directives with `:focus-visible` base styles
- `tailwind.config.ts` — `darkMode: 'class'` already configured (but no dark mode classes applied yet)

## What to build in this phase

### 1. Category pages
- `src/pages/category/[slug].tsx` — filtered view showing only items matching the category
- Reuses the same layout (Sidebar, MobileNav, header) as the homepage
- Fetches from `/api/feeds` and filters client-side by category
- Page title: `"{Category} — RSS Reader"` via `<Head>`
- Meta description specific to the category
- Shows skeleton cards during loading, error notice for failed feeds
- If the slug doesn't match any category, show a "Category not found" message with link home

### 2. Search
- `src/components/SearchBar.tsx` — client-side search across already-fetched feed items
- Searches title, description, and source name fields
- Placed in the header area, accessible on all pages
- ARIA label on the search input
- Clear button with ARIA label, minimum 44x44px touch target
- `aria-live="polite"` region announcing result count to screen readers (e.g., "12 results for 'climate'")
- Search runs against already-fetched data — no additional server requests
- Keyboard accessible: Escape clears the search

### 3. Dark mode
- System preference detection via `window.matchMedia('(prefers-color-scheme: dark)')`
- Manual toggle button in the header with ARIA label (e.g., "Switch to dark mode" / "Switch to light mode")
- Toggle icon: sun/moon SVG, minimum 44x44px touch target
- Persist preference in `localStorage`
- Apply `dark` class to `<html>` element
- Add `dark:` variants to all existing components:
  - Background: `bg-gray-50` → `dark:bg-gray-900`
  - Cards: `bg-white` → `dark:bg-gray-800`, borders adjust accordingly
  - Text: `text-gray-900` → `dark:text-gray-100`, secondary text adjusts
  - Sidebar active state, badges, buttons all need dark variants
  - ErrorBoundary, FeedErrorNotice, SkeletonCard need dark variants
- Verify 4.5:1 contrast ratio (WCAG AA) in both themes

### 4. Accessibility verification pass
- All ARIA labels on icon-only buttons (dark mode toggle, hamburger, search clear)
- Full keyboard navigation: Tab through all interactive elements, Enter to activate, Escape to dismiss menus/clear search
- Minimum 44x44px touch targets on all interactive elements
- Focus indicators visible in both light and dark themes

## Key requirements from the spec

- Search results announced to screen readers via `aria-live="polite"` region
- Dark mode via Tailwind `dark:` classes with system preference respected by default
- Manual dark mode toggle available in the UI
- Category view at `/category/[slug]` with filtered items
- 4.5:1 color contrast ratio in both themes (WCAG AA)

## Done when

- Category pages filter and display items correctly at `/category/[slug]`
- Sidebar category links navigate to working category pages
- Client-side search filters items across title, description, and source
- Search results are announced to screen readers
- Dark mode toggles between light and dark themes
- System color scheme preference is detected and respected
- Manual toggle persists preference in localStorage
- All interactive elements have proper ARIA labels and 44x44px touch targets
- Keyboard navigation works throughout (Tab, Enter, Escape)
- 4.5:1 contrast ratio maintained in both themes
