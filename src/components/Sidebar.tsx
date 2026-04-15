import Link from 'next/link';
import { useRouter } from 'next/router';
import { slugify } from '@/lib/slugify';

interface SidebarProps {
  categories: string[];
}

export function Sidebar({ categories }: SidebarProps) {
  const router = useRouter();
  const currentSlug = router.query.slug as string | undefined;

  return (
    <aside className="hidden w-56 shrink-0 md:block">
      <nav aria-label="Category navigation">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-100 dark:text-gray-400">
          Topics
        </h2>
        <ul className="space-y-1">
          <li>
            <Link
              href="/"
              aria-current={!currentSlug ? 'page' : undefined}
              className={`block min-h-[44px] rounded-md px-3 py-2.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                !currentSlug
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'text-gray-100 hover:bg-gray-500 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
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
                  aria-current={isActive ? 'page' : undefined}
                  className={`block min-h-[44px] rounded-md px-3 py-2.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                      : 'text-gray-100 hover:bg-gray-500 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {cat}
                </Link>
              </li>
            );
          })}
        </ul>

        {process.env.NODE_ENV !== 'production' && (
          <div className="mt-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-100 dark:text-gray-400">
              Admin
            </h2>
            <Link
              href="/admin"
              className="block min-h-[44px] rounded-md px-3 py-2.5 text-sm font-medium text-gray-100 hover:bg-gray-500 dark:text-gray-300 dark:hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              Manage Feeds
            </Link>
          </div>
        )}
      </nav>
    </aside>
  );
}
