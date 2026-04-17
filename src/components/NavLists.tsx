import Link from 'next/link';
import { slugify } from '@/lib/slugify';

interface NavListsProps {
  activeTab: 'topics' | 'sources';
  categories: string[];
  sources: string[];
  currentSlug: string | undefined;
  currentSource: string | null;
  /** Called after a link is clicked (e.g. to close a mobile drawer). */
  onLinkClick?: () => void;
  /** Visual variant — drives text color against the surrounding background. */
  variant: 'sidebar' | 'mobile';
}

/**
 * Shared Topics / Sources list rendering used by Sidebar (desktop) and
 * MobileNav (drawer). Handles the active-state highlight rules for both
 * topic filters (category pages) and source filters (`?source=` on home).
 */
export function NavLists({
  activeTab,
  categories,
  sources,
  currentSlug,
  currentSource,
  onLinkClick,
  variant,
}: NavListsProps) {
  // Active-highlight class is identical across variants — the orange border.
  const activeClass =
    'border-l-2 border-orange-400 pl-[10px] font-semibold ' +
    (variant === 'sidebar' ? 'text-white' : 'text-gray-900 dark:text-gray-100');

  const inactiveClass =
    variant === 'sidebar'
      ? 'text-gray-100 hover:bg-gray-500 dark:text-gray-300 dark:hover:bg-gray-800'
      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700';

  const focusClass =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500';

  // Topics keep a 44px min touch target; Sources use tighter spacing because
  // the list is longer and denser reads better for scanning.
  const topicLinkClass =
    `block min-h-[44px] rounded-md px-3 py-2.5 text-sm font-medium ${focusClass}`;
  const sourceLinkClass =
    `block rounded-md px-3 py-1.5 text-sm font-medium ${focusClass}`;

  // "All Topics" is only active when neither a category slug nor a source filter is applied.
  const allTopicsActive = !currentSlug && !currentSource;

  if (activeTab === 'topics') {
    return (
      <ul className="space-y-1">
        <li>
          <Link
            href="/"
            onClick={onLinkClick}
            aria-current={allTopicsActive ? 'page' : undefined}
            className={`${topicLinkClass} ${allTopicsActive ? activeClass : inactiveClass}`}
          >
            All Topics
          </Link>
        </li>
        {categories.map((cat) => {
          const slug = slugify(cat);
          const isActive = currentSlug === slug;
          return (
            <li key={cat}>
              <Link
                href={`/category/${slug}`}
                onClick={onLinkClick}
                aria-current={isActive ? 'page' : undefined}
                className={`${topicLinkClass} ${isActive ? activeClass : inactiveClass}`}
              >
                {cat}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul>
      {sources.map((source) => {
        const isActive = currentSource === source;
        return (
          <li key={source}>
            <Link
              href={isActive ? '/' : { pathname: '/', query: { source } }}
              onClick={onLinkClick}
              aria-current={isActive ? 'page' : undefined}
              className={`${sourceLinkClass} ${isActive ? activeClass : inactiveClass}`}
            >
              {source}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
