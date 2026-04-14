import Link from 'next/link';
import { useRouter } from 'next/router';

interface SidebarProps {
  categories: string[];
}

export function Sidebar({ categories }: SidebarProps) {
  const router = useRouter();
  const currentSlug = router.query.slug as string | undefined;

  return (
    <aside className="hidden w-56 shrink-0 md:block">
      <nav aria-label="Category navigation">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Categories
        </h2>
        <ul className="space-y-1">
          <li>
            <Link
              href="/"
              className={`block min-h-[44px] rounded-md px-3 py-2.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                !currentSlug
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Feeds
            </Link>
          </li>
          {categories.map((cat) => {
            const slug = cat.toLowerCase().replace(/\s+/g, '-');
            const isActive = currentSlug === slug;
            return (
              <li key={cat}>
                <Link
                  href={`/category/${slug}`}
                  className={`block min-h-[44px] rounded-md px-3 py-2.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {cat}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
